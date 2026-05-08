const User = require('../models/User');
const Location = require('../models/Location');
const Table = require('../models/Table');

const getProfilePicValue = (file) => {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
};

// ─── SEARCH (JustDial style) ──────────────────────────────────────────────────
exports.searchUsers = async (req, res) => {
  try {
    const { q, location, table, category } = req.query;
    const hasFilters = Boolean(location || table || category);
    const searchTerm = (q || '').trim();
    if (!hasFilters && searchTerm.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters or include a filter' });
    }

    const searchRegex = searchTerm ? new RegExp(searchTerm, 'i') : null;

    const query = {
      status: 'Approved',
      role: { $ne: 'Super Admin' }
    };

    if (searchRegex) {
      query.$or = [
        { keywords: { $in: [searchRegex] } },
        { profileName: searchRegex },
        { websiteName: searchRegex },
        { businessCategory: searchRegex },
        { businessName: searchRegex },
        { businessService: searchRegex },
        { businessDescription: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex }
      ];
    }

    if (location) query.locationName = new RegExp(location, 'i');
    if (table) query.tableName = new RegExp(table, 'i');
    if (category) query.businessCategory = new RegExp(category, 'i');

    const members = await User.find(query)
      .select('firstName lastName membershipId businessName profileName websiteName slug businessCategory businessService businessDescription businessWebsite profilePic keywords locationName tableName phone email totalRevenue totalConnections averageRating ratingsCount')
      .limit(50)
      .sort('locationName firstName');

    // Group by location alphabetically
    const grouped = {};
    members.forEach(m => {
      const loc = m.locationName || 'Unknown';
      if (!grouped[loc]) grouped[loc] = [];
      grouped[loc].push(m);
    });

    const result = Object.keys(grouped).sort().map(loc => ({
      location: loc,
      members: grouped[loc].sort((a, b) => a.firstName.localeCompare(b.firstName))
    }));

    res.json({ query: searchTerm, totalResults: members.length, results: result });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};

// ─── GET USER PROFILE ─────────────────────────────────────────────────────────
exports.getSearchFilters = async (req, res) => {
  try {
    const { location, table } = req.query;
    const query = {
      status: 'Approved',
      role: { $ne: 'Super Admin' }
    };

    if (location) query.locationName = location;
    if (table) query.tableName = table;

    const [categories, tables] = await Promise.all([
      User.distinct('businessCategory', query),
      User.distinct('tableName', query)
    ]);

    res.json({
      categories: (categories || []).filter(Boolean).sort((a, b) => a.localeCompare(b)),
      tables: (tables || []).filter(Boolean).sort((a, b) => a.localeCompare(b))
    });
  } catch (err) {
    res.status(500).json({ message: 'Fetch search filters failed', error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const user = await User.findById(userId)
      .select('-password -aadharNumber -panNumber -resetPasswordToken -resetPasswordExpires')
      .populate('locationId', 'name code')
      .populate('tableId', 'name');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Fetch profile failed', error: err.message });
  }
};

// Public member detail for search/business listing pages
exports.getPublicMemberProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({
      _id: userId,
      status: 'Approved',
      role: { $ne: 'Super Admin' }
    })
      .select('firstName lastName membershipId role subRole businessName profileName websiteName slug businessCategory businessService businessDescription businessWebsite profilePic keywords locationName tableName phone email totalRevenue totalConnections givenRequests receivedRequests meetingsAttended averageRating ratingsCount');

    if (!user) return res.status(404).json({ message: 'Member not found' });
    res.json({ member: user });
  } catch (err) {
    res.status(500).json({ message: 'Fetch public member failed', error: err.message });
  }
};

exports.getPublicProfileBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findOne({
      slug: String(slug || '').toLowerCase(),
      status: 'Approved',
      role: { $ne: 'Super Admin' }
    })
      .select('firstName lastName membershipId role subRole businessName profileName websiteName slug businessCategory businessService businessDescription businessWebsite profilePic keywords locationName tableName phone email totalRevenue totalConnections givenRequests receivedRequests meetingsAttended averageRating ratingsCount');

    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ member: user });
  } catch (err) {
    res.status(500).json({ message: 'Fetch public profile failed', error: err.message });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'businessName', 'profileName',
      'businessDescription', 'businessService', 'businessWebsite', 'keywords'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) updates.profilePic = getProfilePicValue(req.file);

    const user = await User.findById(userId).select('-password -aadharNumber -panNumber');
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.entries(updates).forEach(([key, value]) => {
      user[key] = value;
    });

    await user.save();

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Update profile failed', error: err.message });
  }
};

// ─── USERS BY LOCATION ────────────────────────────────────────────────────────
exports.getUsersByLocation = async (req, res) => {
  try {
    const locationId = req.query.locationId || req.user.locationId;
    const members = await User.find({ locationId, status: 'Approved' })
      .select('firstName lastName membershipId role subRole businessName businessCategory profilePic tableName totalRevenue totalConnections givenRequests receivedRequests averageRating ratingsCount')
      .sort('firstName');
    res.json({ count: members.length, members });
  } catch (err) {
    res.status(500).json({ message: 'Fetch members failed', error: err.message });
  }
};

// ─── USERS BY TABLE ───────────────────────────────────────────────────────────
exports.getUsersByTable = async (req, res) => {
  try {
    const tableId = req.query.tableId || req.user.tableId;
    const members = await User.find({ tableId, status: 'Approved' })
      .select('firstName lastName membershipId role subRole businessName businessCategory businessService businessDescription businessWebsite profilePic phone email locationName tableName totalRevenue totalConnections givenRequests receivedRequests averageRating ratingsCount')
      .sort('firstName');
    res.json({ count: members.length, members });
  } catch (err) {
    res.status(500).json({ message: 'Fetch table members failed', error: err.message });
  }
};

// ─── PENDING APPROVALS ────────────────────────────────────────────────────────
exports.getPendingApprovals = async (req, res) => {
  try {
    const chairman = req.user;
    const query = { status: 'Pending' };
    if (chairman.role === 'Chairman') query.locationId = chairman.locationId;
    
    const pending = await User.find(query)
      .select('-password')
      .populate('locationId', 'name code')
      .sort('createdAt');
    res.json({ count: pending.length, members: pending });
  } catch (err) {
    res.status(500).json({ message: 'Fetch pending failed', error: err.message });
  }
};

// ─── ASSIGN SUB-ROLE (Chairman assigns Vice Chairman / Director / Treasurer badge) ───
exports.assignRole = async (req, res) => {
  try {
    const { userId, subRole } = req.body;
    const assigner = req.user;

    const validSubRoles = ['Vice Chairman', 'Director', 'Treasurer', null];
    if (!validSubRoles.includes(subRole)) {
      return res.status(400).json({ message: 'Invalid sub-role' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (assigner.role === 'Chairman' && user.locationId?.toString() !== assigner.locationId?.toString()) {
      return res.status(403).json({ message: 'You can only assign roles in your location' });
    }

    user.subRole = subRole;
    await user.save();

    res.json({ message: `Sub-role ${subRole || 'cleared'} assigned to ${user.firstName}`, user: { _id: user._id, subRole: user.subRole } });
  } catch (err) {
    res.status(500).json({ message: 'Assign role failed', error: err.message });
  }
};

// ─── GET ALL USERS (Super Admin) ──────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { status, role, locationId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (locationId) query.locationId = locationId;

    const users = await User.find(query)
      .select('-password -aadharNumber -panNumber')
      .populate('locationId', 'name')
      .sort('firstName')
      .limit(200);

    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: 'Fetch all users failed', error: err.message });
  }
};

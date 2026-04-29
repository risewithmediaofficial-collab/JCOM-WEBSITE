const User = require('../models/User');
const Location = require('../models/Location');
const Table = require('../models/Table');
const CRMEntry = require('../models/CRMEntry');
const Connection = require('../models/Connection');
const Deal = require('../models/Deal');
const Meeting = require('../models/Meeting');
const {
  getMemberCountsByLocation,
  getConnectionCountsByLocation,
  getDealRevenueByLocation,
  getStandaloneCRMRevenueByLocation,
  getTotalCompletedRevenue
} = require('../utils/liveStats');

// ─── LOCATION MANAGEMENT ─────────────────────────────────────────────────────

exports.createLocation = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });

    const existing = await Location.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (existing) return res.status(400).json({ message: 'Location name or code already exists' });

    const location = await Location.create({ name, code: code.toUpperCase(), createdBy: req.user._id });
    res.status(201).json({ message: 'Location created', location });
  } catch (err) {
    res.status(500).json({ message: 'Create location failed', error: err.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true })
      .populate('chairmanId', 'firstName lastName membershipId email')
      .sort('name');
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ message: 'Fetch locations failed', error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const updates = req.body;
    const location = await Location.findByIdAndUpdate(locationId, updates, { new: true });
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json({ message: 'Location updated', location });
  } catch (err) {
    res.status(500).json({ message: 'Update location failed', error: err.message });
  }
};

// ─── TABLE MANAGEMENT ────────────────────────────────────────────────────────

exports.createTable = async (req, res) => {
  try {
    const { locationId, name, capacity } = req.body;
    if (!locationId || !name) return res.status(400).json({ message: 'LocationId and name are required' });

    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    const existing = await Table.findOne({ locationId, name });
    if (existing) return res.status(400).json({ message: `Table ${name} already exists in this location` });

    const table = await Table.create({
      locationId, name, locationName: location.name,
      capacity: capacity || 60,
      createdBy: req.user._id
    });

    location.totalTables += 1;
    await location.save();

    res.status(201).json({ message: 'Table created', table });
  } catch (err) {
    res.status(500).json({ message: 'Create table failed', error: err.message });
  }
};

exports.getTablesByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const tables = await Table.find({ locationId, isActive: true })
      .select('name capacity currentCount businessCategories locationName')
      .sort('name');
    res.json({ tables });
  } catch (err) {
    res.status(500).json({ message: 'Fetch tables failed', error: err.message });
  }
};

// ─── CHAIRMAN MANAGEMENT ─────────────────────────────────────────────────────

exports.createChairman = async (req, res) => {
  try {
    const { userId, locationId, year } = req.body;
    if (!userId || !locationId) {
      return res.status(400).json({ message: 'userId and locationId are required' });
    }

    const [user, location] = await Promise.all([
      User.findById(userId),
      Location.findById(locationId)
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!location) return res.status(404).json({ message: 'Location not found' });

    // If location already has a chairman, archive them first
    if (location.chairmanId) {
      const prevChairman = await User.findById(location.chairmanId);
      if (prevChairman) {
        prevChairman.role = 'Member';
        prevChairman.annualRoles.push({
          year: location.chairmanYear || new Date().getFullYear() - 1,
          role: 'Chairman',
          location: location.name,
          locationId: location._id,
          archivedAt: new Date()
        });
        await prevChairman.save();

        location.previousChairmen.push({
          userId: prevChairman._id,
          name: `${prevChairman.firstName} ${prevChairman.lastName}`,
          membershipId: prevChairman.membershipId,
          year: location.chairmanYear,
          startDate: location.chairmanStartDate,
          endDate: new Date()
        });
      }
    }

    // Set new chairman
    const thisYear = year || new Date().getFullYear();
    user.role = 'Chairman';
    user.locationId = location._id;
    user.locationName = location.name;
    if (user.status !== 'Approved') {
      user.status = 'Approved';
      user.membershipId = user.membershipId || `JCOM-${location.code}-CHR-${thisYear}`;
    }
    await user.save();

    location.chairmanId = user._id;
    location.chairmanYear = thisYear;
    location.chairmanStartDate = new Date();
    location.chairmanRenewalDate = new Date(thisYear + 1, 0, 1); // Jan 1 next year
    await location.save();

    res.json({
      message: `${user.firstName} ${user.lastName} assigned as Chairman of ${location.name} for ${thisYear}`,
      user: { _id: user._id, name: `${user.firstName} ${user.lastName}`, membershipId: user.membershipId, role: user.role },
      location: { _id: location._id, name: location.name, chairmanYear: thisYear }
    });
  } catch (err) {
    res.status(500).json({ message: 'Create chairman failed', error: err.message });
  }
};

exports.rotateChairman = async (req, res) => {
  try {
    const { locationId, newChairmanUserId, year } = req.body;
    // Reuse createChairman logic
    req.body = { userId: newChairmanUserId, locationId, year };
    return exports.createChairman(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Rotate chairman failed', error: err.message });
  }
};

// ─── FULL SYSTEM STATS (Super Admin) ─────────────────────────────────────────

exports.getFullStats = async (req, res) => {
  try {
    const [totalLocations, totalMembers, pendingMembers, locations, totalRevenue, memberCounts, connectionCounts, dealRevenueByLocation, crmRevenueByLocation] = await Promise.all([
      Location.countDocuments({ isActive: true }),
      User.countDocuments({ status: 'Approved', role: { $ne: 'Super Admin' } }),
      User.countDocuments({ status: 'Pending' }),
      Location.find({ isActive: true }).populate('chairmanId', 'firstName lastName membershipId'),
      getTotalCompletedRevenue(),
      getMemberCountsByLocation(),
      getConnectionCountsByLocation(),
      getDealRevenueByLocation(),
      getStandaloneCRMRevenueByLocation()
    ]);

    res.json({
      totalLocations,
      totalMembers,
      pendingMembers,
      totalRevenue,
      locations: locations.map(l => ({
        _id: l._id, name: l.name, code: l.code,
        totalMembers: memberCounts.get(String(l._id)) || 0,
        totalConnections: connectionCounts.get(String(l._id)) || 0,
        totalRevenue: (dealRevenueByLocation.get(String(l._id)) || 0) + (crmRevenueByLocation.get(String(l._id)) || 0),
        chairmanName: l.chairmanId ? `${l.chairmanId.firstName} ${l.chairmanId.lastName}` : 'Not Assigned',
        chairmanYear: l.chairmanYear
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Fetch stats failed', error: err.message });
  }
};

// ─── PENDING APPROVALS (Chairman) ────────────────────────────────────────────

exports.getPendingApprovals = async (req, res) => {
  try {
    const caller = req.user;
    let query = { status: 'Pending' };

    // Chairman sees only their location's pending members
    if (caller.role === 'Chairman' && caller.locationId) {
      query.locationId = caller.locationId;
    }
    // Super Admin sees ALL pending members regardless of location

    const pending = await User.find(query)
      .select('firstName lastName email phone profilePic businessName businessCategory businessService businessWebsite keywords locationId locationName tableId tableName aadharNumber panNumber createdAt')
      .sort('createdAt');

    res.json({ count: pending.length, members: pending });
  } catch (err) {
    res.status(500).json({ message: 'Fetch pending approvals failed', error: err.message });
  }
};

// ─── ALL MEMBERS IN LOCATION ──────────────────────────────────────────────────

exports.getMembersByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const members = await User.find({ locationId, status: 'Approved' })
      .select('firstName lastName membershipId role subRole businessName businessCategory profilePic tableName totalRevenue totalConnections')
      .sort('firstName');
    res.json({ count: members.length, members });
  } catch (err) {
    res.status(500).json({ message: 'Fetch members failed', error: err.message });
  }
};

// ─── MEMBER-WISE CRM SUMMARY (Super Admin) ──────────────────────────────────
exports.getCRMMemberOverview = async (req, res) => {
  try {
    const members = await User.find({ status: 'Approved', role: { $ne: 'Super Admin' } })
      .select('firstName lastName email phone membershipId role subRole locationId locationName tableName businessName businessCategory businessService totalRevenue totalConnections givenRequests receivedRequests meetingsAttended')
      .sort('firstName');

    const [locations, memberCounts, connectionCountsByLocation, dealRevenueByLocation, crmRevenueByLocation, crmStats, userConnectionStats, userRevenueStats, userMeetingStats, userRequestStats] = await Promise.all([
      Location.find({ isActive: true }).select('name code'),
      getMemberCountsByLocation(),
      getConnectionCountsByLocation(),
      getDealRevenueByLocation(),
      getStandaloneCRMRevenueByLocation(),
      CRMEntry.aggregate([
        {
          $group: {
            _id: '$ownerId',
            totalEntries: { $sum: 1 },
            totalValue: { $sum: { $ifNull: ['$confirmedValue', 0] } },
            pendingValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
            spoke: { $sum: { $cond: ['$spoke', 1, 0] } },
            leads: { $sum: { $cond: [{ $eq: ['$status', 'Lead'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'InProgress'] }, 1, 0] } },
            reconnect: { $sum: { $cond: [{ $eq: ['$status', 'Reconnect'] }, 1, 0] } },
            refollow: { $sum: { $cond: [{ $eq: ['$status', 'Refollow'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
            manualLeads: { $sum: { $cond: ['$isManual', 1, 0] } }
          }
        }
      ]),
      Connection.aggregate([
        { $match: { status: 'Connected' } },
        { $project: { userIds: ['$fromUser', '$toUser'] } },
        { $unwind: '$userIds' },
        { $group: { _id: '$userIds', totalConnections: { $sum: 1 } } }
      ]),
      Promise.all([
        Deal.aggregate([
          { $match: { status: 'Completed' } },
          { $project: { amount: 1, userIds: ['$fromUser', '$toUser'] } },
          { $unwind: '$userIds' },
          { $group: { _id: '$userIds', totalRevenue: { $sum: '$amount' } } }
        ]),
        CRMEntry.aggregate([
          {
            $match: {
              status: 'Completed',
              workCompleted: true,
              confirmedValue: { $gt: 0 },
              dealId: null
            }
          },
          { $group: { _id: '$ownerId', totalRevenue: { $sum: '$confirmedValue' } } }
        ])
      ]),
      Meeting.aggregate([
        { $unwind: '$attendees' },
        { $group: { _id: '$attendees', meetingsAttended: { $sum: 1 } } }
      ]),
      Connection.aggregate([
        {
          $facet: {
            given: [
              { $group: { _id: '$fromUser', givenRequests: { $sum: 1 } } }
            ],
            received: [
              { $group: { _id: '$toUser', receivedRequests: { $sum: 1 } } }
            ]
          }
        }
      ])
    ]);

    const [dealRevenueRows, standaloneRevenueRows] = userRevenueStats;
    const crmMap = new Map(crmStats.map((item) => [String(item._id), item]));
    const connectionMap = new Map(userConnectionStats.map((item) => [String(item._id), item.totalConnections || 0]));
    const meetingMap = new Map(userMeetingStats.map((item) => [String(item._id), item.meetingsAttended || 0]));
    const dealRevenueMap = new Map(dealRevenueRows.map((item) => [String(item._id), item.totalRevenue || 0]));
    const standaloneRevenueMap = new Map(standaloneRevenueRows.map((item) => [String(item._id), item.totalRevenue || 0]));
    const givenRequestMap = new Map((userRequestStats[0]?.given || []).map((item) => [String(item._id), item.givenRequests || 0]));
    const receivedRequestMap = new Map((userRequestStats[0]?.received || []).map((item) => [String(item._id), item.receivedRequests || 0]));

    const crmMembers = members.map((member) => {
      const stats = crmMap.get(String(member._id)) || {};
      const liveRevenue = (dealRevenueMap.get(String(member._id)) || 0) + (standaloneRevenueMap.get(String(member._id)) || 0);
      return {
        _id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        membershipId: member.membershipId,
        role: member.role,
        subRole: member.subRole,
        locationId: member.locationId,
        locationName: member.locationName,
        tableName: member.tableName,
        businessName: member.businessName,
        businessCategory: member.businessCategory,
        businessService: member.businessService,
        totalRevenue: liveRevenue || member.totalRevenue || 0,
        totalConnections: connectionMap.get(String(member._id)) || member.totalConnections || 0,
        givenRequests: givenRequestMap.get(String(member._id)) || member.givenRequests || 0,
        receivedRequests: receivedRequestMap.get(String(member._id)) || member.receivedRequests || 0,
        meetingsAttended: meetingMap.get(String(member._id)) || member.meetingsAttended || 0,
        crm: {
          totalEntries: stats.totalEntries || 0,
          totalValue: stats.totalValue || 0,
          pendingValue: stats.pendingValue || 0,
          spoke: stats.spoke || 0,
          leads: stats.leads || 0,
          inProgress: stats.inProgress || 0,
          reconnect: stats.reconnect || 0,
          refollow: stats.refollow || 0,
          completed: stats.completed || 0,
          cancelled: stats.cancelled || 0,
          manualLeads: stats.manualLeads || 0
        }
      };
    });

    const locationStatsMap = new Map();
    crmMembers.forEach((member) => {
      const locationKey = member.locationId ? String(member.locationId) : member.locationName || 'unknown';
      const current = locationStatsMap.get(locationKey) || {
        locationId: member.locationId || null,
        name: member.locationName || 'Unknown',
        members: 0,
        leads: 0,
        completed: 0,
        attendance: 0
      };

      current.members += 1;
      current.leads += member.crm.totalEntries || 0;
      current.completed += member.crm.completed || 0;
      current.attendance += member.meetingsAttended || 0;
      locationStatsMap.set(locationKey, current);
    });

    const locationOverviewMap = new Map();

    locations.forEach((location) => {
      const live = locationStatsMap.get(String(location._id)) || {
        members: memberCounts.get(String(location._id)) || 0,
        leads: 0,
        completed: 0,
        attendance: 0
      };
      locationOverviewMap.set(String(location._id), {
        _id: location._id,
        name: location.name,
        code: location.code,
        totalMembers: live.members || memberCounts.get(String(location._id)) || 0,
        totalConnections: connectionCountsByLocation.get(String(location._id)) || 0,
        totalRevenue: (dealRevenueByLocation.get(String(location._id)) || 0) + (crmRevenueByLocation.get(String(location._id)) || 0),
        totalLeads: live.leads || 0,
        completed: live.completed || 0,
        attendance: live.attendance || 0
      });
    });

    crmMembers.forEach((member) => {
      if (!member.locationName) return;
      const key = member.locationId ? String(member.locationId) : member.locationName.trim().toLowerCase();
      if (locationOverviewMap.has(key)) return;

      const siblingMembers = crmMembers.filter((item) => (
        item.locationId
          ? String(item.locationId) === String(member.locationId)
          : String(item.locationName || '').trim().toLowerCase() === String(member.locationName || '').trim().toLowerCase()
      ));

      locationOverviewMap.set(key, {
        _id: member.locationId || key,
        name: member.locationName,
        code: '',
        totalMembers: siblingMembers.length,
        totalConnections: siblingMembers.reduce((sum, item) => sum + (item.totalConnections || 0), 0),
        totalRevenue: siblingMembers.reduce((sum, item) => sum + (item.totalRevenue || 0), 0),
        totalLeads: siblingMembers.reduce((sum, item) => sum + (item.crm?.totalEntries || 0), 0),
        completed: siblingMembers.reduce((sum, item) => sum + (item.crm?.completed || 0), 0),
        attendance: siblingMembers.reduce((sum, item) => sum + (item.meetingsAttended || 0), 0)
      });
    });

    const locationOverview = Array.from(locationOverviewMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      totalMembers: crmMembers.length,
      crmMembers,
      locations: locationOverview
    });
  } catch (err) {
    res.status(500).json({ message: 'Fetch CRM member overview failed', error: err.message });
  }
};

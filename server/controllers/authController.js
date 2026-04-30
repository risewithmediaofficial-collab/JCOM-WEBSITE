const User = require('../models/User');
const Location = require('../models/Location');
const Table = require('../models/Table');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getProfilePicValue = (file) => {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
};

const generateMembershipId = (locationCode, year, sequence) => {
  const seq = String(sequence).padStart(4, '0');
  return `JCOM-${locationCode}-${year}-${seq}`;
};

// ─── SEED SUPER ADMIN ────────────────────────────────────────────────────────
exports.seedSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'Super Admin' });
    if (existing) return;
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@jcom.in',
      phone: '9999999999',
      businessName: 'JCOM Administration',
      businessCategory: 'Administration',
      locationName: 'Head Office',
      role: 'Super Admin',
      status: 'Approved',
      membershipId: 'JCOM-ADMIN-0001',
      password: process.env.SUPER_ADMIN_PASSWORD || 'JCOM@2026'
    });
    await superAdmin.save();
    console.log('✅ Super Admin seeded → email:', superAdmin.email, '| password: JCOM@2026');
  } catch (err) {
    console.error('Seed Super Admin error:', err);
  }
};

// ─── REGISTER (new member) ───────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      locationId, tableId,
      aadharNumber, panNumber,
      businessName, businessCategory, businessDescription,
      businessService, businessWebsite, keywords
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !locationId || !businessName || !businessCategory) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: 'Email already registered' });

    const table = tableId ? await Table.findById(tableId) : null;
    if (tableId && !table) return res.status(400).json({ message: 'Invalid table selected' });
    if (table && table.currentCount >= table.capacity) {
      return res.status(400).json({ message: 'Selected table is full (60 members)' });
    }

    const location = await Location.findById(locationId);
    if (!location) return res.status(400).json({ message: 'Invalid location' });

    const profilePic = getProfilePicValue(req.file);

    const user = new User({
      firstName, lastName, email, phone,
      profilePic,
      locationId, locationName: location.name,
      tableId: table ? table._id : null,
      tableName: table ? table.name : null,
      aadharNumber, panNumber,
      businessName, businessCategory,
      businessDescription: businessDescription || '',
      businessService: businessService || '',
      businessWebsite: businessWebsite || null,
      keywords: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []),
      role: 'Member',
      status: 'Pending'
    });

    await user.save();

    res.status(201).json({
      message: 'Registration submitted successfully. Awaiting chairman approval.',
      userId: user._id,
      locationName: location.name
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email OR membershipId

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    const isEmail = identifier.includes('@');
    const user = await User.findOne(
      isEmail ? { email: identifier.toLowerCase() } : { membershipId: identifier }
    ).select('+password');

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.status === 'Pending') {
      return res.status(403).json({ message: 'Your account is pending chairman approval' });
    }
    if (user.status === 'Rejected') {
      return res.status(403).json({ message: 'Your account was rejected. Contact your chairman.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id, user.role);

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      membershipId: user.membershipId,
      role: user.role,
      subRole: user.subRole,
      status: user.status,
      locationId: user.locationId,
      locationName: user.locationName,
      tableId: user.tableId,
      tableName: user.tableName,
      profilePic: user.profilePic
    };

    // Role-based dashboard redirect hint
    const dashboardMap = {
      'Super Admin': '/super-admin',
      'Chairman': '/chairman',
      'Vice Chairman': '/dashboard',
      'Director': '/dashboard',
      'Treasurer': '/dashboard',
      'Member': '/dashboard'
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse,
      redirectTo: dashboardMap[user.role] || '/dashboard'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// ─── APPROVE USER (Chairman / Super Admin) ───────────────────────────────────
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tableId, notes } = req.body;
    const approver = req.user;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status !== 'Pending') {
      return res.status(400).json({ message: 'User is not in pending state' });
    }

    // Chairman can only approve users in their location
    if (approver.role === 'Chairman' && user.locationId?.toString() !== approver.locationId?.toString()) {
      return res.status(403).json({ message: 'You can only approve members in your location' });
    }

    // Assign table if provided
    let table = null;
    if (tableId) {
      table = await Table.findById(tableId);
      if (table && table.currentCount < table.capacity) {
        user.tableId = table._id;
        user.tableName = table.name;
        table.memberIds.push(user._id);
        table.currentCount += 1;
        if (!table.businessCategories.includes(user.businessCategory)) {
          table.businessCategories.push(user.businessCategory);
        }
        await table.save();
      }
    }

    // Generate membershipId
    const location = await Location.findById(user.locationId);
    const locationCode = location ? location.code : 'GEN';
    const year = new Date().getFullYear();
    const count = await User.countDocuments({ locationId: user.locationId, status: 'Approved' });
    const membershipId = generateMembershipId(locationCode, year, count + 1);

    // Generate temp password
    const tempPassword = `JCOM${Math.floor(100000 + Math.random() * 900000)}`;

    user.membershipId = membershipId;
    user.password = tempPassword; // will be hashed by pre-save hook
    user.status = 'Approved';
    user.approvedBy = approver._id;
    user.approvedAt = new Date();

    await user.save();

    // Update location member count
    if (location) {
      location.totalMembers += 1;
      await location.save();
    }

    res.json({
      message: 'Member approved successfully',
      membershipId,
      tempPassword,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        membershipId,
        tableName: user.tableName
      }
    });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
};

// ─── REJECT USER ─────────────────────────────────────────────────────────────
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const approver = req.user;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (approver.role === 'Chairman' && user.locationId?.toString() !== approver.locationId?.toString()) {
      return res.status(403).json({ message: 'You can only reject members in your location' });
    }

    user.status = 'Rejected';
    user.rejectionReason = reason || 'Application rejected';
    user.approvedBy = approver._id;
    await user.save();

    res.json({ message: 'User rejected', userId });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
};

// ─── FORGOT PASSWORD (reset using old password) ──────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const isEmail = identifier?.includes('@');
    const user = await User.findOne(
      isEmail ? { email: identifier.toLowerCase() } : { membershipId: identifier }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save({ validateBeforeSave: false });

    // In production: send email. For now, return token directly (dev mode)
    res.json({
      message: 'Password reset token generated (dev mode - use this token)',
      resetToken,
      note: 'In production this would be emailed'
    });
  } catch (err) {
    res.status(500).json({ message: 'Forgot password failed', error: err.message });
  }
};

// ─── CHANGE PASSWORD (using old password) ────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Change password failed', error: err.message });
  }
};

// ─── RESET PASSWORD (with token) ─────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful. Please login.' });
  } catch (err) {
    res.status(500).json({ message: 'Reset password failed', error: err.message });
  }
};

const CRMEntry = require('../models/CRMEntry');
const Connection = require('../models/Connection');
const User = require('../models/User');

// ─── GET CRM DASHBOARD ────────────────────────────────────────────────────────
exports.getCRMDashboard = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { status, dateFrom, dateTo } = req.query;

    const query = { ownerId };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const entries = await CRMEntry.find(query)
      .populate('contactId', 'firstName lastName businessName businessCategory profilePic membershipId phone email locationName tableName')
      .populate('connectionId', 'status createdAt')
      .populate('dealId', 'amount status completedAt')
      .sort('-updatedAt');

    // Summary stats
    const stats = {
      total: entries.length,
      spoke: entries.filter(e => e.spoke).length,
      leads: entries.filter(e => e.status === 'Lead').length,
      inProgress: entries.filter(e => e.status === 'InProgress').length,
      reconnect: entries.filter(e => e.status === 'Reconnect').length,
      refollow: entries.filter(e => e.status === 'Refollow').length,
      completed: entries.filter(e => e.status === 'Completed').length,
      totalValue: entries.reduce((s, e) => s + (e.confirmedValue || 0), 0),
      pendingValue: entries.reduce((s, e) => s + (e.estimatedValue || 0), 0)
    };

    res.json({ stats, entries });
  } catch (err) {
    res.status(500).json({ message: 'Fetch CRM dashboard failed', error: err.message });
  }
};

// ─── UPDATE CRM ENTRY ──────────────────────────────────────────────────────────
exports.updateCRMEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const {
      spoke, followUpDate, followUpNotes,
      status, estimatedValue, confirmedValue,
      workCompleted, notes,
      // manual contact fields update
      manualContact
    } = req.body;

    const entry = await CRMEntry.findOne({ _id: entryId, ownerId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'CRM entry not found' });

    if (spoke !== undefined) {
      entry.spoke = spoke;
      if (spoke && !entry.spokeAt) entry.spokeAt = new Date();
    }
    if (status) entry.status = status;
    if (estimatedValue !== undefined) entry.estimatedValue = estimatedValue;
    if (confirmedValue !== undefined) entry.confirmedValue = confirmedValue;
    if (notes !== undefined) entry.notes = notes;
    if (workCompleted !== undefined) {
      entry.workCompleted = workCompleted;
      if (workCompleted) entry.workCompletedAt = new Date();
    }

    // Allow updating manual contact details
    if (entry.isManual && manualContact) {
      entry.manualContact = { ...entry.manualContact.toObject(), ...manualContact };
    }

    if (followUpDate) {
      entry.followUps.push({ date: new Date(followUpDate), notes: followUpNotes || '' });
      entry.nextFollowUpDate = new Date(followUpDate);
    }

    await entry.save();
    res.json({ message: 'CRM entry updated', entry });
  } catch (err) {
    res.status(500).json({ message: 'Update CRM entry failed', error: err.message });
  }
};

// ─── CONVERT CONNECTION TO LEAD ───────────────────────────────────────────────
exports.convertToLead = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { estimatedValue, notes } = req.body;
    const ownerId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });

    const contactId = connection.fromUser.toString() === ownerId.toString()
      ? connection.toUser : connection.fromUser;

    let entry = await CRMEntry.findOne({ ownerId, contactId });
    if (entry) {
      entry.status = 'Lead';
      entry.estimatedValue = estimatedValue || entry.estimatedValue;
      entry.connectionId = connectionId;
      if (notes) entry.notes = notes;
      await entry.save();
    } else {
      entry = await CRMEntry.create({
        ownerId, contactId, connectionId,
        status: 'Lead',
        estimatedValue: estimatedValue || 0,
        notes: notes || ''
      });
    }

    res.json({ message: 'Converted to lead', entry });
  } catch (err) {
    res.status(500).json({ message: 'Convert to lead failed', error: err.message });
  }
};

// ─── CREATE / ENSURE CRM ENTRY (called automatically on connection accept) ───
exports.ensureCRMEntry = async (ownerId, contactId, connectionId) => {
  try {
    const exists = await CRMEntry.findOne({ ownerId, contactId });
    if (!exists) {
      await CRMEntry.create({ ownerId, contactId, connectionId, status: 'Lead' });
    }
  } catch (err) {
    console.error('ensureCRMEntry error:', err);
  }
};

// ─── CREATE MANUAL CRM ENTRY ──────────────────────────────────────────────────
exports.createManualEntry = async (req, res) => {
  try {
    let ownerId = req.user._id;
    const {
      ownerId: requestedOwnerId,
      name, phone, email, location, requirement, source, businessName, businessCategory,
      status, estimatedValue, notes, followUpDate, followUpNotes
    } = req.body;

    if (req.user.role === 'Super Admin' && requestedOwnerId) {
      const ownerUser = await User.findOne({ _id: requestedOwnerId, role: { $ne: 'Super Admin' } }).select('_id');
      if (!ownerUser) {
        return res.status(404).json({ message: 'Selected owner member not found' });
      }
      ownerId = ownerUser._id;
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Contact name is required' });
    }

    const entryData = {
      ownerId,
      isManual: true,
      manualContact: {
        name: name.trim(),
        phone: phone || '',
        email: email || '',
        location: location || '',
        requirement: requirement || '',
        source: source || 'Manual',
        businessName: businessName || '',
        businessCategory: businessCategory || ''
      },
      status: status || 'Lead',
      estimatedValue: Number(estimatedValue) || 0,
      notes: notes || ''
    };

    if (followUpDate) {
      entryData.followUps = [{ date: new Date(followUpDate), notes: followUpNotes || '' }];
      entryData.nextFollowUpDate = new Date(followUpDate);
    }

    const entry = await CRMEntry.create(entryData);
    res.status(201).json({ message: 'Manual CRM entry created', entry });
  } catch (err) {
    res.status(500).json({ message: 'Create manual entry failed', error: err.message });
  }
};

exports.createPublicEnquiry = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      phone,
      email,
      location,
      requirement,
      businessName,
      businessCategory
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ message: 'Location is required' });
    }
    if (!requirement || !requirement.trim()) {
      return res.status(400).json({ message: 'Requirement is required' });
    }

    const owner = await User.findOne({
      _id: userId,
      status: 'Approved',
      role: { $ne: 'Super Admin' }
    }).select('_id firstName lastName');

    if (!owner) {
      return res.status(404).json({ message: 'Member not found for enquiry' });
    }

    const entry = await CRMEntry.create({
      ownerId: owner._id,
      isManual: true,
      manualContact: {
        name: name.trim(),
        phone: phone.trim(),
        email: email || '',
        location: location.trim(),
        requirement: requirement.trim(),
        source: 'Public Enquiry',
        businessName: businessName || '',
        businessCategory: businessCategory || ''
      },
      status: 'Lead',
      estimatedValue: 0,
      notes: `Public enquiry submitted for ${owner.firstName} ${owner.lastName}. Requirement: ${requirement.trim()}`
    });

    res.status(201).json({
      message: 'Enquiry sent successfully',
      entryId: entry._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Create public enquiry failed', error: err.message });
  }
};

// ─── DELETE CRM ENTRY (manual entries only) ───────────────────────────────────
exports.deleteEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const entry = await CRMEntry.findOne({ _id: entryId, ownerId: req.user._id });

    if (!entry) return res.status(404).json({ message: 'CRM entry not found' });
    if (!entry.isManual) {
      return res.status(403).json({ message: 'Only manually added entries can be deleted' });
    }

    await entry.deleteOne();
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete CRM entry failed', error: err.message });
  }
};


// ─── GET CRM DASHBOARD ────────────────────────────────────────────────────────
exports.getCRMDashboard = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { status, dateFrom, dateTo } = req.query;

    const query = { ownerId };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const entries = await CRMEntry.find(query)
      .populate('contactId', 'firstName lastName businessName businessCategory profilePic membershipId phone email locationName tableName')
      .populate('connectionId', 'status createdAt')
      .populate('dealId', 'amount status completedAt')
      .sort('-updatedAt');

    // Summary stats
    const stats = {
      total: entries.length,
      spoke: entries.filter(e => e.spoke).length,
      leads: entries.filter(e => e.status === 'Lead').length,
      inProgress: entries.filter(e => e.status === 'InProgress').length,
      reconnect: entries.filter(e => e.status === 'Reconnect').length,
      refollow: entries.filter(e => e.status === 'Refollow').length,
      completed: entries.filter(e => e.status === 'Completed').length,
      totalValue: entries.reduce((s, e) => s + (e.confirmedValue || 0), 0),
      pendingValue: entries.reduce((s, e) => s + (e.estimatedValue || 0), 0)
    };

    res.json({ stats, entries });
  } catch (err) {
    res.status(500).json({ message: 'Fetch CRM dashboard failed', error: err.message });
  }
};

// ─── UPDATE CRM ENTRY ──────────────────────────────────────────────────────────
exports.updateCRMEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const {
      spoke, followUpDate, followUpNotes,
      status, estimatedValue, confirmedValue,
      workCompleted, notes
    } = req.body;

    const entry = await CRMEntry.findOne({ _id: entryId, ownerId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'CRM entry not found' });

    if (spoke !== undefined) {
      entry.spoke = spoke;
      if (spoke && !entry.spokeAt) entry.spokeAt = new Date();
    }
    if (status) entry.status = status;
    if (estimatedValue !== undefined) entry.estimatedValue = estimatedValue;
    if (confirmedValue !== undefined) entry.confirmedValue = confirmedValue;
    if (notes !== undefined) entry.notes = notes;
    if (workCompleted !== undefined) {
      entry.workCompleted = workCompleted;
      if (workCompleted) entry.workCompletedAt = new Date();
    }

    if (followUpDate) {
      entry.followUps.push({ date: new Date(followUpDate), notes: followUpNotes || '' });
      entry.nextFollowUpDate = new Date(followUpDate);
    }

    await entry.save();
    res.json({ message: 'CRM entry updated', entry });
  } catch (err) {
    res.status(500).json({ message: 'Update CRM entry failed', error: err.message });
  }
};

// ─── CONVERT CONNECTION TO LEAD ───────────────────────────────────────────────
exports.convertToLead = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { estimatedValue, notes } = req.body;
    const ownerId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });

    const contactId = connection.fromUser.toString() === ownerId.toString()
      ? connection.toUser : connection.fromUser;

    let entry = await CRMEntry.findOne({ ownerId, contactId });
    if (entry) {
      entry.status = 'Lead';
      entry.estimatedValue = estimatedValue || entry.estimatedValue;
      entry.connectionId = connectionId;
      if (notes) entry.notes = notes;
      await entry.save();
    } else {
      entry = await CRMEntry.create({
        ownerId, contactId, connectionId,
        status: 'Lead',
        estimatedValue: estimatedValue || 0,
        notes: notes || ''
      });
    }

    res.json({ message: 'Converted to lead', entry });
  } catch (err) {
    res.status(500).json({ message: 'Convert to lead failed', error: err.message });
  }
};

// ─── CREATE / ENSURE CRM ENTRY (called automatically on connection accept) ───
exports.ensureCRMEntry = async (ownerId, contactId, connectionId) => {
  try {
    const exists = await CRMEntry.findOne({ ownerId, contactId });
    if (!exists) {
      await CRMEntry.create({ ownerId, contactId, connectionId, status: 'Lead' });
    }
  } catch (err) {
    console.error('ensureCRMEntry error:', err);
  }
};

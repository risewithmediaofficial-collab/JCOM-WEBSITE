const Connection = require('../models/Connection');
const User = require('../models/User');
const CRMEntry = require('../models/CRMEntry');
const Deal = require('../models/Deal');
const Location = require('../models/Location');
const Rating = require('../models/Rating');
const { ensureCRMEntry } = require('./crmController');
const { emitUserNotification } = require('../utils/notificationService');

const recalculateUserRatingStats = async (userId) => {
  const [summary] = await Rating.aggregate([
    { $match: { ratedUser: userId } },
    {
      $group: {
        _id: '$ratedUser',
        averageRating: { $avg: '$rating' },
        ratingsCount: { $sum: 1 }
      }
    }
  ]);

  await User.findByIdAndUpdate(userId, {
    averageRating: summary ? Number(summary.averageRating.toFixed(1)) : 0,
    ratingsCount: summary ? summary.ratingsCount : 0
  });
};

// ─── SEND CONNECTION REQUEST ──────────────────────────────────────────────────
exports.sendRequest = async (req, res) => {
  try {
    const fromUser = req.user._id;
    const {
      toUserId,
      message,
      tableName,
      memberName,
      category,
      requestType,
      serviceNeeded,
      phone,
      email,
      businessDetails
    } = req.body;

    if (fromUser.toString() === toUserId) {
      return res.status(400).json({ message: 'Cannot connect to yourself' });
    }

    const existing = await Connection.findOne({
      $or: [
        { fromUser, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUser }
      ]
    });

    const toUser = await User.findById(toUserId);
    if (!toUser || toUser.status !== 'Approved') {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (existing && existing.status !== 'Disconnected') {
      return res.status(400).json({ message: 'Connection already exists', connection: existing });
    }

    if (existing && existing.status === 'Disconnected') {
      existing.fromUser = fromUser;
      existing.toUser = toUserId;
      existing.fromUserName = `${req.user.firstName} ${req.user.lastName}`;
      existing.toUserName = `${toUser.firstName} ${toUser.lastName}`;
      existing.status = 'Requested';
      existing.requestMessage = message || 'I need your service';
      existing.requesterDetails = {
        tableName: tableName || req.user.tableName || '',
        memberName: memberName || `${toUser.firstName} ${toUser.lastName}`,
        category: category || toUser.businessCategory || '',
        requestType: requestType || 'NA',
        serviceNeeded: serviceNeeded || '',
        phone: phone || req.user.phone || '',
        email: email || req.user.email || '',
        businessDetails: businessDetails || ''
      };
      existing.connectedAt = null;
      existing.updatedAt = new Date();
      await existing.save();

      await User.findByIdAndUpdate(fromUser, { $inc: { givenRequests: 1 } });
      await User.findByIdAndUpdate(toUserId, { $inc: { receivedRequests: 1 } });

      await emitUserNotification(req.app, toUserId, {
        type: 'Connection Request',
        title: 'Connection request received',
        message: `${req.user.firstName} ${req.user.lastName} sent you a connection request.`,
        relatedUser: fromUser,
        relatedConnection: existing._id,
        url: '/connections',
        tag: `connection-request-${existing._id}`
      });

      return res.status(201).json({ message: 'Connection request sent again', connection: existing });
    }

    const connection = await Connection.create({
      fromUser, toUser: toUserId,
      status: 'Requested',
      requestMessage: message || 'I need your service',
      requesterDetails: {
        tableName: tableName || req.user.tableName || '',
        memberName: memberName || `${toUser.firstName} ${toUser.lastName}`,
        category: category || toUser.businessCategory || '',
        requestType: requestType || 'NA',
        serviceNeeded: serviceNeeded || '',
        phone: phone || req.user.phone || '',
        email: email || req.user.email || '',
        businessDetails: businessDetails || ''
      },
      fromUserName: `${req.user.firstName} ${req.user.lastName}`,
      toUserName: `${toUser.firstName} ${toUser.lastName}`
    });

    // Increment sender's given count
    await User.findByIdAndUpdate(fromUser, { $inc: { givenRequests: 1 } });
    await User.findByIdAndUpdate(toUserId, { $inc: { receivedRequests: 1 } });

    await emitUserNotification(req.app, toUserId, {
      type: 'Connection Request',
      title: 'Connection request received',
      message: `${req.user.firstName} ${req.user.lastName} sent you a connection request.`,
      relatedUser: fromUser,
      relatedConnection: connection._id,
      url: '/connections',
      tag: `connection-request-${connection._id}`
    });

    res.status(201).json({ message: 'Connection request sent', connection });
  } catch (err) {
    res.status(500).json({ message: 'Send request failed', error: err.message });
  }
};

// ─── ACCEPT CONNECTION ────────────────────────────────────────────────────────
exports.acceptRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const conn = await Connection.findById(connectionId);
    if (!conn) return res.status(404).json({ message: 'Connection not found' });
    if (conn.toUser.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    conn.status = 'Connected';
    conn.connectedAt = new Date();
    await conn.save();

    // Update totalConnections for both
    const [fromUserDoc, toUserDoc] = await Promise.all([
      User.findByIdAndUpdate(conn.fromUser, { $inc: { totalConnections: 1 } }, { new: true }).select('locationId'),
      User.findByIdAndUpdate(conn.toUser, { $inc: { totalConnections: 1 } }, { new: true }).select('locationId')
    ]);

    const locationIds = [...new Set([fromUserDoc?.locationId, toUserDoc?.locationId].filter(Boolean).map(String))];
    if (locationIds.length > 0) {
      await Location.updateMany({ _id: { $in: locationIds } }, { $inc: { totalConnections: 1 } });
    }

    // Create CRM entries for both
    await ensureCRMEntry(conn.fromUser, conn.toUser, conn._id);
    await ensureCRMEntry(conn.toUser, conn.fromUser, conn._id);

    await emitUserNotification(req.app, conn.fromUser, {
      type: 'Connection Accepted',
      title: 'Connection request accepted',
      message: `${req.user.firstName} ${req.user.lastName} accepted your connection request.`,
      relatedUser: conn.toUser,
      relatedConnection: conn._id,
      url: '/connections',
      tag: `connection-accepted-${conn._id}`
    });

    res.json({ message: 'Connection accepted', connection: conn });
  } catch (err) {
    res.status(500).json({ message: 'Accept request failed', error: err.message });
  }
};

// ─── DECLINE/CANCEL CONNECTION REQUEST ───────────────────────────────────────
// Either the recipient (decline) or sender (cancel) can call this
exports.cancelRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const conn = await Connection.findById(connectionId);
    if (!conn) return res.status(404).json({ message: 'Connection not found' });

    const isSender = conn.fromUser.toString() === userId.toString();
    const isRecipient = conn.toUser.toString() === userId.toString();

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only pending requests can be cancelled by sender; recipient can decline at any stage
    if (isSender && conn.status !== 'Requested') {
      return res.status(400).json({ message: 'Can only cancel a pending request' });
    }

    const wasConnected = conn.status === 'Connected';
    conn.status = 'Disconnected';
    await conn.save();

    // Decrement counters
    if (isSender) {
      await User.findByIdAndUpdate(conn.fromUser, { $inc: { givenRequests: -1 } });
      await User.findByIdAndUpdate(conn.toUser, { $inc: { receivedRequests: -1 } });
    }

    if (wasConnected) {
      const [fromUserDoc, toUserDoc] = await Promise.all([
        User.findByIdAndUpdate(conn.fromUser, { $inc: { totalConnections: -1 } }, { new: true }).select('locationId'),
        User.findByIdAndUpdate(conn.toUser, { $inc: { totalConnections: -1 } }, { new: true }).select('locationId')
      ]);

      const locationIds = [...new Set([fromUserDoc?.locationId, toUserDoc?.locationId].filter(Boolean).map(String))];
      if (locationIds.length > 0) {
        await Location.updateMany({ _id: { $in: locationIds } }, { $inc: { totalConnections: -1 } });
      }
    }

    res.json({ message: isSender ? 'Request cancelled' : 'Connection declined' });
  } catch (err) {
    res.status(500).json({ message: 'Cancel request failed', error: err.message });
  }
};

// ─── CONVERT CONNECTION TO REVENUE LEAD ──────────────────────────────────────
// Called after connection is accepted and amount is paid
exports.convertToRevenue = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { amount, notes } = req.body;
    const userId = req.user._id;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const conn = await Connection.findById(connectionId);
    if (!conn) return res.status(404).json({ message: 'Connection not found' });
    if (conn.status !== 'Connected') {
      return res.status(400).json({ message: 'Connection must be accepted before converting' });
    }

    const isSender = conn.fromUser.toString() === userId.toString();
    const isRecipient = conn.toUser.toString() === userId.toString();
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const revenue = Number(amount);

    // Update CRM entry to Completed + confirmedValue
    const contactId = isSender ? conn.toUser : conn.fromUser;
    let entry = await CRMEntry.findOne({ ownerId: userId, connectionId });
    if (!entry) entry = await CRMEntry.findOne({ ownerId: userId, contactId });

    if (entry) {
      entry.status = 'Completed';
      entry.confirmedValue = revenue;
      entry.workCompleted = true;
      entry.workCompletedAt = new Date();
      if (notes) entry.notes = notes;
      await entry.save();
    } else {
      entry = await CRMEntry.create({
        ownerId: userId,
        contactId,
        connectionId: conn._id,
        status: 'Completed',
        confirmedValue: revenue,
        estimatedValue: revenue,
        workCompleted: true,
        workCompletedAt: new Date(),
        notes: notes || ''
      });
    }

    // Persist as a completed deal so revenue shows up in live stats APIs
    let deal = conn.dealId ? await Deal.findById(conn.dealId) : null;
    if (!deal) {
      deal = await Deal.create({
        connectionId: conn._id,
        fromUser: userId,
        toUser: contactId,
        amount: revenue,
        description: notes || '',
        status: 'Completed',
        initiatorConfirmed: true,
        receiverConfirmed: true,
        completedAt: new Date()
      });
      conn.dealId = deal._id;
    } else {
      deal.amount = revenue;
      deal.description = notes || deal.description || '';
      deal.status = 'Completed';
      deal.initiatorConfirmed = true;
      deal.receiverConfirmed = true;
      deal.completedAt = new Date();
      await deal.save();
    }

    // Update totalRevenue on user + location
    const owner = await User.findByIdAndUpdate(userId, { $inc: { totalRevenue: revenue } }, { new: true }).select('locationId');
    if (owner?.locationId) {
      await Location.findByIdAndUpdate(owner.locationId, { $inc: { totalRevenue: revenue } });
    }

    // Mark connection as deal created
    conn.dealCreated = true;
    await conn.save();

    res.json({ message: 'Converted to revenue successfully', revenue, entry });
  } catch (err) {
    res.status(500).json({ message: 'Convert to revenue failed', error: err.message });
  }
};

exports.submitRating = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user._id;
    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5' });
    }

    const conn = await Connection.findById(connectionId);
    if (!conn) return res.status(404).json({ message: 'Connection not found' });
    if (conn.status !== 'Connected') {
      return res.status(400).json({ message: 'Only connected businesses can be rated' });
    }

    const isSender = conn.fromUser.toString() === userId.toString();
    const isRecipient = conn.toUser.toString() === userId.toString();
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to rate this connection' });
    }

    const ratedUser = isSender ? conn.toUser : conn.fromUser;
    const trimmedFeedback = (feedback || '').trim();

    const savedRating = await Rating.findOneAndUpdate(
      { connectionId, raterUser: userId, ratedUser },
      {
        connectionId,
        raterUser: userId,
        ratedUser,
        rating: numericRating,
        feedback: trimmedFeedback
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    await recalculateUserRatingStats(ratedUser);

    const ratedUserDoc = await User.findById(ratedUser).select('averageRating ratingsCount firstName lastName businessName');

    res.json({
      message: 'Rating saved successfully',
      rating: savedRating,
      ratedUser: ratedUserDoc
    });
  } catch (err) {
    res.status(500).json({ message: 'Save rating failed', error: err.message });
  }
};

// ─── GET MY CONNECTIONS ───────────────────────────────────────────────────────
exports.getMyConnections = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, status } = req.query; // type: 'given'|'received'|'all'

    let query = {};
    if (type === 'given') query.fromUser = userId;
    else if (type === 'received') query.toUser = userId;
    else query = { $or: [{ fromUser: userId }, { toUser: userId }] };

    if (status) query.status = status;

    const connections = await Connection.find(query)
      .populate('fromUser', 'firstName lastName businessName businessCategory businessService businessDescription businessWebsite profilePic membershipId locationName tableName phone email averageRating ratingsCount')
      .populate('toUser', 'firstName lastName businessName businessCategory businessService businessDescription businessWebsite profilePic membershipId locationName tableName phone email averageRating ratingsCount')
      .populate('dealId', 'amount status completedAt')
      .sort('-createdAt');

    const connectionIds = connections.map((connection) => connection._id);
    const myRatings = await Rating.find({
      connectionId: { $in: connectionIds },
      raterUser: userId
    }).select('connectionId rating feedback updatedAt createdAt');

    const ratingsMap = new Map(
      myRatings.map((item) => [item.connectionId.toString(), item])
    );

    const serializedConnections = connections.map((connection) => {
      const raw = connection.toObject();
      raw.myRating = ratingsMap.get(connection._id.toString()) || null;
      return raw;
    });

    res.json({ count: serializedConnections.length, connections: serializedConnections });
  } catch (err) {
    res.status(500).json({ message: 'Fetch connections failed', error: err.message });
  }
};

// ─── GET STATS ────────────────────────────────────────────────────────────────
exports.getConnectionStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period } = req.query; // 'weekly' | 'monthly' | 'yearly'

    const now = new Date();
    let startDate;
    if (period === 'weekly') startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'monthly') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'yearly') startDate = new Date(now.getFullYear(), 0, 1);
    else startDate = new Date(0);

    const dateFilter = { createdAt: { $gte: startDate } };

    const [given, received, connected] = await Promise.all([
      Connection.countDocuments({ fromUser: userId, ...dateFilter }),
      Connection.countDocuments({ toUser: userId, ...dateFilter }),
      Connection.countDocuments({
        $or: [{ fromUser: userId }, { toUser: userId }],
        status: 'Connected',
        ...dateFilter
      })
    ]);

    res.json({ period, given, received, total: given + received, connected });
  } catch (err) {
    res.status(500).json({ message: 'Fetch stats failed', error: err.message });
  }
};

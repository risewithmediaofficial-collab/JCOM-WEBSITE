const Deal = require('../models/Deal');
const Connection = require('../models/Connection');
const CRMEntry = require('../models/CRMEntry');
const User = require('../models/User');
const Location = require('../models/Location');

// ─── CREATE DEAL (Convert → assign amount) ────────────────────────────────────
exports.createDeal = async (req, res) => {
  try {
    const { connectionId, amount, description } = req.body;
    const userId = req.user._id;

    if (!connectionId || !amount) {
      return res.status(400).json({ message: 'connectionId and amount are required' });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });
    if (connection.status !== 'Connected') {
      return res.status(400).json({ message: 'Connection must be accepted first' });
    }

    if (![connection.fromUser.toString(), connection.toUser.toString()].includes(userId.toString())) {
      return res.status(403).json({ message: 'Not part of this connection' });
    }

    if (connection.dealCreated) {
      return res.status(400).json({ message: 'Deal already exists for this connection' });
    }

    const toUser = connection.fromUser.toString() === userId.toString()
      ? connection.toUser : connection.fromUser;

    const deal = await Deal.create({
      connectionId, fromUser: userId, toUser,
      amount, description: description || '',
      status: 'Pending',
      initiatorConfirmed: true
    });

    connection.dealCreated = true;
    connection.dealId = deal._id;
    await connection.save();

    res.status(201).json({ message: 'Deal created, awaiting counterpart confirmation', deal });
  } catch (err) {
    res.status(500).json({ message: 'Create deal failed', error: err.message });
  }
};

// ─── CONFIRM DEAL (other party confirms) ─────────────────────────────────────
exports.confirmDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user._id;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });


    if (deal.toUser.toString() === userId.toString()) {
      deal.receiverConfirmed = true;
    } else if (deal.fromUser.toString() === userId.toString()) {
      deal.initiatorConfirmed = true;
    } else {
      return res.status(403).json({ message: 'Not part of this deal' });
    }

    if (deal.initiatorConfirmed && deal.receiverConfirmed) {
      deal.status = 'Completed';
      deal.completedAt = new Date();

      // Update revenue for both users
      await User.findByIdAndUpdate(deal.fromUser, { $inc: { totalRevenue: deal.amount } });
      await User.findByIdAndUpdate(deal.toUser, { $inc: { totalRevenue: deal.amount } });

      // Update location revenue
      const fromUser = await User.findById(deal.fromUser);
      if (fromUser?.locationId) {
        await Location.findByIdAndUpdate(fromUser.locationId, { $inc: { totalRevenue: deal.amount } });
      }

      // Update CRM entries
      await CRMEntry.updateOne(
        { ownerId: deal.fromUser, contactId: deal.toUser },
        { status: 'Completed', workCompleted: true, confirmedValue: deal.amount, workCompletedAt: new Date() }
      );
      await CRMEntry.updateOne(
        { ownerId: deal.toUser, contactId: deal.fromUser },
        { status: 'Completed', workCompleted: true, confirmedValue: deal.amount, workCompletedAt: new Date() }
      );
    }

    await deal.save();
    res.json({ message: deal.status === 'Completed' ? 'Deal completed! Lead generated.' : 'Confirmation recorded', deal });
  } catch (err) {
    res.status(500).json({ message: 'Confirm deal failed', error: err.message });
  }
};

// ─── GET MY DEALS ─────────────────────────────────────────────────────────────
exports.getMyDeals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { $or: [{ fromUser: userId }, { toUser: userId }] };
    if (status) query.status = status;

    const deals = await Deal.find(query)
      .populate('fromUser', 'firstName lastName businessName profilePic')
      .populate('toUser', 'firstName lastName businessName profilePic')
      .populate('connectionId', 'status')
      .sort('-createdAt');

    const totalRevenue = deals
      .filter(d => d.status === 'Completed')
      .reduce((s, d) => s + d.amount, 0);

    res.json({ count: deals.length, totalRevenue, deals });
  } catch (err) {
    res.status(500).json({ message: 'Fetch deals failed', error: err.message });
  }
};

// ─── GET DEAL STATS ───────────────────────────────────────────────────────────
exports.getDealStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period } = req.query;

    const now = new Date();
    let startDate;
    if (period === 'weekly') startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'monthly') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'yearly') startDate = new Date(now.getFullYear(), 0, 1);
    else startDate = new Date(0);

    const deals = await Deal.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'Completed',
      completedAt: { $gte: startDate }
    });

    const crmConversions = await CRMEntry.find({
      ownerId: userId,
      status: 'Completed',
      workCompleted: true,
      confirmedValue: { $gt: 0 },
      dealId: null,
      workCompletedAt: { $gte: startDate }
    }).select('confirmedValue');

    const revenue = deals.reduce((s, d) => s + d.amount, 0) +
      crmConversions.reduce((s, entry) => s + (entry.confirmedValue || 0), 0);

    res.json({ period, completedDeals: deals.length + crmConversions.length, totalRevenue: revenue });
  } catch (err) {
    res.status(500).json({ message: 'Fetch deal stats failed', error: err.message });
  }
};

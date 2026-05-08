const User = require('../models/User');
const Connection = require('../models/Connection');
const Deal = require('../models/Deal');
const Meeting = require('../models/Meeting');
const Location = require('../models/Location');
const CRMEntry = require('../models/CRMEntry');
const {
  getMemberCountsByLocation,
  getConnectionCountsByLocation,
  getDealRevenueByLocation,
  getStandaloneCRMRevenueByLocation,
  getTotalCompletedRevenue
} = require('../utils/liveStats');

const getPeriodStartDate = (period) => {
  if (period === 'overall') return null;

  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  if (period === 'weekly') {
    startDate.setDate(startDate.getDate() - 7);
    return startDate;
  }

  if (period === 'monthly') {
    startDate.setDate(1);
    return startDate;
  }

  if (period === 'yearly') {
    startDate.setMonth(0, 1);
    return startDate;
  }

  startDate.setDate(1);
  return startDate;
};

// ─── PUBLIC HOME PAGE STATS ───────────────────────────────────────────────────
exports.getHomeStats = async (req, res) => {
  try {
    const { period } = req.query; // 'weekly' | 'monthly'
    const normalizedPeriod = ['weekly', 'monthly', 'yearly', 'overall'].includes(period) ? period : 'monthly';
    const startDate = getPeriodStartDate(normalizedPeriod);

    const [totalMembers, totalConnections, totalRevenue, locations, memberCounts, connectionCounts, periodConnectionCounts, dealRevenueByLocation, crmRevenueByLocation, periodDealRevenueByLocation, periodCrmRevenueByLocation] = await Promise.all([
      User.countDocuments({ status: 'Approved', role: { $ne: 'Super Admin' } }),
      Connection.countDocuments({
        status: 'Connected',
        $or: [
          { connectedAt: { $gte: startDate } },
          { connectedAt: null, createdAt: { $gte: startDate } }
        ]
      }),
      getTotalCompletedRevenue(startDate),
      Location.find({ isActive: true }).select('name code').sort('name'),
      getMemberCountsByLocation(),
      getConnectionCountsByLocation(),
      getConnectionCountsByLocation(startDate),
      getDealRevenueByLocation(),
      getStandaloneCRMRevenueByLocation(),
      getDealRevenueByLocation(startDate),
      getStandaloneCRMRevenueByLocation(startDate)
    ]);

    const topRatedBusinesses = await User.find({
      status: 'Approved',
      role: { $ne: 'Super Admin' },
      ratingsCount: { $gt: 0 }
    })
      .select('firstName lastName businessName slug businessCategory locationName profilePic averageRating ratingsCount')
      .sort({ averageRating: -1, ratingsCount: -1, totalConnections: -1, firstName: 1 })
      .limit(6);

    const rankedLocations = locations
      .map((l) => ({
        name: l.name,
        code: l.code,
        members: memberCounts.get(String(l._id)) || 0,
        connections: connectionCounts.get(String(l._id)) || 0,
        revenue: (dealRevenueByLocation.get(String(l._id)) || 0) + (crmRevenueByLocation.get(String(l._id)) || 0),
        periodConnections: periodConnectionCounts.get(String(l._id)) || 0,
        periodRevenue: (periodDealRevenueByLocation.get(String(l._id)) || 0) + (periodCrmRevenueByLocation.get(String(l._id)) || 0)
      }))
      .sort((a, b) => {
        if (b.periodRevenue !== a.periodRevenue) return b.periodRevenue - a.periodRevenue;
        if (b.periodConnections !== a.periodConnections) return b.periodConnections - a.periodConnections;
        if (b.members !== a.members) return b.members - a.members;
        return a.name.localeCompare(b.name);
      });

    const computedConnections = normalizedPeriod === 'overall'
      ? rankedLocations.reduce((sum, location) => sum + (location.connections || 0), 0)
      : rankedLocations.reduce((sum, location) => sum + (location.periodConnections || 0), 0);
    const computedRevenue = normalizedPeriod === 'overall'
      ? rankedLocations.reduce((sum, location) => sum + (location.revenue || 0), 0)
      : rankedLocations.reduce((sum, location) => sum + (location.periodRevenue || 0), 0);

    res.json({
      period: normalizedPeriod,
      globalStats: {
        totalMembers,
        totalConnections: computedConnections,
        totalRevenue: computedRevenue
      },
      topRatedBusinesses,
      locations: rankedLocations
    });
  } catch (err) {
    res.status(500).json({ message: 'Fetch home stats failed', error: err.message });
  }
};

// ─── LEADERBOARD ───────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const { by, period } = req.query; // by: 'revenue'|'connections'|'members'|'attendance'

    const locations = await Location.find({ isActive: true })
      .populate('chairmanId', 'firstName lastName')
      .sort('name');

    // Get period-based connection counts
    const normalizedPeriod = ['weekly', 'monthly', 'yearly', 'overall'].includes(period) ? period : 'monthly';
    const startDate = getPeriodStartDate(normalizedPeriod);

    const [
      memberCounts,
      totalConnectionsMap,
      totalDealRevenueMap,
      totalCrmRevenueMap,
      periodConnectionsMap,
      periodDealRevenueMap,
      periodCrmRevenueMap
    ] = await Promise.all([
      getMemberCountsByLocation(),
      getConnectionCountsByLocation(),
      getDealRevenueByLocation(),
      getStandaloneCRMRevenueByLocation(),
      getConnectionCountsByLocation(startDate),
      getDealRevenueByLocation(startDate),
      getStandaloneCRMRevenueByLocation(startDate)
    ]);

    const locationStats = await Promise.all(locations.map(async (loc) => {
      const memberAttendance = await Meeting.aggregate([
        { $match: { locationId: loc._id, time: { $gte: startDate } } },
        { $group: { _id: null, totalInvited: { $sum: '$inviteCount' }, totalAttended: { $sum: '$attendedCount' } } }
      ]);

      const attStats = memberAttendance[0] || { totalInvited: 0, totalAttended: 0 };

      return {
        _id: loc._id,
        name: loc.name,
        code: loc.code,
        chairman: loc.chairmanId ? `${loc.chairmanId.firstName} ${loc.chairmanId.lastName}` : 'TBD',
        totalMembers: memberCounts.get(String(loc._id)) || 0,
        totalConnections: totalConnectionsMap.get(String(loc._id)) || 0,
        totalRevenue: (totalDealRevenueMap.get(String(loc._id)) || 0) + (totalCrmRevenueMap.get(String(loc._id)) || 0),
        periodConnections: periodConnectionsMap.get(String(loc._id)) || 0,
        periodRevenue: (periodDealRevenueMap.get(String(loc._id)) || 0) + (periodCrmRevenueMap.get(String(loc._id)) || 0),
        attendanceRate: attStats.totalInvited > 0
          ? Math.round((attStats.totalAttended / attStats.totalInvited) * 100) : 0
      };
    }));

    // Sort by requested metric
    const sortKey = by === 'connections'
      ? (period === 'overall' ? 'totalConnections' : 'periodConnections')
      : by === 'members'
        ? 'totalMembers'
        : by === 'attendance'
          ? 'attendanceRate'
      : (normalizedPeriod === 'overall' ? 'totalRevenue' : 'periodRevenue');

    locationStats.sort((a, b) => b[sortKey] - a[sortKey]);

    res.json({ period: normalizedPeriod, sortedBy: sortKey, leaderboard: locationStats });
  } catch (err) {
    res.status(500).json({ message: 'Fetch leaderboard failed', error: err.message });
  }
};

// ─── MEMBER STATS (table filter with given+received+amount) ──────────────────
exports.getMemberStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period } = req.query;

    const now = new Date();
    let startDate;
    if (period === 'weekly') startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'monthly') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'yearly') startDate = new Date(now.getFullYear(), 0, 1);
    else startDate = new Date(0);

    const user = await User.findById(userId).select('locationId');

    const baseUserQuery = { $or: [{ fromUser: userId }, { toUser: userId }] };
    const periodMeetingQuery = {
      locationId: user.locationId,
      time: { $gte: startDate }
    };
    const allTimeMeetingQuery = {
      locationId: user.locationId
    };

    const [
      given,
      received,
      completedDeals,
      crmConversions,
      publicEnquiries,
      recentPublicEnquiries,
      totalMeetings,
      meetingsAttended,
      overallGivenRequests,
      overallReceivedRequests,
      overallConnections,
      overallCompletedDeals,
      overallCrmConversions,
      overallTotalMeetings,
      overallMeetingsAttended
    ] = await Promise.all([
      Connection.countDocuments({ fromUser: userId, createdAt: { $gte: startDate } }),
      Connection.countDocuments({ toUser: userId, createdAt: { $gte: startDate } }),
      Deal.find({
        $or: [{ fromUser: userId }, { toUser: userId }],
        status: 'Completed',
        completedAt: { $gte: startDate }
      }),
      CRMEntry.find({
        ownerId: userId,
        status: 'Completed',
        workCompleted: true,
        confirmedValue: { $gt: 0 },
        dealId: null,
        workCompletedAt: { $gte: startDate }
      }).select('confirmedValue'),
      CRMEntry.countDocuments({
        ownerId: userId,
        isManual: true,
        'manualContact.source': 'Public Enquiry'
      }),
      CRMEntry.find({
        ownerId: userId,
        isManual: true,
        'manualContact.source': 'Public Enquiry'
      })
        .select('manualContact status createdAt')
        .sort('-createdAt')
        .limit(5),
      Meeting.countDocuments(periodMeetingQuery),
      Meeting.countDocuments({ ...periodMeetingQuery, attendees: userId }),
      Connection.countDocuments({ fromUser: userId }),
      Connection.countDocuments({ toUser: userId }),
      Connection.countDocuments({ ...baseUserQuery, status: 'Connected' }),
      Deal.find({
        ...baseUserQuery,
        status: 'Completed'
      }).select('amount'),
      CRMEntry.find({
        ownerId: userId,
        status: 'Completed',
        workCompleted: true,
        confirmedValue: { $gt: 0 },
        dealId: null
      }).select('confirmedValue'),
      Meeting.countDocuments(allTimeMeetingQuery),
      Meeting.countDocuments({ ...allTimeMeetingQuery, attendees: userId })
    ]);

    const revenue = completedDeals.reduce((s, d) => s + d.amount, 0) +
      crmConversions.reduce((s, entry) => s + (entry.confirmedValue || 0), 0);
    const overallRevenue = overallCompletedDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0) +
      overallCrmConversions.reduce((sum, entry) => sum + (entry.confirmedValue || 0), 0);

    res.json({
      period,
      given,
      received,
      total: given + received,
      revenue,
      completedDeals: completedDeals.length + crmConversions.length,
      meetingsAttended,
      totalMeetings: myMeetings.length,
      publicEnquiries,
      recentPublicEnquiries,
      overallTotals: {
        givenRequests: overallGivenRequests,
        receivedRequests: overallReceivedRequests,
        totalConnections: overallConnections,
        totalRevenue: overallRevenue,
        meetingsAttended: overallMeetingsAttended,
        totalMeetings: overallTotalMeetings
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Fetch member stats failed', error: err.message });
  }
};

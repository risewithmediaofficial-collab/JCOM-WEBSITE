const User = require('../models/User');
const Connection = require('../models/Connection');
const Deal = require('../models/Deal');
const CRMEntry = require('../models/CRMEntry');

const toIdMap = (rows, key) => {
  const map = new Map();
  rows.forEach((row) => {
    if (row?._id) map.set(String(row._id), row[key] || 0);
  });
  return map;
};

const getMemberCountsByLocation = async () => {
  const rows = await User.aggregate([
    { $match: { status: 'Approved', role: { $ne: 'Super Admin' }, locationId: { $ne: null } } },
    { $group: { _id: '$locationId', totalMembers: { $sum: 1 } } }
  ]);
  return toIdMap(rows, 'totalMembers');
};

const getConnectionCountsByLocation = async (startDate = null) => {
  const match = { status: 'Connected' };
  if (startDate) {
    match.$or = [
      { connectedAt: { $gte: startDate } },
      { connectedAt: null, createdAt: { $gte: startDate } }
    ];
  }

  const rows = await Connection.aggregate([
    { $match: match },
    { $lookup: { from: 'users', localField: 'fromUser', foreignField: '_id', as: 'fromUserData' } },
    { $lookup: { from: 'users', localField: 'toUser', foreignField: '_id', as: 'toUserData' } },
    {
      $project: {
        locationIds: {
          $setUnion: [
            [{ $arrayElemAt: ['$fromUserData.locationId', 0] }],
            [{ $arrayElemAt: ['$toUserData.locationId', 0] }]
          ]
        }
      }
    },
    { $unwind: '$locationIds' },
    { $match: { locationIds: { $ne: null } } },
    { $group: { _id: '$locationIds', totalConnections: { $sum: 1 } } }
  ]);

  return toIdMap(rows, 'totalConnections');
};

const getDealRevenueByLocation = async (startDate = null) => {
  const match = { status: 'Completed' };
  if (startDate) {
    match.$or = [
      { completedAt: { $gte: startDate } },
      { completedAt: null, updatedAt: { $gte: startDate } }
    ];
  }

  const rows = await Deal.aggregate([
    { $match: match },
    { $lookup: { from: 'users', localField: 'fromUser', foreignField: '_id', as: 'ownerUser' } },
    {
      $project: {
        amount: 1,
        locationId: { $arrayElemAt: ['$ownerUser.locationId', 0] }
      }
    },
    { $match: { locationId: { $ne: null } } },
    { $group: { _id: '$locationId', totalRevenue: { $sum: '$amount' } } }
  ]);

  return toIdMap(rows, 'totalRevenue');
};

const getStandaloneCRMRevenueByLocation = async (startDate = null) => {
  const match = {
    status: 'Completed',
    workCompleted: true,
    confirmedValue: { $gt: 0 },
    dealId: null
  };
  if (startDate) {
    match.$or = [
      { workCompletedAt: { $gte: startDate } },
      { workCompletedAt: null, updatedAt: { $gte: startDate } }
    ];
  }

  const rows = await CRMEntry.aggregate([
    { $match: match },
    { $lookup: { from: 'users', localField: 'ownerId', foreignField: '_id', as: 'ownerUser' } },
    {
      $project: {
        confirmedValue: 1,
        locationId: { $arrayElemAt: ['$ownerUser.locationId', 0] }
      }
    },
    { $match: { locationId: { $ne: null } } },
    { $group: { _id: '$locationId', totalRevenue: { $sum: '$confirmedValue' } } }
  ]);

  return toIdMap(rows, 'totalRevenue');
};

const getTotalCompletedRevenue = async (startDate = null) => {
  const dealMatch = { status: 'Completed' };
  if (startDate) {
    dealMatch.$or = [
      { completedAt: { $gte: startDate } },
      { completedAt: null, updatedAt: { $gte: startDate } }
    ];
  }

  const crmMatch = {
    status: 'Completed',
    workCompleted: true,
    confirmedValue: { $gt: 0 },
    dealId: null
  };
  if (startDate) {
    crmMatch.$or = [
      { workCompletedAt: { $gte: startDate } },
      { workCompletedAt: null, updatedAt: { $gte: startDate } }
    ];
  }

  const [dealAgg, crmAgg] = await Promise.all([
    Deal.aggregate([
      { $match: dealMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    CRMEntry.aggregate([
      { $match: crmMatch },
      { $group: { _id: null, total: { $sum: '$confirmedValue' } } }
    ])
  ]);

  return (dealAgg[0]?.total || 0) + (crmAgg[0]?.total || 0);
};

module.exports = {
  getMemberCountsByLocation,
  getConnectionCountsByLocation,
  getDealRevenueByLocation,
  getStandaloneCRMRevenueByLocation,
  getTotalCompletedRevenue
};

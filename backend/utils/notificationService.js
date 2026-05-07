const Notification = require('../models/Notification');

const emitUserNotification = async (app, userId, payload) => {
  if (!userId) return null;

  const notification = await Notification.create({
    userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    relatedUser: payload.relatedUser || null,
    relatedConnection: payload.relatedConnection || null,
    relatedDeal: payload.relatedDeal || null,
    relatedMeeting: payload.relatedMeeting || null
  });

  const io = app?.get('io');
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', {
      notification: {
        _id: notification._id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedUser: notification.relatedUser,
        relatedConnection: notification.relatedConnection,
        relatedDeal: notification.relatedDeal,
        relatedMeeting: notification.relatedMeeting,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      },
      web: {
        title: payload.webTitle || payload.title,
        body: payload.webBody || payload.message,
        url: payload.url || '/dashboard',
        icon: payload.icon || '/logo web.jpg',
        badge: payload.badge || '/logo web.jpg',
        tag: payload.tag || `notification-${notification._id}`
      }
    });
  }

  return notification;
};

module.exports = { emitUserNotification };

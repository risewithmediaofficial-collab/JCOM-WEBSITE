const Notification = require('../models/Notification');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    const filters = { userId };

    if (unreadOnly === 'true') {
      filters.isRead = false;
    }

    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('relatedUser', 'firstName lastName')
      .populate('relatedConnection')
      .populate('relatedDeal')
      .populate('relatedMeeting');

    const total = await Notification.countDocuments(filters);

    res.status(200).json({
      data: notifications,
      total,
      page: Math.ceil(parseInt(skip) / parseInt(limit)) + 1
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Marked as read', notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking notification', error: error.message });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Error marking notifications', error: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.deleteMany({ userId });

    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ message: 'Error clearing notifications', error: error.message });
  }
};

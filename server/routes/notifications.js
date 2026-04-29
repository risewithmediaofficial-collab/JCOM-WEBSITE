const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.get('/', authenticateToken, notificationController.getNotifications);
router.get('/unread/count', authenticateToken, notificationController.getUnreadCount);
router.patch('/:notificationId/read', authenticateToken, notificationController.markAsRead);
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);
router.delete('/:notificationId', authenticateToken, notificationController.deleteNotification);
router.delete('/', authenticateToken, notificationController.clearAllNotifications);

module.exports = router;

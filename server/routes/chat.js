const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.post('/:connectionId', authenticateToken, chatController.sendMessage);
router.get('/:connectionId', authenticateToken, chatController.getChatHistory);
router.get('/unread/count', authenticateToken, chatController.getUnreadCount);
router.patch('/:connectionId/read', authenticateToken, chatController.markAsRead);

module.exports = router;

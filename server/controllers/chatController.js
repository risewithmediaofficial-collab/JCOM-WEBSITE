const Chat = require('../models/Chat');
const Connection = require('../models/Connection');

// Send chat message
exports.sendMessage = async (req, res) => {
  try {
    const fromUserId = req.userId;
    const { connectionId, message, messageType = 'text', fileUrl = null } = req.body;

    // Verify connection exists and user is part of it
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const isUserInConnection =
      connection.fromUser.toString() === fromUserId ||
      connection.toUser.toString() === fromUserId;

    if (!isUserInConnection) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const toUserId = connection.fromUser.toString() === fromUserId
      ? connection.toUser
      : connection.fromUser;

    const chat = new Chat({
      connectionId,
      fromUser: fromUserId,
      toUser: toUserId,
      message,
      messageType,
      fileUrl: fileUrl || null,
      isRead: false
    });

    await chat.save();

    // Emit socket event if socket.io is available
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${toUserId}`).emit('new_message', {
        connectionId,
        fromUser: fromUserId,
        message,
        timestamp: chat.createdAt
      });
    }

    res.status(201).json({
      message: 'Message sent',
      chat
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const isUserInConnection =
      connection.fromUser.toString() === userId ||
      connection.toUser.toString() === userId;

    if (!isUserInConnection) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const messages = await Chat.find({ connectionId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

    // Mark as read
    await Chat.updateMany(
      {
        connectionId,
        toUser: userId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Get unread messages count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadCount = await Chat.countDocuments({
      toUser: userId,
      isRead: false
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    await Chat.updateMany(
      {
        connectionId,
        toUser: userId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking messages', error: error.message });
  }
};

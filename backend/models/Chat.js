const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  connectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connection',
    required: true
  },
  
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  messageType: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text'
  },
  
  fileUrl: String,
  
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Chat', chatSchema);

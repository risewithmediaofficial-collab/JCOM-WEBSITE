const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['Connection Request', 'Connection Accepted', 'Deal Update', 'Meeting Reminder', 'Registration Approved', 'Registration Rejected', 'Message'],
    required: true
  },
  
  title: String,
  message: String,
  
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connection'
  },
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  relatedMeeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  
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

module.exports = mongoose.model('Notification', notificationSchema);

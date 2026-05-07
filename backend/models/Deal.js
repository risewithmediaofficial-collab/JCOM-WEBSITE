const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
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
  
  // Deal Details
  amount: {
    type: Number,
    required: true
  },
  description: String,
  
  // Status Tracking
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  
  // Confirmation
  initiatorConfirmed: {
    type: Boolean,
    default: false
  },
  receiverConfirmed: {
    type: Boolean,
    default: false
  },
  
  // Automatic Updates
  completedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Deal', dealSchema);

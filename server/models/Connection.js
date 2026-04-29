const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  fromUserName: { type: String, default: '' },
  toUserName:   { type: String, default: '' },

  status: {
    type: String,
    enum: ['Requested', 'Connected', 'Disconnected'],
    default: 'Requested'
  },

  requestMessage: { type: String, default: 'I need your service' },

  // Extra details provided by the requester before sending
  requesterDetails: {
    tableName:        { type: String, default: '' },
    memberName:       { type: String, default: '' },
    category:         { type: String, default: '' },
    requestType:      { type: String, default: 'NA' },
    serviceNeeded:   { type: String, default: '' },
    phone:           { type: String, default: '' },
    email:           { type: String, default: '' },
    businessDetails: { type: String, default: '' }
  },

  connectedAt: Date,

  // Deal / Revenue Conversion
  dealCreated: { type: Boolean, default: false },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

connectionSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
connectionSchema.index({ status: 1 });

module.exports = mongoose.model('Connection', connectionSchema);

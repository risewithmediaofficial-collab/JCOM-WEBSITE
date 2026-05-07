const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  location: { type: String, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },

  // Unique meeting identifier (e.g. JCOM-MTG-2026-0001)
  meetingCode: { type: String, unique: true, sparse: true, default: null },

  type: {
    type: String,
    enum: ['Growth', 'Problems', 'Solutions', 'C2C Networking'],
    required: true
  },
  weekNumber: { type: Number, enum: [1, 2, 3, 4] },
  month: { type: Date, required: true },

  venue: String,
  time: { type: Date, required: true },
  description: { type: String, default: '' },

  contributionAmount: { type: Number, default: 0 },
  inviteCount: { type: Number, default: 0 },
  attendedCount: { type: Number, default: 0 },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  completedAt: Date,

  // QR Code — generated 1 hour before meeting
  qrCode: { type: String, default: null },       // base64 data URL
  qrGeneratedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

meetingSchema.index({ locationId: 1, time: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);

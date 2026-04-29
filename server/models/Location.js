const mongoose = require('mongoose');

const previousChairmanSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:        String,
  membershipId: String,
  year:        Number,
  startDate:   Date,
  endDate:     Date
}, { _id: false });

const locationSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, unique: true },
  code:    { type: String, required: true, trim: true, uppercase: true, unique: true }, // e.g. KRG, CHN
  
  // Active chairman
  chairmanId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  chairmanYear: { type: Number, default: null },
  chairmanStartDate: { type: Date, default: null },
  chairmanRenewalDate: { type: Date, default: null }, // yearly

  // History of previous chairmen
  previousChairmen: [previousChairmanSchema],

  // Stats (updated by cron / triggers)
  totalMembers:     { type: Number, default: 0 },
  totalTables:      { type: Number, default: 0 },
  totalConnections: { type: Number, default: 0 },
  totalRevenue:     { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);

const mongoose = require('mongoose');

const previousChairmanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  membershipId: String,
  year: Number,
  startDate: Date,
  endDate: Date
}, { _id: false });

const tableSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  locationName: { type: String, required: true }, // denormalized
  name: { type: String, required: true, trim: true }, // L1, L2, L3...
  capacity: { type: Number, default: 60 },

  chairmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  chairmanYear: { type: Number, default: null },
  chairmanStartDate: { type: Date, default: null },
  chairmanRenewalDate: { type: Date, default: null },
  previousChairmen: [previousChairmanSchema],

  // Members in this table
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  currentCount: { type: Number, default: 0 },

  // Business categories already taken in this table
  businessCategories: [{ type: String }],

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

tableSchema.index({ locationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);

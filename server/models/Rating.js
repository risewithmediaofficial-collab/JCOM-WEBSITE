const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
  raterUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String, default: '', trim: true, maxlength: 500 }
}, { timestamps: true });

ratingSchema.index({ connectionId: 1, raterUser: 1, ratedUser: 1 }, { unique: true });
ratingSchema.index({ ratedUser: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);

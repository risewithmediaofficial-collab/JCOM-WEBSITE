const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  poster: { type: String, default: null },
  eventDate: { type: Date, required: true },
  eventTime: { type: String, default: '' },
  venue: { type: String, required: true, trim: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  locationName: { type: String, default: '' },
  organizerRole: { type: String, default: '' },
  organizerName: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: true }
}, {
  timestamps: true
});

eventSchema.index({ eventDate: 1, createdAt: -1 });
eventSchema.index({ createdBy: 1, eventDate: -1 });

module.exports = mongoose.model('Event', eventSchema);

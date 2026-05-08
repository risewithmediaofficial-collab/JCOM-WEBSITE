const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  date:             { type: Date, required: true },
  notes:            { type: String, default: '' },
  internalNotes:    { type: String, default: '' },
  nextFollowUpDate: { type: Date, default: null }
}, { _id: false });

// Sub-document for manually added contacts (not in JCOM system)
const manualContactSchema = new mongoose.Schema({
  name:             { type: String, default: '' },
  phone:            { type: String, default: '' },
  email:            { type: String, default: '' },
  location:         { type: String, default: '' },
  requirement:      { type: String, default: '' },
  source:           { type: String, default: 'Manual' },
  businessName:     { type: String, default: '' },
  businessCategory: { type: String, default: '' },
}, { _id: false });

const crmEntrySchema = new mongoose.Schema({
  // The member who owns this CRM entry
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // The contact (other JCOM member) — optional for manual entries
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Manual entry flag & details
  isManual:      { type: Boolean, default: false },
  manualContact: { type: manualContactSchema, default: null },

  // Linked connection
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', default: null },

  // CRM Status
  status: {
    type: String,
    enum: ['Lead', 'InProgress', 'Reconnect', 'Refollow', 'Completed', 'Cancelled'],
    default: 'Lead'
  },

  // Interaction flags
  spoke: { type: Boolean, default: false },
  spokeAt: Date,

  // Follow-up schedule
  followUps: [followUpSchema],
  nextFollowUpDate: Date,

  // Deal / value tracking
  estimatedValue: { type: Number, default: 0 },
  confirmedValue:  { type: Number, default: 0 },
  workCompleted:   { type: Boolean, default: false },
  workCompletedAt: Date,

  // Notes
  notes: { type: String, default: '' },

  // Linked deal
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

crmEntrySchema.index({ ownerId: 1, status: 1 });
// Partial unique index — only enforced for real (non-manual) connections
crmEntrySchema.index(
  { ownerId: 1, contactId: 1 },
  { unique: true, partialFilterExpression: { isManual: false, contactId: { $ne: null } } }
);

module.exports = mongoose.model('CRMEntry', crmEntrySchema);

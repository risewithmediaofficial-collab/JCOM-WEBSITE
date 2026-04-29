const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const annualRoleSchema = new mongoose.Schema({
  year: Number,
  role: String,
  location: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  archivedAt: Date
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, required: true, trim: true },
  profilePic: { type: String, default: null },

  // Location & Table (references)
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  locationName: { type: String, default: null }, // denormalized for fast queries
  tableId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  tableName:  { type: String, default: null },

  // Business Info
  businessName:        { type: String, required: true, trim: true },
  businessCategory:    { type: String, required: true, trim: true },
  businessDescription: { type: String, default: '' },
  businessService:     { type: String, default: '' },
  businessWebsite:     { type: String, default: null },
  keywords:            [{ type: String, trim: true }],

  // Identity Docs (stored encrypted)
  aadharNumber: { type: String, default: null },
  panNumber:    { type: String, default: null },

  // Authentication
  membershipId: { type: String, unique: true, sparse: true, default: null },
  password:     { type: String, select: false },

  // Role & Status
  role: {
    type: String,
    enum: ['Super Admin', 'Chairman', 'Vice Chairman', 'Director', 'Treasurer', 'Member'],
    default: 'Member'
  },
  // Sub-role badge assigned by chairman (displayed on member list)
  subRole: {
    type: String,
    enum: ['Vice Chairman', 'Director', 'Treasurer', null],
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },

  // Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: Date,
  rejectionReason: String,

  // Metrics (denormalized for fast display)
  totalRevenue:      { type: Number, default: 0 },
  givenRequests:     { type: Number, default: 0 },
  receivedRequests:  { type: Number, default: 0 },
  totalConnections:  { type: Number, default: 0 },

  // Meeting attendance
  meetingsAttended:  { type: Number, default: 0 },
  totalMeetingsInvited: { type: Number, default: 0 },

  // Yearly Chairman Role History
  annualRoles: [annualRoleSchema],

  // Password reset
  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for search
userSchema.index({ keywords: 1 });
userSchema.index({ locationId: 1, status: 1 });
userSchema.index({ tableId: 1, status: 1 });
userSchema.index({ businessCategory: 1 });
userSchema.index({ membershipId: 1 });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

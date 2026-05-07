const Meeting = require('../models/Meeting');
const User = require('../models/User');
const QRCode = require('qrcode');

// ─── CREATE MEETING (Chairman / Super Admin) ──────────────────────────────────
// meetingCode is entered manually by the chairman in the form (now optional)
exports.createMeeting = async (req, res) => {
  try {
    const chairman = req.user;
    const { type, weekNumber, venue, time, contributionAmount, inviteCount, month, description, meetingCode } = req.body;

    if (!type || !venue || !time) {
      return res.status(400).json({ message: 'type, venue and time are required' });
    }

    let code = null;
    let qrCode = null;

    if (meetingCode && meetingCode.trim()) {
      code = meetingCode.trim().toUpperCase();
      // Ensure the code is unique
      const exists = await Meeting.findOne({ meetingCode: code });
      if (exists) {
        return res.status(400).json({ message: `Meeting ID "${code}" is already used. Please choose a different one.` });
      }
      // Generate QR from the manually provided code
      qrCode = await QRCode.toDataURL(code, { width: 300, margin: 2, color: { dark: '#0049c2', light: '#ffffff' } });
    }

    const meeting = await Meeting.create({
      location: chairman.locationName,
      locationId: chairman.locationId,
      meetingCode: code,
      qrCode,
      qrGeneratedAt: code ? new Date() : null,
      type, weekNumber, venue,
      time: new Date(time),
      month: month ? new Date(month) : new Date(),
      contributionAmount: contributionAmount || 0,
      inviteCount: inviteCount || 0,
      description: description || '',
      createdBy: chairman._id,
      status: 'Scheduled'
    });

    res.status(201).json({ message: 'Meeting scheduled', meeting });
  } catch (err) {
    res.status(500).json({ message: 'Create meeting failed', error: err.message });
  }
};

// ─── UPDATE MEETING (Chairman / Super Admin) ──────────────────────────────────
exports.updateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = req.user;
    const { type, weekNumber, venue, time, contributionAmount, inviteCount, description, meetingCode } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (user.role !== 'Super Admin' && meeting.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizing chairman can edit this meeting' });
    }

    if (meeting.status === 'Completed') {
      return res.status(400).json({ message: 'Completed meetings cannot be edited' });
    }

    let code = meeting.meetingCode;
    let qrCode = meeting.qrCode;

    if (meetingCode !== undefined) {
      const newCode = meetingCode ? meetingCode.trim().toUpperCase() : null;
      if (newCode !== meeting.meetingCode) {
        if (newCode) {
          const exists = await Meeting.findOne({ meetingCode: newCode, _id: { $ne: meetingId } });
          if (exists) {
            return res.status(400).json({ message: `Meeting ID "${newCode}" is already used.` });
          }
          code = newCode;
          qrCode = await QRCode.toDataURL(newCode, { width: 300, margin: 2, color: { dark: '#0049c2', light: '#ffffff' } });
        } else {
          code = null;
          qrCode = null;
        }
      }
    }

    meeting.type = type || meeting.type;
    meeting.weekNumber = weekNumber !== undefined ? weekNumber : meeting.weekNumber;
    meeting.venue = venue || meeting.venue;
    meeting.time = time ? new Date(time) : meeting.time;
    meeting.contributionAmount = contributionAmount !== undefined ? contributionAmount : meeting.contributionAmount;
    meeting.inviteCount = inviteCount !== undefined ? inviteCount : meeting.inviteCount;
    meeting.description = description !== undefined ? description : meeting.description;
    meeting.meetingCode = code;
    meeting.qrCode = qrCode;

    await meeting.save();
    res.json({ message: 'Meeting updated successfully', meeting });
  } catch (err) {
    res.status(500).json({ message: 'Update meeting failed', error: err.message });
  }
};

// ─── GET MEETINGS (Member / Chairman view) ────────────────────────────────────
exports.getMeetings = async (req, res) => {
  try {
    const user = req.user;
    const { month, year } = req.query;

    const query = {};
    if (user.role !== 'Super Admin') {
      query.locationId = user.locationId;
    }

    if (month && year) {
      query.time = {
        $gte: new Date(year, month - 1, 1),
        $lt:  new Date(year, month, 1)
      };
    }

    const meetings = await Meeting.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('attendees', 'firstName lastName membershipId profilePic')
      .sort('time');

    res.json({ count: meetings.length, meetings });
  } catch (err) {
    res.status(500).json({ message: 'Fetch meetings failed', error: err.message });
  }
};

// ─── JOIN MEETING BY CODE (marks attendance) ──────────────────────────────────
// Member enters a meeting code (typed or scanned from QR); attendance is recorded
exports.joinByCode = async (req, res) => {
  try {
    const { code } = req.body;            // meetingCode entered by member
    const userId  = req.user._id;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Meeting code is required' });
    }

    const meeting = await Meeting.findOne({ meetingCode: code.trim().toUpperCase() });
    if (!meeting) {
      return res.status(404).json({ message: 'Invalid Meeting ID. Please check and try again.' });
    }

    if (meeting.status !== 'Scheduled') {
      return res.status(400).json({ message: `This meeting is already ${meeting.status.toLowerCase()}.` });
    }

    // Verify the member belongs to the same location
    const member = await User.findById(userId).select('locationId role');
    if (member.role !== 'Super Admin' &&
        member.locationId?.toString() !== meeting.locationId?.toString()) {
      return res.status(403).json({ message: 'This meeting belongs to a different chapter.' });
    }

    // Check if already attended
    const alreadyAttended = meeting.attendees.some(
      id => id.toString() === userId.toString()
    );
    if (alreadyAttended) {
      return res.status(400).json({ message: 'You have already joined this meeting.' });
    }

    meeting.attendees.push(userId);
    meeting.attendedCount += 1;
    await meeting.save();

    await User.findByIdAndUpdate(userId, { $inc: { meetingsAttended: 1 } });

    res.json({
      message: `✅ Attendance marked for "${meeting.type}" meeting on ${new Date(meeting.time).toLocaleDateString('en-IN')}`,
      meetingType: meeting.type,
      venue: meeting.venue,
      time: meeting.time,
      attendedCount: meeting.attendedCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Join meeting failed', error: err.message });
  }
};

// ─── DELETE MEETING ───────────────────────────────────────────────────────────
exports.deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = req.user;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    // Only the chairman who created it or Super Admin can delete
    if (user.role !== 'Super Admin' && meeting.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizing chairman can delete this meeting' });
    }

    // Prevent deleting already-completed meetings
    if (meeting.status === 'Completed') {
      return res.status(400).json({ message: 'Completed meetings cannot be deleted' });
    }

    await meeting.deleteOne();
    res.json({ message: 'Meeting deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete meeting failed', error: err.message });
  }
};

// ─── MARK ATTENDANCE (legacy) ─────────────────────────────────────────────────
exports.markAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.attendees.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already marked as attended' });
    }

    meeting.attendees.push(userId);
    meeting.attendedCount += 1;
    await meeting.save();

    await User.findByIdAndUpdate(userId, { $inc: { meetingsAttended: 1 } });

    res.json({ message: 'Attendance marked', meetingId, attendedCount: meeting.attendedCount });
  } catch (err) {
    res.status(500).json({ message: 'Mark attendance failed', error: err.message });
  }
};

// ─── COMPLETE MEETING ─────────────────────────────────────────────────────────
exports.completeMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const chairman = req.user;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.createdBy.toString() !== chairman._id.toString() && chairman.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Only the organizing chairman can complete this meeting' });
    }

    meeting.status = 'Completed';
    meeting.completedAt = new Date();
    await meeting.save();

    res.json({ message: 'Meeting marked as completed', meeting });
  } catch (err) {
    res.status(500).json({ message: 'Complete meeting failed', error: err.message });
  }
};

// ─── GET MEETING STATS ────────────────────────────────────────────────────────
exports.getMeetingStats = async (req, res) => {
  try {
    const { locationId, year, month } = req.query;
    const query = {};
    if (locationId) query.locationId = locationId;
    if (year) {
      query.time = {
        $gte: new Date(year, (month || 1) - 1, 1),
        $lt: month ? new Date(year, month, 1) : new Date(parseInt(year) + 1, 0, 1)
      };
    }

    const meetings = await Meeting.find(query);
    const stats = {
      total: meetings.length,
      scheduled: meetings.filter(m => m.status === 'Scheduled').length,
      completed: meetings.filter(m => m.status === 'Completed').length,
      totalInvited: meetings.reduce((s, m) => s + m.inviteCount, 0),
      totalAttended: meetings.reduce((s, m) => s + m.attendedCount, 0),
      attendanceRate: meetings.length
        ? Math.round((meetings.reduce((s, m) => s + m.attendedCount, 0) /
            Math.max(meetings.reduce((s, m) => s + m.inviteCount, 0), 1)) * 100)
        : 0,
      byType: {
        Growth: meetings.filter(m => m.type === 'Growth').length,
        Problems: meetings.filter(m => m.type === 'Problems').length,
        Solutions: meetings.filter(m => m.type === 'Solutions').length,
        'C2C Networking': meetings.filter(m => m.type === 'C2C Networking').length
      }
    };

    res.json({ stats, meetings });
  } catch (err) {
    res.status(500).json({ message: 'Fetch meeting stats failed', error: err.message });
  }
};

const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Chairman / Super Admin — create, edit, complete & delete meetings
router.post('/',                       authenticateToken, authorize('Super Admin', 'Chairman'), meetingController.createMeeting);
router.put('/:meetingId',              authenticateToken, authorize('Super Admin', 'Chairman'), meetingController.updateMeeting);
router.patch('/:meetingId/complete',   authenticateToken, authorize('Super Admin', 'Chairman'), meetingController.completeMeeting);
router.delete('/:meetingId',           authenticateToken, authorize('Super Admin', 'Chairman'), meetingController.deleteMeeting);

// Members — fetch & join
router.get('/',                        authenticateToken, meetingController.getMeetings);
router.post('/join',                   authenticateToken, meetingController.joinByCode);        // join via Meeting ID or QR scan
router.patch('/:meetingId/attend',     authenticateToken, meetingController.markAttendance);    // legacy

// Stats
router.get('/stats',                   authenticateToken, meetingController.getMeetingStats);

module.exports = router;

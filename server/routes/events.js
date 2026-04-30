const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', eventController.getEvents);
router.post('/', authenticateToken, authorize('Super Admin', 'Chairman'), upload.single('poster'), eventController.createEvent);
router.delete('/:eventId', authenticateToken, authorize('Super Admin', 'Chairman'), eventController.deleteEvent);

module.exports = router;

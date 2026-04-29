const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/auth');

// Public
router.get('/home', statsController.getHomeStats);
router.get('/leaderboard', statsController.getLeaderboard);

// Protected
router.get('/member', authenticateToken, statsController.getMemberStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/search', userController.searchUsers);
router.get('/public/:userId', userController.getPublicMemberProfile);

// Protected
router.get('/profile',          authenticateToken, userController.getUserProfile);
router.get('/profile/:userId',  authenticateToken, userController.getUserProfile);
router.put('/profile',          authenticateToken, upload.single('profilePic'), userController.updateUserProfile);
router.get('/by-location',      authenticateToken, userController.getUsersByLocation);
router.get('/by-table',         authenticateToken, userController.getUsersByTable);
router.get('/all',              authenticateToken, authorize('Super Admin'), userController.getAllUsers);

// Chairman / Super Admin
router.get('/approvals/pending', authenticateToken, authorize('Super Admin', 'Chairman'), userController.getPendingApprovals);
router.patch('/assign-role',     authenticateToken, authorize('Super Admin', 'Chairman'), userController.assignRole);

module.exports = router;

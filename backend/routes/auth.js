const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.post('/register', upload.single('profilePic'), authController.registerUser);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected
router.post('/change-password', authenticateToken, authController.changePassword);

// Chairman / Super Admin
router.patch('/approve/:userId', authenticateToken, authorize('Super Admin', 'Chairman'), authController.approveUser);
router.patch('/reject/:userId',  authenticateToken, authorize('Super Admin', 'Chairman'), authController.rejectUser);

module.exports = router;

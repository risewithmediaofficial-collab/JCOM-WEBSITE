const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middleware/auth');

const superAdmin = [authenticateToken, authorize('Super Admin')];
const chairmanUp = [authenticateToken, authorize('Super Admin', 'Chairman')];

// Location Management (Super Admin)
router.get('/locations', adminController.getLocations);         // PUBLIC - needed for registration
router.post('/locations', ...superAdmin, adminController.createLocation);
router.patch('/locations/:locationId', ...superAdmin, adminController.updateLocation);

// Table Management (Super Admin)
router.post('/tables', ...superAdmin, adminController.createTable);
router.get('/tables/:locationId', adminController.getTablesByLocation); // PUBLIC - needed for registration

// Chairman Management (Super Admin)
router.post('/chairman', ...superAdmin, adminController.createChairman);
router.patch('/chairman/rotate', ...superAdmin, adminController.rotateChairman);

// Approvals (Chairman)
router.get('/approvals', ...chairmanUp, adminController.getPendingApprovals);

// Members by location (Chairman)
router.get('/members/:locationId', ...chairmanUp, adminController.getMembersByLocation);

// Approved members by location — for chairman assignment (Super Admin)
router.get('/members/:locationId/approved', ...superAdmin, adminController.getMembersByLocation);

// Full stats (Super Admin)
router.get('/stats', ...superAdmin, adminController.getFullStats);
router.get('/crm-members', ...superAdmin, adminController.getCRMMemberOverview);

module.exports = router;

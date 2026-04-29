const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { authenticateToken } = require('../middleware/auth');

router.post('/public-enquiry/:userId', crmController.createPublicEnquiry);
router.get('/dashboard', authenticateToken, crmController.getCRMDashboard);
router.patch('/entry/:entryId', authenticateToken, crmController.updateCRMEntry);
router.delete('/entry/:entryId', authenticateToken, crmController.deleteEntry);
router.post('/manual', authenticateToken, crmController.createManualEntry);
router.post('/convert/:connectionId', authenticateToken, crmController.convertToLead);

module.exports = router;

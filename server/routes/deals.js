const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticateToken } = require('../middleware/auth');

router.post('/',                      authenticateToken, dealController.createDeal);
router.patch('/confirm/:dealId',      authenticateToken, dealController.confirmDeal);
router.get('/my',                     authenticateToken, dealController.getMyDeals);
router.get('/stats',                  authenticateToken, dealController.getDealStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { authenticateToken } = require('../middleware/auth');

router.post('/request',                    authenticateToken, connectionController.sendRequest);
router.patch('/accept/:connectionId',      authenticateToken, connectionController.acceptRequest);
router.patch('/cancel/:connectionId',      authenticateToken, connectionController.cancelRequest);
router.patch('/convert/:connectionId',     authenticateToken, connectionController.convertToRevenue);
router.post('/rate/:connectionId',         authenticateToken, connectionController.submitRating);
router.get('/my',                          authenticateToken, connectionController.getMyConnections);
router.get('/stats',                       authenticateToken, connectionController.getConnectionStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get dashboard stats
router.get('/stats', dashboardController.getStats);

// Get analytics data
router.get('/analytics', dashboardController.getAnalytics);

module.exports = router;


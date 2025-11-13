const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const leadRoutes = require('./leadRoutes');
const activityRoutes = require('./activityRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/activities', activityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;


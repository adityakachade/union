const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const activityController = require('../controllers/activityController');
const { authenticate, authorizeOwnerOrManager } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Get activities for a lead
router.get('/leads/:leadId', authorizeOwnerOrManager, activityController.getLeadActivities);

// Create activity for a lead
router.post(
  '/leads/:leadId',
  authorizeOwnerOrManager,
  [
    body('type').isIn(['note', 'call', 'meeting', 'email', 'status_change', 'assignment']),
    body('description').trim().notEmpty()
  ],
  handleValidationErrors,
  activityController.createActivity
);

// Update activity
router.put(
  '/:id',
  [
    body('description').optional().trim().notEmpty()
  ],
  handleValidationErrors,
  activityController.updateActivity
);

// Delete activity
router.delete('/:id', activityController.deleteActivity);

module.exports = router;


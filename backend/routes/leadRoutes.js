const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const leadController = require('../controllers/leadController');
const { authenticate, authorizeOwnerOrManager } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Get all leads
router.get('/', leadController.getAllLeads);

// Get lead by ID
router.get('/:id', authorizeOwnerOrManager, leadController.getLeadById);

// Create lead
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
    body('value').optional().isFloat({ min: 0 })
  ],
  handleValidationErrors,
  leadController.createLead
);

// Update lead
router.put(
  '/:id',
  authorizeOwnerOrManager,
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
    body('value').optional().isFloat({ min: 0 })
  ],
  handleValidationErrors,
  leadController.updateLead
);

// Delete lead
router.delete('/:id', authorizeOwnerOrManager, leadController.deleteLead);

module.exports = router;


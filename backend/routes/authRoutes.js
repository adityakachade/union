const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').optional().isIn(['admin', 'manager', 'sales_executive'])
  ],
  handleValidationErrors,
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  handleValidationErrors,
  authController.login
);

// Get profile (protected)
router.get('/profile', authenticate, authController.getProfile);

// Update profile (protected)
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail()
  ],
  handleValidationErrors,
  authController.updateProfile
);

module.exports = router;


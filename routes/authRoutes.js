const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Auth endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Budget endpoints linked to Auth
router.get('/budget-limit', requireAuth, authController.getBudgetLimit);
router.post('/budget-limit', requireAuth, authController.updateBudgetLimit);

module.exports = router;
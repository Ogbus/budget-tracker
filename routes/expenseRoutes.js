const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { requireAuth } = require('../middleware/authMiddleware');

// All expense routes require Authentication
router.get('/', requireAuth, expenseController.getExpenses);
router.post('/', requireAuth, expenseController.addExpense);
router.put('/:id', requireAuth, expenseController.updateExpense);
router.delete('/:id', requireAuth, expenseController.deleteExpense);

module.exports = router;
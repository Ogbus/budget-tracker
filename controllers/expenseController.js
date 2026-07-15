const db = require('../config/database');

// Get all expenses
exports.getExpenses = (req, res) => {
    const query = `SELECT * FROM expenses WHERE user_id = ? ORDER BY id DESC`;
    db.all(query, [req.user.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Add new expense
exports.addExpense = (req, res) => {
    const { description, amount, category } = req.body;
    if (!description || !amount || !category) {
        return res.status(400).json({ error: "Please fill out all fields." });
    }

    const query = `INSERT INTO expenses (user_id, description, amount, category) VALUES (?, ?, ?, ?)`;
    db.run(query, [req.user.userId, description, amount, category], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Expense added", expenseId: this.lastID });
    });
};

// Update an expense
exports.updateExpense = (req, res) => {
    const expenseId = req.params.id;
    const userId = req.user.userId;
    const { description, amount, category } = req.body;

    if (!description || !amount || !category) {
        return res.status(400).json({ error: "Please fill out all fields." });
    }

    const query = `UPDATE expenses SET description = ?, amount = ?, category = ? WHERE id = ? AND user_id = ?`;
    db.run(query, [description, amount, category, expenseId, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0) {
            return res.status(404).json({ error: "Expense not found or unauthorized." });
        }
        res.json({ message: "Expense updated successfully!" });
    });
};

// Delete an expense
exports.deleteExpense = (req, res) => {
    const expenseId = req.params.id;
    const userId = req.user.userId;

    const query = `DELETE FROM expenses WHERE id = ? AND user_id = ?`;
    db.run(query, [expenseId, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        if (this.changes === 0) {
            return res.status(404).json({ error: "Expense not found or unauthorized." });
        }
        res.json({ message: "Expense deleted successfully!" });
    });
};
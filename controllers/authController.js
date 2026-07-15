const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validatePassword, JWT_SECRET } = require('../middleware/authMiddleware');

// Register User
exports.register = async (req, res) => {
    // Grab first_name and last_name from the request body
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Please fill all fields." });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ 
            error: "Password must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, and one number." 
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Include first_name and last_name in the insert query
        const query = `INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)`;
        
        db.run(query, [email, hashedPassword, firstName, lastName], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({ error: "Email already registered." });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Registration successful!" });
        });
    } catch (e) {
        res.status(500).json({ error: "Server error during registration." });
    }
};

// Login User
exports.login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Please fill all fields." });

    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: "Invalid email or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid email or password." });

        // Pack the firstName into the token so the frontend can read it instantly
        const token = jwt.sign(
            { userId: user.id, email: user.email, firstName: user.first_name }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // Send firstName back in the response as well
        res.json({ 
            message: "Login successful!", 
            token, 
            email: user.email,
            firstName: user.first_name 
        });
    });
};

// Get Budget Limit
exports.getBudgetLimit = (req, res) => {
    const query = `SELECT monthly_budget FROM users WHERE id = ?`;
    db.get(query, [req.user.userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ monthly_budget: row ? row.monthly_budget : 0.0 });
    });
};

// Update Budget Limit
exports.updateBudgetLimit = (req, res) => {
    const { limit } = req.body;
    if (limit === undefined || isNaN(limit) || limit < 0) {
        return res.status(400).json({ error: "Please enter a valid budget limit." });
    }

    const query = `UPDATE users SET monthly_budget = ? WHERE id = ?`;
    db.run(query, [limit, req.user.userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Budget limit updated successfully!", monthly_budget: limit });
    });
};
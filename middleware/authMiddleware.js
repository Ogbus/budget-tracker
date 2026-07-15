const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-super-complex-secret-jwt-key'; // Keep consistent with your secret key

// Password Strength Validator (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

// Require JWT Auth Token Middleware
const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Access denied. Token missing." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attaches { userId, email }
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

module.exports = {
    requireAuth,
    validatePassword,
    JWT_SECRET
};
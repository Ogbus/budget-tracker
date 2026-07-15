const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routers
app.use('/api', authRoutes);         // Handles /api/register, /api/login, /api/budget-limit
app.use('/api/expenses', expenseRoutes); // Handles /api/expenses, /api/expenses/:id

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
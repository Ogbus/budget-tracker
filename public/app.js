// DOM Elements
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const authToggle = document.getElementById('toggle-link');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalSpentEl = document.getElementById('total-spent');

// New DOM Elements for Budget Limit
const progressContainer = document.getElementById('progress-container');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const budgetLimitInput = document.getElementById('budget-limit-input');
const setBudgetBtn = document.getElementById('set-budget-btn');
const signupFields = document.getElementById('signup-fields');
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');

const formTitle = document.getElementById('form-title');
const expenseIdInput = document.getElementById('expense-id');
const submitExpenseBtn = document.getElementById('submit-expense-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// State tracking
let expenseChart = null; // Keeps track of the active Chart.js instance
let isLoginMode = true;
let monthlyBudget = 0; // Track the current user's budget limit

// Currency Formatter helper for Nigerian Naira (NGN)
const nairaFormatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
});

// Helper to update the input field placeholder dynamically
function updateBudgetPlaceholder() {
    if (monthlyBudget > 0) {
        budgetLimitInput.placeholder = `Current Limit: ${nairaFormatter.format(monthlyBudget)}`;
    } else {
        budgetLimitInput.placeholder = "Set Budget Limit (₦)";
    }
}

// Load and Display Dashboard
async function showDashboard(name) {
    userDisplay.textContent = name;
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    
    await fetchBudgetLimit(); // Fetch user's budget first
    loadExpenses(); // Then load expenses and update progress
}

// Function to process expenses and render/update the doughnut chart
function updateChart(expenses) {
    const ctx = document.getElementById('expenseChart').getContext('2d');

    // 1. Group expenses by category
    const categoryTotals = {};
    expenses.forEach(exp => {
        const category = exp.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(exp.amount);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // 2. If no expenses exist, show a placeholder empty state chart or destroy the active one
    if (expenses.length === 0) {
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }
        return;
    }

    // 3. Define a vibrant color palette for your spending categories
    const backgroundColors = [
        '#4e73df', // Blue
        '#1cc88a', // Teal / Green
        '#36b9cc', // Light Blue
        '#f6c23e', // Yellow
        '#e74a3b', // Red
        '#9b59b6', // Purple
        '#34495e', // Dark Blue
        '#16a085', // Sea Green
        '#e67e22', // Orange
        '#2ecc71'  // Emerald
    ];

    // 4. Create or update the Chart instance
    // Map a specific color to each index in your labels array
    const sliceColors = labels.map((_, index) => {
        // This uses the modulo operator (%) so if you have more than 10 categories,
        // it safely loops back and repeats colors instead of crashing or showing grey!
        return backgroundColors[index % backgroundColors.length];
    });

    if (expenseChart) {
        // If updating, assign the dynamic colors array and the new labels/data
        expenseChart.data.labels = labels;
        expenseChart.data.datasets[0].data = data;
        expenseChart.data.datasets[0].backgroundColor = sliceColors; // Ensure colors update dynamically
        expenseChart.update();
    } else {
        // Create a fresh chart
        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: sliceColors, // Set mapped colors here
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw || 0;
                                return ` ${context.label}: ${nairaFormatter.format(value)}`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
}
// Check token on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (token && userEmail) {
        showDashboard(userEmail);
    } else {
        showAuth();
    }
});

// Password validation regex
function isPasswordStrong(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

// // Toggle between Login & Register modes
// toggleLink.addEventListener('click', () => {
//     isLoginMode = !isLoginMode;
//     authTitle.textContent = isLoginMode ? 'Log In' : 'Create Account';
//     authBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
//     toggleLink.textContent = isLoginMode ? 'Register here' : 'Log in here';
//     document.getElementById('auth-toggle').firstChild.textContent = isLoginMode 
//         ? "Don't have an account? " 
//         : "Already have an account? ";
// });

// Example toggle event listener:
authToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        authTitle.textContent = "Login";
        authSubmitBtn.textContent = "Login";
        authToggle.innerHTML = "Don't have an account? <strong>Register</strong>";
        signupFields.classList.add('hidden'); // Hide name inputs
        firstNameInput.removeAttribute('required');
        lastNameInput.removeAttribute('required');
    } else {
        authTitle.textContent = "Register";
        authSubmitBtn.textContent = "Register";
        authToggle.innerHTML = "Already have an account? <strong>Login</strong>";
        signupFields.classList.remove('hidden'); // Show name inputs
        firstNameInput.setAttribute('required', 'true');
        lastNameInput.setAttribute('required', 'true');
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    const url = isLoginMode ? '/api/login' : '/api/register';
    
    // Prepare data payload
    const payload = { email, password };
    if (!isLoginMode) {
        payload.firstName = firstNameInput.value;
        payload.lastName = lastNameInput.value;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Authentication failed.');

        if (isLoginMode) {
            // Save token and first name in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_name', data.firstName); // Save first name!
            
            showDashboard(data.firstName); // Greet with first name
        } else {
            alert("Registration successful! Please log in.");
            isLoginMode = true;
            authToggle.click(); // Switch back to login view
        }
    } catch (err) {
        alert(err.message);
    }
});

// Logout Button
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    showAuth();
});

// Load and Display Dashboard
async function showDashboard(name) {
    userDisplay.textContent = name;
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    
    await fetchBudgetLimit(); // Fetch user's budget first
    loadExpenses(); // Then load expenses and update progress
}

// Fetch budget limit from backend
async function fetchBudgetLimit() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/budget-limit', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        monthlyBudget = data.monthly_budget || 0;
        
        // Clear the input and show the active limit in the placeholder
        budgetLimitInput.value = '';
        updateBudgetPlaceholder();
    } catch (err) {
        console.error("Error fetching budget limit:", err);
    }
}

// Set Budget Limit Button Click Handler
setBudgetBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) return showAuth();

    const limitValue = parseFloat(budgetLimitInput.value);
    const finalLimit = isNaN(limitValue) || limitValue < 0 ? 0 : limitValue;

    try {
        const response = await fetch('/api/budget-limit', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ limit: finalLimit })
        });

        if (!response.ok) throw new Error("Failed to update budget limit.");

        const data = await response.json();
        monthlyBudget = data.monthly_budget;
        
        // Clear the input field after saving
        budgetLimitInput.value = '';
        updateBudgetPlaceholder();
        
        loadExpenses(); // Re-render progress bar
    } catch (err) {
        alert(err.message);
    }
});


// Update the progress bar calculations and colors
function updateBudgetProgress(totalSpent) {
    if (monthlyBudget <= 0) {
        progressContainer.classList.add('hidden');
        return;
    }

    progressContainer.classList.remove('hidden');
    
    // Calculate percentage spent (cap at 100 for bar width display)
    const rawPercentage = (totalSpent / monthlyBudget) * 100;
    const barWidth = Math.min(rawPercentage, 100);

    // Update Text: "45% (₦4,500.00 / ₦10,000.00)"
    progressText.textContent = `${rawPercentage.toFixed(0)}% (${nairaFormatter.format(totalSpent)} / ${nairaFormatter.format(monthlyBudget)})`;
    
    // Set Bar width
    progressBar.style.width = `${barWidth}%`;

    // Visual Cue: If spending exceeds the budget limit, turn the bar red!
    if (rawPercentage >= 80) {
        progressBar.style.backgroundColor = '#ef4444'; // Red
    } else if (rawPercentage >= 60) {
        progressBar.style.backgroundColor = '#f59e0b'; // Amber warning
    } else {
        progressBar.style.backgroundColor = '#4f46e5'; // Default indigo
    }
}

// Show login screen
function showAuth() {
    dashboardContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    authForm.reset();
}

/* --- BUDGET TRACKING ACTIONS (JWT Authorized with CRUD) --- */

// Load Expenses from database (Formatted in Nigerian Naira ₦)
async function loadExpenses() {
    const token = localStorage.getItem('token');
    if (!token) return showAuth();

    try {
        const response = await fetch('/api/expenses', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            alert("Session expired. Please log in again.");
            logoutBtn.click();
            return;
        }

        if (!response.ok) throw new Error('Could not retrieve expenses.');
        const expenses = await response.json();

        updateChart(expenses)
        
        expenseList.innerHTML = '';
        let total = 0;

        // Currency Formatter helper for Nigerian Naira (NGN)
        const nairaFormatter = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        });

        expenses.forEach(exp => {
            total += exp.amount;
            const li = document.createElement('li');
            li.className = 'expense-item';
            
            // Format single expense amount
            const formattedAmount = nairaFormatter.format(exp.amount);

            li.innerHTML = `
                <div>
                    <strong>${exp.description}</strong> 
                    <span style="font-size: 12px; color: #6b7280;">(${exp.category})</span>
                </div>
                <div class="action-buttons">
                    <span style="font-weight: bold; margin-right: 10px;">${formattedAmount}</span>
                    <button class="btn-edit" onclick="startEdit(${exp.id}, '${exp.description.replace(/'/g, "\\'")}', ${exp.amount}, '${exp.category}')">Edit</button>
                    <button class="btn-delete" onclick="deleteExpense(${exp.id})">Delete</button>
                </div>
            `;
            expenseList.appendChild(li);
        });

        // Format and display the grand total
        totalSpentEl.textContent = nairaFormatter.format(total);

        updateBudgetProgress(total);

    } catch (err) {
        console.error(err);
    }
}

// Add or Edit Expense Form Submit
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return showAuth();

    const id = expenseIdInput.value;
    const description = document.getElementById('expense-desc').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    const bodyData = { description, amount, category };

    // Determine if we are updating (PUT) or creating (POST)
    const isEdit = id !== "";
    const url = isEdit ? `/api/expenses/${id}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });

        if (response.status === 401) {
            alert("Session expired. Please log in again.");
            logoutBtn.click();
            return;
        }

        if (!response.ok) throw new Error('Failed to save expense.');

        resetForm();
        loadExpenses(); // Refresh list & running total
    } catch (err) {
        alert(err.message);
    }
});

// Delete an Expense
async function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const token = localStorage.getItem('token');
    if (!token) return showAuth();

    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Could not delete expense.");
        
        loadExpenses();
    } catch (err) {
        alert(err.message);
    }
}

// Switch form into "Edit Mode"
function startEdit(id, description, amount, category) {
    formTitle.textContent = "Edit Expense";
    submitExpenseBtn.textContent = "Save Changes";
    cancelEditBtn.classList.remove('hidden');

    expenseIdInput.value = id;
    document.getElementById('expense-desc').value = description;
    document.getElementById('expense-amount').value = amount;
    document.getElementById('expense-category').value = category;

    // Scroll smoothly back up to the form
    document.querySelector('.add-expense').scrollIntoView({ behavior: 'smooth' });
}

// Cancel Edit Button click handler
cancelEditBtn.addEventListener('click', resetForm);

// Reset form helper
function resetForm() {
    formTitle.textContent = "Log New Expense";
    submitExpenseBtn.textContent = "Add Expense";
    cancelEditBtn.classList.add('hidden');
    
    expenseIdInput.value = "";
    expenseForm.reset();
}

// Check if user is already logged in when page loads
const savedToken = localStorage.getItem('token');
const savedName = localStorage.getItem('user_name');

if (savedToken && savedName) {
    showDashboard(savedName);
} else {
    showAuth();
}

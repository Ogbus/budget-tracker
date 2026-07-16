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

// Dark mode
const themeToggleBtn = document.getElementById('theme-toggle-btn');

function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme')
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    applyTheme(isDark ? 'light' : 'dark');
});

// In-app notification (replaces window.alert)
const toastEl = document.getElementById('toast');
let toastTimeout = null;

function showToast(message, type = 'error') {
    clearTimeout(toastTimeout);

    toastEl.textContent = message;
    toastEl.className = `toast toast-show toast-${type}`;

    toastTimeout = setTimeout(() => {
        toastEl.className = 'toast';
    }, 3500);
}

// In-app confirmation dialog (replaces window.confirm)
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkBtn = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
let confirmResolve = null;

function showConfirm(message) {
    confirmMessage.textContent = message;
    confirmOverlay.classList.remove('hidden');

    return new Promise((resolve) => {
        confirmResolve = resolve;
    });
}

function closeConfirm(result) {
    confirmOverlay.classList.add('hidden');
    if (confirmResolve) {
        confirmResolve(result);
        confirmResolve = null;
    }
}

confirmOkBtn.addEventListener('click', () => closeConfirm(true));
confirmCancelBtn.addEventListener('click', () => closeConfirm(false));
confirmOverlay.addEventListener('click', (e) => {
    if (e.target === confirmOverlay) closeConfirm(false);
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

        // Save token and first name, then go straight to the dashboard —
        // this now runs for BOTH login and registration, since the backend
        // issues a token on signup too.
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_name', data.firstName);

        if (isLoginMode) {
            showDashboard(data.firstName);
        } else {
            showToast(`Welcome, ${data.firstName}! Your account is ready.`, 'success');
            showDashboard(data.firstName);
        }
    } catch (err) {
        showToast(err.message);
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
        showToast(err.message);
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
            showToast("Session expired. Please log in again.");
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

// Export expenses to a downloadable CSV file
const exportCsvBtn = document.getElementById('export-csv-btn');

async function exportExpensesToCSV() {
    const token = localStorage.getItem('token');
    if (!token) return showAuth();

    try {
        const response = await fetch('/api/expenses', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            showToast("Session expired. Please log in again.");
            logoutBtn.click();
            return;
        }

        if (!response.ok) throw new Error('Could not export expenses.');
        const expenses = await response.json();

        if (!expenses.length) {
            showToast("No expenses to export yet.", 'error');
            return;
        }

        const csvEscape = (value) => `"${String(value).replace(/"/g, '""')}"`;
        const header = ['Date', 'Description', 'Category', 'Amount (NGN)'];
        const rows = expenses.map(exp => [
            exp.date ? new Date(exp.date).toLocaleString('en-NG') : '',
            exp.description,
            exp.category,
            exp.amount
        ]);

        const csvContent = [header, ...rows]
            .map(row => row.map(csvEscape).join(','))
            .join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-tracker-expenses-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast("Expenses exported!", 'success');
    } catch (err) {
        showToast(err.message);
    }
}

exportCsvBtn.addEventListener('click', exportExpensesToCSV);

// ===== Voice quick-log =====
const micBtn = document.getElementById('mic-btn');
const voicePreview = document.getElementById('voice-preview');
const voicePreviewText = document.getElementById('voice-preview-text');
const voiceConfirmBtn = document.getElementById('voice-confirm-btn');
const voiceEditBtn = document.getElementById('voice-edit-btn');

const CATEGORY_KEYWORDS = {
    Food: ['food', 'jollof', 'eat', 'eating', 'lunch', 'dinner', 'breakfast', 'snack', 'groceries', 'grocery', 'restaurant', 'rice', 'suya'],
    Rent: ['rent', 'bills', 'bill', 'electricity', 'light bill', 'water', 'dstv', 'subscription'],
    Entertainment: ['entertainment', 'movie', 'cinema', 'party', 'netflix', 'outing', 'game', 'games'],
    Transport: ['transport', 'uber', 'bolt', 'bus', 'fuel', 'petrol', 'taxi', 'keke', 'fare']
};

const NUMBER_WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90
};
const MULTIPLIER_WORDS = { hundred: 100, thousand: 1000 };

function wordsToNumber(phrase) {
    const words = phrase.toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0, current = 0, found = false;

    words.forEach(word => {
        if (word in NUMBER_WORDS) {
            current += NUMBER_WORDS[word];
            found = true;
        } else if (word in MULTIPLIER_WORDS) {
            current = (current || 1) * MULTIPLIER_WORDS[word];
            if (word === 'thousand') { total += current; current = 0; }
            found = true;
        }
    });

    total += current;
    return found ? total : null;
}

// Pulls an amount out of the transcript — digits first ("1500"), then a
// fallback for spoken-out numbers ("fifteen hundred").
function extractAmount(transcript) {
    const digitMatch = transcript.match(/\d[\d,]*(\.\d+)?/);
    if (digitMatch) {
        return parseFloat(digitMatch[0].replace(/,/g, ''));
    }

    const words = transcript.toLowerCase().split(/\s+/);
    let run = [];
    for (const word of words) {
        if (word in NUMBER_WORDS || word in MULTIPLIER_WORDS) {
            run.push(word);
        } else if (run.length) {
            break;
        }
    }
    return run.length ? wordsToNumber(run.join(' ')) : null;
}

function extractCategory(transcript) {
    const lower = transcript.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) return category;
    }
    return 'Other';
}

// Whatever's left after stripping the amount, filler words, and the
// matched category keyword becomes the description.
function extractDescription(transcript, category) {
    let text = ` ${transcript.toLowerCase()} `;
    text = text.replace(/\d[\d,]*(\.\d+)?/g, ' ');

    const fillers = ['naira', 'ngn', '₦', 'i spent', 'spent', 'bought', 'paid', 'pay for', 'pay', 'on', 'for'];
    fillers.forEach(word => {
        text = text.split(` ${word} `).join(' ');
    });

    (CATEGORY_KEYWORDS[category] || []).forEach(kw => {
        text = text.split(` ${kw} `).join(' ').split(`${kw} `).join(' ');
    });

    text = text.replace(/\s+/g, ' ').trim();
    if (!text) text = transcript.trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function handleVoiceTranscript(transcript) {
    const amount = extractAmount(transcript);
    const category = extractCategory(transcript);
    const description = extractDescription(transcript, category);

    document.getElementById('expense-desc').value = description;
    document.getElementById('expense-amount').value = amount !== null ? amount : '';
    document.getElementById('expense-category').value = category;

    if (amount === null) {
        showToast("Didn't catch an amount — please fill it in.", 'error');
    }

    const nairaFormatter = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });
    const amountText = amount !== null ? nairaFormatter.format(amount) : 'no amount caught';
    voicePreviewText.textContent = `${amountText} · ${category} · ${description}`;
    voicePreview.classList.remove('hidden');
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognitionAPI) {
    recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-NG';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        handleVoiceTranscript(event.results[0][0].transcript);
    };
    recognition.onerror = () => {
        showToast("Couldn't catch that clearly — try again.");
    };
    recognition.onend = () => {
        micBtn.classList.remove('listening');
        micBtn.textContent = '🎤';
    };
}

micBtn.addEventListener('click', () => {
    if (!recognition) {
        showToast("Voice input isn't supported in this browser. Try Chrome or Edge.");
        return;
    }
    if (micBtn.classList.contains('listening')) {
        recognition.stop();
        return;
    }
    voicePreview.classList.add('hidden');
    micBtn.classList.add('listening');
    micBtn.textContent = '🎙️';
    recognition.start();
});

voiceConfirmBtn.addEventListener('click', () => {
    voicePreview.classList.add('hidden');
    expenseForm.requestSubmit();
});

voiceEditBtn.addEventListener('click', () => {
    voicePreview.classList.add('hidden');
    document.getElementById('expense-desc').focus();
});

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
            showToast("Session expired. Please log in again.");
            logoutBtn.click();
            return;
        }

        if (!response.ok) throw new Error('Failed to save expense.');

        resetForm();
        loadExpenses(); // Refresh list & running total
    } catch (err) {
        showToast(err.message);
    }
});

// Delete an Expense
async function deleteExpense(id) {
    const confirmed = await showConfirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;

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
        showToast(err.message);
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
    voicePreview.classList.add('hidden');
    
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

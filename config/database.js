const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Use SQLITE_DB_PATH env variable if it exists (for production)
// Fall back to local file path (for development)
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'budget.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database opening error: ", err);
});

// Create Database Tables
db.serialize(() => {
    // 1. Create table with new columns for any fresh databases
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        monthly_budget REAL DEFAULT 0.0
    )`);

    // 2. Gracefully add columns to your existing local database
    db.run(`ALTER TABLE users ADD COLUMN first_name TEXT`, (err) => { /* Safe check */ });
    db.run(`ALTER TABLE users ADD COLUMN last_name TEXT`, (err) => { /* Safe check */ });
    db.run(`ALTER TABLE users ADD COLUMN monthly_budget REAL DEFAULT 0.0`, (err) => { /* Safe check */ });

    db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

module.exports = db;
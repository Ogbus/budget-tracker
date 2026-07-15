const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Resolve the correct database file path
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'budget.db');

// 2. Initialize and open the database connection immediately in the outer scope
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log(`Connected to SQLite database at: ${dbPath}`);
        
        // Enable WAL mode for smooth, concurrent operations in production
        db.run('PRAGMA journal_mode = WAL', (err) => {
            if (err) console.error("Failed to enable WAL mode:", err);
        });
    }
});

// const path = require('path');
// const sqlite3 = require('sqlite3').verbose();
// const { open } = require('sqlite');

// // 1. Determine the correct path
// const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'budget.db');

// // 2. Open and return the database connection asynchronously
// async function connectDB() {
//     const db = await open({
//         filename: dbPath,
//         driver: sqlite3.Database
//     });

//     // Enable WAL mode for high performance on the cloud
//     await db.run('PRAGMA journal_mode = WAL');
    
//     console.log(`Connected to SQLite database at: ${dbPath}`);
//     return db;
// }

// const path = require('path');
// const sqlite3 = require('sqlite3').verbose();

// // Use SQLITE_DB_PATH env variable if it exists (for production)
// // Fall back to local file path (for development)
// const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'budget.db');

// const db = new sqlite3.Database(dbPath, (err) => {
//     if (err) console.error("Database opening error: ", err);
// });

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

// 3. Export the db instance so your models and controllers can use it immediately
module.exports = db;

// ==========================================
// Your original schema initialization (around line 34) starts below:
// ==========================================
db.serialize(() => {
    // db.run("CREATE TABLE IF NOT EXISTS...") etc.
});

// Export the connection promise
// const dbPromise = connectDB();
// module.exports = dbPromise;

// module.exports = db;
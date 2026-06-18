const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.db');

// Create/open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Discord credentials table (encrypted)
  db.run(`
    CREATE TABLE IF NOT EXISTS discord_creds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      encrypted_token TEXT NOT NULL,
      discord_user_id TEXT,
      discord_username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Clone jobs table
  db.run(`
    CREATE TABLE IF NOT EXISTS clone_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_guild_id TEXT NOT NULL,
      destination_guild_id TEXT NOT NULL,
      source_guild_name TEXT,
      destination_guild_name TEXT,
      status TEXT DEFAULT 'pending',
      progress TEXT DEFAULT '',
      started_at DATETIME,
      completed_at DATETIME,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Saved servers table (bookmarks)
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_servers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      guild_name TEXT,
      is_source BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

// Helper functions
const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

module.exports = {
  db,
  dbGet,
  dbAll,
  dbRun
};
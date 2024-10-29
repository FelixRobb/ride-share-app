import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'

let db: Database | null = null;

export async function initializeDb() {
  if (db) return db;

  try {
    db = await open({
      filename: path.join(process.cwd(), 'rideshare.sqlite'),
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT UNIQUE,
        password TEXT
      );

      CREATE TABLE IF NOT EXISTS rides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_location TEXT,
        to_location TEXT,
        time TEXT,
        requester_id INTEGER,
        accepter_id INTEGER,
        status TEXT,
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (accepter_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        contact_id INTEGER,
        status TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (contact_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT,
        type TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function getDb() {
  if (!db) {
    await initializeDb();
  }
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'girigo.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(dbInstance);
  }
  return dbInstance;
};

const initializeDatabase = async (db: SQLite.SQLiteDatabase) => {
  try {
    // Enable WAL mode for better concurrent read/write performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // 1. Users Table (Local Profile)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    // 2. Gamification Stats (Singleton)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS gamification_stats (
        id TEXT PRIMARY KEY CHECK (id = 'me'),
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        currentStreak INTEGER DEFAULT 0,
        longestStreak INTEGER DEFAULT 0,
        lastActivityDate TEXT,
        notificationsEnabled INTEGER DEFAULT 1
      );
    `);
    
    // Insert singleton row if it doesn't exist
    await db.execAsync(`
      INSERT OR IGNORE INTO gamification_stats (id) VALUES ('me');
    `);

    // 3. Wishes Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        deadline TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        xpEarned INTEGER DEFAULT 0,
        commitment TEXT,
        createdAt INTEGER NOT NULL,
        completedAt INTEGER
      );
    `);

    // Indexes for <2s query performance (Crucial for NFR-2.1)
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status);`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_deadline ON wishes(deadline);`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_category ON wishes(category);`);

    // 4. Activity Log (For Heatmap & Streaks)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS activity_log (
        date TEXT PRIMARY KEY,
        actionCount INTEGER DEFAULT 1
      );
    `);

    console.log('✅ Girigo Database Initialized Successfully');
  } catch (error) {
    console.error('❌ Database Initialization Failed:', error);
    throw error;
  }
};

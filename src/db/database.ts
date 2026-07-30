import * as SQLite from 'expo-sqlite';

const DB_NAME = 'girigo.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }
  
  if (isInitializing) {
    // Wait for initialization to complete
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (dbInstance && !isInitializing) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    return dbInstance!;
  }
  
  isInitializing = true;
  
  try {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(dbInstance);
    isInitializing = false;
    return dbInstance;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    isInitializing = false;
    dbInstance = null;
    throw error;
  }
};

const initializeDatabase = async (db: SQLite.SQLiteDatabase) => {
  try {
    // Enable WAL mode for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // 1. Users Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
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
      )
    `);
    
    // Insert singleton row if it doesn't exist
    await db.runAsync(
      'INSERT OR IGNORE INTO gamification_stats (id) VALUES (?)',
      ['me']
    );

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
      )
    `);

    // Create indexes for performance
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status)`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_deadline ON wishes(deadline)`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_category ON wishes(category)`);

    // 4. Activity Log
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS activity_log (
        date TEXT PRIMARY KEY,
        actionCount INTEGER DEFAULT 1
      )
    `);

    console.log('✅ Girigo Database Initialized Successfully');
  } catch (error) {
    console.error('❌ Database table creation failed:', error);
    throw error;
  }
};

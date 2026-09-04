import * as SQLite from 'expo-sqlite';

const DB_NAME = 'girigo.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  
  if (isInitializing) {
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
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // 1. Users table (name is UNIQUE for easy login)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, 
        name TEXT UNIQUE NOT NULL, 
        avatar TEXT NOT NULL, 
        createdAt INTEGER NOT NULL
      )
    `);

    // 2. Gamification stats keyed by userId
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS gamification_stats (
        userId TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0, 
        level INTEGER DEFAULT 1, 
        currentStreak INTEGER DEFAULT 0,
        longestStreak INTEGER DEFAULT 0, 
        lastActivityDate TEXT, 
        notificationsEnabled INTEGER DEFAULT 1,
        dailyReminderId TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // 3. Wishes table with userId
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY, 
        userId TEXT NOT NULL,
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
        completedAt INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_user ON wishes(userId)`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status)`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_wishes_deadline ON wishes(deadline)`);

    // 4. Activity log with userId
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS activity_log (
        userId TEXT NOT NULL,
        date TEXT NOT NULL, 
        actionCount INTEGER DEFAULT 1,
        PRIMARY KEY (userId, date),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    console.log('✅ Girigo Database Initialized with Multi-User Support');
  } catch (error) {
    console.error('❌ Database table creation failed:', error);
    throw error;
  }
};
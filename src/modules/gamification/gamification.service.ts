import { getDatabase } from '../../db/database';

export interface GamificationStats {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export const GamificationService = {
  async getStats(userId: string): Promise<GamificationStats | null> {
    const db = await getDatabase();
    const stats = await db.getFirstAsync('SELECT * FROM gamification_stats WHERE userId = ?', [userId]);
    return stats as GamificationStats | null;
  },

  calculateLevel(totalXp: number): number {
    let level = 1;
    while (true) {
      const xpRequiredForNextLevel = 500 * level * (level + 1) / 2;
      if (totalXp < xpRequiredForNextLevel) return level;
      level++;
    }
  },

  calculateXpEarned(priority: string, deadline: string): number {
    const baseXp = priority === 'high' ? 150 : priority === 'medium' ? 100 : 50;
    const hoursUntilDeadline = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilDeadline > 24 ? Math.round(baseXp * 1.25) : baseXp;
  },

  async processWishCompletion(userId: string, wishId: string, priority: string, deadline: string): Promise<{ xpEarned: number, newLevel: number, leveledUp: boolean }> {
    const db = await getDatabase();
    const xpEarned = this.calculateXpEarned(priority, deadline);
    
    let currentStats = await this.getStats(userId);
    
    // ✅ FIX: Handle null case properly with explicit check and throw
    if (!currentStats) {
      // Initialize stats if missing
      await db.runAsync('INSERT INTO gamification_stats (userId) VALUES (?)', [userId]);
      currentStats = await this.getStats(userId);
      
      // If still null, throw an error (this should never happen in practice)
      if (!currentStats) {
        throw new Error('Failed to initialize gamification stats for user: ' + userId);
      }
    }

    const newXp = currentStats.xp + xpEarned;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > currentStats.level;

    await db.runAsync(
      'UPDATE gamification_stats SET xp = ?, level = ? WHERE userId = ?',
      [newXp, newLevel, userId]
    );

    await db.runAsync(
      'UPDATE wishes SET xpEarned = ?, status = ?, completedAt = ? WHERE id = ?',
      [xpEarned, 'completed', Date.now(), wishId]
    );

    return { xpEarned, newLevel, leveledUp };
  },

  async checkDailyStreak(userId: string): Promise<{ streakUpdated: boolean, newStreak: number }> {
    const db = await getDatabase();
    const stats = await this.getStats(userId);
    if (!stats) return { streakUpdated: false, newStreak: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastActivityDate === today) return { streakUpdated: false, newStreak: stats.currentStreak };

    let newStreak = stats.currentStreak;
    let newLongest = stats.longestStreak;

    if (!stats.lastActivityDate) {
      newStreak = 1;
    } else {
      const diffDays = Math.ceil(Math.abs(new Date(today).getTime() - new Date(stats.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24));
      newStreak = diffDays === 1 ? stats.currentStreak + 1 : 1;
    }

    if (newStreak > newLongest) newLongest = newStreak;

    await db.runAsync(
      'UPDATE gamification_stats SET currentStreak = ?, longestStreak = ?, lastActivityDate = ? WHERE userId = ?',
      [newStreak, newLongest, today, userId]
    );

    return { streakUpdated: true, newStreak };
  }
};
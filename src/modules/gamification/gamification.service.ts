import { getDatabase } from '../../db/database';

export interface GamificationStats {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO Date string (YYYY-MM-DD)
}

export const GamificationService = {
  // 1. Get current stats
  async getStats(): Promise<GamificationStats> {
    const db = await getDatabase();
    const stats = await db.getFirstAsync('SELECT * FROM gamification_stats WHERE id = ?', ['me']);
    return stats as GamificationStats;
  },

  // 2. Calculate Level based on Total XP
  // Formula: Level N requires 500 * N * (N+1) / 2 XP
  calculateLevel(totalXp: number): number {
    let level = 1;
    while (true) {
      const xpRequiredForNextLevel = 500 * level * (level + 1) / 2;
      if (totalXp < xpRequiredForNextLevel) {
        return level;
      }
      level++;
    }
  },

  // 3. Calculate XP earned for completing a wish
  // Base: Low=50, Med=100, High=150. Bonus: +25% if completed >24h before deadline.
  calculateXpEarned(priority: string, deadline: string): number {
    const baseXp = priority === 'high' ? 150 : priority === 'medium' ? 100 : 50;
    
    const deadlineTime = new Date(deadline).getTime();
    const now = Date.now();
    const hoursUntilDeadline = (deadlineTime - now) / (1000 * 60 * 60);
    
    // If completed more than 24 hours before deadline, give 25% bonus
    const isEarly = hoursUntilDeadline > 24;
    return isEarly ? Math.round(baseXp * 1.25) : baseXp;
  },

  // 4. Process Wish Completion (Award XP & Update Level)
  async processWishCompletion(wishId: string, priority: string, deadline: string): Promise<{ xpEarned: number, newLevel: number, leveledUp: boolean }> {
    const db = await getDatabase();
    
    const xpEarned = this.calculateXpEarned(priority, deadline);
    const currentStats = await this.getStats();
    
    const newXp = currentStats.xp + xpEarned;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > currentStats.level;

    // Update database
    await db.runAsync(
      'UPDATE gamification_stats SET xp = ?, level = ? WHERE id = ?',
      [newXp, newLevel, 'me']
    );

    // Update the wish record with earned XP
    await db.runAsync(
      'UPDATE wishes SET xpEarned = ?, status = ?, completedAt = ? WHERE id = ?',
      [xpEarned, 'completed', Date.now(), wishId]
    );

    return { xpEarned, newLevel, leveledUp };
  },

  // 5. Process Daily Check-in (Streak Logic)
  async checkDailyStreak(): Promise<{ streakUpdated: boolean, newStreak: number }> {
    const db = await getDatabase();
    const stats = await this.getStats();
    
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    // If already checked in today, do nothing
    if (stats.lastActivityDate === today) {
      return { streakUpdated: false, newStreak: stats.currentStreak };
    }

    let newStreak = stats.currentStreak;
    let newLongest = stats.longestStreak;

    if (!stats.lastActivityDate) {
      // First time ever
      newStreak = 1;
    } else {
      const lastDate = new Date(stats.lastActivityDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays === 1) {
        // Consecutive day
        newStreak = stats.currentStreak + 1;
      } else {
        // Streak broken (missed a day or more)
        newStreak = 1; 
      }
    }

    if (newStreak > newLongest) {
      newLongest = newStreak;
    }

    // Update database
    await db.runAsync(
      'UPDATE gamification_stats SET currentStreak = ?, longestStreak = ?, lastActivityDate = ? WHERE id = ?',
      [newStreak, newLongest, today, 'me']
    );

    return { streakUpdated: true, newStreak };
  }
};

import { getDatabase } from '../../db/database';

export interface Wish {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  deadline: string;
  status: string;
  progress: number;
  xpEarned: number;
  commitment: string | null;
  createdAt: number;
  completedAt: number | null;
}

export const WishRepository = {
  async getAll(statusFilter?: string): Promise<Wish[]> {
    try {
      const db = await getDatabase();
      let query = 'SELECT * FROM wishes';
      let params: any[] = [];
      
      if (statusFilter && statusFilter !== 'all') {
        query += ' WHERE status = ?';
        params.push(statusFilter);
      }
      
      query += ' ORDER BY CASE WHEN status = "active" THEN 0 ELSE 1 END, deadline ASC';
      
      const result = await db.getAllAsync(query, params);
      return result as Wish[];
    } catch (error) {
      console.error('Error fetching wishes:', error);
      return [];
    }
  },

  async create(wish: Omit<Wish, 'id' | 'createdAt' | 'completedAt' | 'xpEarned'>): Promise<Wish> {
    try {
      const db = await getDatabase();
      const id = 'wish-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
      const createdAt = Date.now();

      await db.runAsync(
        `INSERT INTO wishes (id, title, description, category, priority, deadline, status, progress, xpEarned, commitment, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, wish.title, wish.description, wish.category, wish.priority, wish.deadline, wish.status, wish.progress, 0, wish.commitment, createdAt]
      );

      return { ...wish, id, createdAt, completedAt: null, xpEarned: 0 } as Wish;
    } catch (error) {
      console.error('Error creating wish:', error);
      throw error;
    }
  },

  async updateProgress(id: string, progress: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE wishes SET progress = ? WHERE id = ?', [progress, id]);
  },

  async complete(id: string): Promise<Wish | null> {
    const db = await getDatabase();
    const wish = (await db.getFirstAsync('SELECT * FROM wishes WHERE id = ?', [id])) as Wish | undefined;
    if (!wish) return null;

    const completedAt = Date.now();
    const isOnTime = new Date(wish.deadline).getTime() > completedAt;
    const xpEarned = wish.priority === 'high' ? 150 : wish.priority === 'medium' ? 100 : 50;
    const finalXp = isOnTime ? xpEarned + 50 : xpEarned;

    await db.runAsync(
      'UPDATE wishes SET status = ?, progress = ?, xpEarned = ?, completedAt = ? WHERE id = ?',
      ['completed', 100, finalXp, completedAt, id]
    );

    return { ...wish, status: 'completed', progress: 100, xpEarned: finalXp, completedAt } as Wish;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM wishes WHERE id = ?', [id]);
  }
};

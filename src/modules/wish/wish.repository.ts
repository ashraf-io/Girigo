import { getDatabase } from '../../db/database';
import * as Crypto from 'expo-crypto';

export interface Wish {
  id: string;
  userId: string;
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
  async checkAndExpireWishes(userId: string): Promise<void> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      const result = await db.runAsync(
        "UPDATE wishes SET status = 'expired' WHERE status = 'active' AND deadline < ? AND userId = ?",
        [now, userId]
      );
      if (result.changes > 0) console.log(`🔄 Auto-expired ${result.changes} wish(es)`);
    } catch (error) { console.error('Error checking expired wishes:', error); }
  },

  async getAll(userId: string, statusFilter?: string): Promise<Wish[]> {
    try {
      await this.checkAndExpireWishes(userId);
      const db = await getDatabase();
      let query = 'SELECT * FROM wishes WHERE userId = ?';
      let params: any[] = [userId];
      
      if (statusFilter && statusFilter !== 'all') {
        query += ' AND status = ?';
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

  async getById(userId: string, id: string): Promise<Wish | null> {
    try {
      const db = await getDatabase();
      const wish = await db.getFirstAsync('SELECT * FROM wishes WHERE id = ? AND userId = ?', [id, userId]);
      return wish as Wish | null;
    } catch (error) {
      console.error('Error fetching wish by ID:', error);
      return null;
    }
  },

  async create(userId: string, wish: Omit<Wish, 'id' | 'userId' | 'createdAt' | 'completedAt' | 'xpEarned'>): Promise<Wish> {
    try {
      const db = await getDatabase();
      const id = Crypto.randomUUID();
      const createdAt = Date.now();

      await db.runAsync(
        `INSERT INTO wishes (id, userId, title, description, category, priority, deadline, status, progress, xpEarned, commitment, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, wish.title, wish.description, wish.category, wish.priority, wish.deadline, wish.status, wish.progress, 0, wish.commitment, createdAt]
      );

      return { ...wish, id, userId, createdAt, completedAt: null, xpEarned: 0 } as Wish;
    } catch (error) {
      console.error('Error creating wish:', error);
      throw error;
    }
  },

  async updateProgress(userId: string, id: string, progress: number): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync('UPDATE wishes SET progress = ? WHERE id = ? AND userId = ?', [progress, id, userId]);
    } catch (error) { console.error('Error updating progress:', error); }
  },

  async updateStatus(userId: string, id: string, status: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync('UPDATE wishes SET status = ? WHERE id = ? AND userId = ?', [status, id, userId]);
    } catch (error) { console.error('Error updating status:', error); }
  },

  async delete(userId: string, id: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM wishes WHERE id = ? AND userId = ?', [id, userId]);
    } catch (error) { console.error('Error deleting wish:', error); }
  }
};
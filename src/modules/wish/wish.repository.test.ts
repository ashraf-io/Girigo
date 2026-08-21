import { WishRepository } from './wish.repository';
import { getDatabase } from '../../db/database';

// Mock the database module
jest.mock('../../db/database', () => ({
  getDatabase: jest.fn(),
}));

describe('WishRepository', () => {
  const mockDb = {
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('create', () => {
    it('should execute INSERT query and return wish with generated ID', async () => {
      const newWish = {
        title: 'Test Wish',
        description: 'Test Desc',
        category: 'academic',
        priority: 'medium',
        deadline: '2026-12-31T23:59:59.000Z',
        status: 'active',
        progress: 0,
        commitment: null,
      };

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });

      const result = await WishRepository.create(newWish);

      expect(getDatabase).toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Wish');
      expect(result.xpEarned).toBe(0);
    });
  });

  describe('checkAndExpireWishes', () => {
    it('should execute UPDATE query for expired wishes', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 2 });

      await WishRepository.checkAndExpireWishes();

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE wishes SET status = 'expired'"),
        expect.any(Array)
      );
    });
  });

  describe('getAll', () => {
    it('should trigger expire check when fetching active wishes', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      await WishRepository.getAll('active');
      
      expect(mockDb.runAsync).toHaveBeenCalled(); // Proves expire check ran
      expect(mockDb.getAllAsync).toHaveBeenCalled();
    });

    it('should skip expire check when fetching completed wishes', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      
      await WishRepository.getAll('completed');
      
      expect(mockDb.runAsync).not.toHaveBeenCalled(); // Proves expire check skipped
    });
  });
});

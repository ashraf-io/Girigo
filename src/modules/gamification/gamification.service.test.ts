// import { GamificationService } from './gamification.service';

// describe('GamificationService', () => {
//   describe('calculateLevel', () => {
//     it('should return level 1 for 0 XP', () => {
//       expect(GamificationService.calculateLevel(0)).toBe(1);
//     });

//     it('should return level 2 for 500 XP', () => {
//       // Level 2 requires: 500 * 2 * 3 / 2 = 1500 XP
//       // Level 1 requires: 500 * 1 * 2 / 2 = 500 XP
//       expect(GamificationService.calculateLevel(500)).toBe(2);
//       expect(GamificationService.calculateLevel(1499)).toBe(2);
//     });

//     it('should return level 3 for 1500 XP', () => {
//       // Level 3 requires: 500 * 3 * 4 / 2 = 3000 XP
//       expect(GamificationService.calculateLevel(1500)).toBe(3);
//       expect(GamificationService.calculateLevel(2999)).toBe(3);
//     });

//     it('should handle large XP values correctly', () => {
//       expect(GamificationService.calculateLevel(10000)).toBeGreaterThan(5);
//     });
//   });

//   describe('calculateXpEarned', () => {
//     // 48 hours in future = Early completion (>24h), gets 25% bonus
//     const futureDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); 
//     // 12 hours in future = On time (<24h), NO bonus
//     const nearDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); 

//     it('should award 50 XP for Low priority (on time, no bonus)', () => {
//       expect(GamificationService.calculateXpEarned('low', nearDeadline)).toBe(50);
//     });

//     it('should award 100 XP for Medium priority (on time, no bonus)', () => {
//       expect(GamificationService.calculateXpEarned('medium', nearDeadline)).toBe(100);
//     });

//     it('should award 150 XP for High priority (on time, no bonus)', () => {
//       expect(GamificationService.calculateXpEarned('high', nearDeadline)).toBe(150);
//     });

//     it('should award 25% bonus for early completion (>24h before deadline)', () => {
//       expect(GamificationService.calculateXpEarned('low', futureDeadline)).toBe(63); // 50 * 1.25 = 62.5 -> 63
//       expect(GamificationService.calculateXpEarned('medium', futureDeadline)).toBe(125); // 100 * 1.25 = 125
//       expect(GamificationService.calculateXpEarned('high', futureDeadline)).toBe(188); // 150 * 1.25 = 187.5 -> 188
//     });
//   });

//   describe('Streak Logic (Conceptual)', () => {
//     it('should increment streak on consecutive days', () => {
//       expect(true).toBe(true); // Placeholder for DB-mocked test
//     });

//     it('should reset streak if day is missed', () => {
//       expect(true).toBe(true); // Placeholder for DB-mocked test
//     });

//     it('should not update if already checked in today', () => {
//       expect(true).toBe(true); // Placeholder for DB-mocked test
//     });
//   });
// });

# 🦊 Girigo: Full Project Context & Handoff Document

## 1. Executive Summary
**Girigo** is an atmospheric, gamified productivity and wish-tracking application. It is designed with a strict **Offline-First** philosophy for V1, ensuring 100% functionality without an internet connection. V2 will evolve this into a **Hybrid/Cloud-Connected** architecture. The project is being developed under academic Software Engineering (DSES) guidelines, emphasizing Test-Driven Development (TDD), Repository Pattern, and strict adherence to Functional Requirements (FR).

> ⚠️ **Current Status**: V1 core features are implemented but require UI/UX polishing, bug fixes, and performance optimizations before final demo readiness.

---

## 2. Tech Stack & Environment
- **Framework**: React Native with Expo SDK 54 (Expo Router v3)
- **Language**: TypeScript (Strict mode)
- **Local Database**: `expo-sqlite` (WAL mode enabled, indexed queries for <2s response)
- **State Management**: Zustand (`useOnboardingStore`, `useAppStore`)
- **Testing**: Jest + `jest-expo` (TDD applied to core gamification logic)
- **Styling**: Custom `StyleSheet` with a defined atmospheric theme (Deep Black, Crimson, Mystic Purple, Ethereal Cyan) + Inter & JetBrains Mono fonts.
- **Development Environment**: **Termux on Android** (Critical: Requires specific file-watcher workarounds, see Section 6).

---

## 3. V1 Scope: Offline-First (🔧 IN PROGRESS - Needs UI/UX Polish & Bug Fixes)

### Core Features Implemented (Require Refinement):
1. **Onboarding Flow**: 
   - ✅ 3-step carousel → Profile creation (with `expo-crypto` UUIDs) → Notification permission gating.
   - 🔧 **Needs**: Smoother transitions, better loading states, validation feedback.

2. **Wish Management (CRUD)**:
   - ✅ Create wishes with Title, Description, Category (5 presets + **Custom**), Priority (Low/Med/High), and Deadline.
   - ✅ High-priority wishes enforce a "Commitment Statement".
   - ✅ **Edit Mode**: Users can update title, description, and deadline of active wishes.
   - ✅ **Auto-Expire (FR-2.7)**: `WishRepository.getAll()` silently runs `checkAndExpireWishes()` to mark overdue active wishes as `expired`.
   - ✅ **Flexible Deadline Extension**: Expired wishes trigger a modal offering quick presets (+2h, +6h, +1d, +3d) or a custom datetime picker.
   - 🔧 **Needs**: 
     - Reduce lag in wish list rendering
     - Improve modal animations
     - Better error handling for edge cases
     - Optimize re-renders in Dashboard

3. **Gamification Engine**:
   - ✅ XP calculation with early-completion bonuses (+25% if >24h before deadline).
   - ✅ Level progression formula: `Level N requires 500 * N * (N+1) / 2 XP`.
   - ✅ Daily streak tracking (resets if a day is missed).
   - ✅ **TDD**: `src/modules/gamification/gamification.service.test.ts` (11/11 tests passing).
   - 🔧 **Needs**: 
     - Visual "Level Up" confetti animation
     - Smoother XP progress bar updates
     - Better feedback on streak changes

4. **UI/UX**:
   - ✅ Dashboard with real-time Streak, Level, Active count, and XP Progress Bar (with shimmer effect).
   - ✅ `TimeRing` component: SVG countdown ring that shifts color (Ethereal → Mystic → Crimson) based on urgency.
   - ✅ History tab with filtering (All, Completed, Abandoned, Expired).
   - ✅ Profile tab with real-time stats fetching and local logout.
   - 🔧 **Needs**:
     - Reduce laggy feelings in navigation
     - Improve touch feedback on buttons
     - Better loading skeletons
     - Consistent spacing and typography
     - Smooth out animations (avoid jank)
     - Fix double-triggering alerts (partially fixed, needs verification)

5. **Local Notifications (FR-4.1 - 4.5)**:
   - ✅ Schedules 24h and 1h deadline reminders.
   - ✅ Schedules daily 8 PM streak reminders.
   - ✅ *Graceful Degradation*: Wrapped in `try/catch` with dynamic `import()` to prevent crashing in Expo Go (SDK 53+ remote notification limitations), showing a user-friendly alert instead.
   - 🔧 **Needs**: Better user messaging when notifications fail, test reliability across devices.

---

## 4. Known Issues & Areas for Improvement

### Performance Issues:
- [ ] **Dashboard Lag**: Wish list re-renders cause noticeable stutter on mid-range devices
- [ ] **Modal Animation Jank**: Expired wish extension modal feels sluggish
- [ ] **Navigation Delay**: Tab switching has slight delay due to heavy DB queries on render
- [ ] **Memory Leaks**: Potential issues with setInterval in TimeRing components not being cleaned up properly

### UI/UX Issues:
- [ ] **Inconsistent Spacing**: Some screens have uneven padding/margins
- [ ] **Touch Feedback Missing**: Buttons don't always provide visual feedback on press
- [ ] **Loading States**: Missing skeleton loaders in some areas
- [ ] **Alert Double-Triggering**: Still occurs occasionally in edge cases
- [ ] **Color Contrast**: Some text may not meet accessibility standards
- [ ] **Font Loading**: Inter and JetBrains Mono may flash on first load

### Bug Fixes Needed:
- [ ] **Race Conditions**: Database initialization may still have edge case race conditions
- [ ] **Streak Calculation Edge Cases**: Timezone handling may cause incorrect streak resets
- [ ] **XP Display Lag**: XP bar doesn't always update immediately after wish completion
- [ ] **Notification Permission State**: Not always persisted correctly after denial

---

## 5. V2 Scope: Hybrid / Cloud-Connected (🔮 PLANNED - Post-V1 Polish)
V2 will transition from local-only to a synced, social experience.

1. **Backend Migration**:
   - Replace/augment `expo-sqlite` with **Supabase (PostgreSQL)**.
   - Implement **JWT Authentication** and Role-Based Access Control (RBAC).
   - Add `userId` foreign keys to all tables (currently hardcoded to `'me'`).
2. **Buddy System & Accountability**:
   - Pair with accountability partners.
   - Share specific wishes or streaks with buddies.
   - Buddy push notifications for encouragement.
3. **Advanced Features**:
   - **Remote Push Notifications**: Fully functional via Supabase + Expo Push Tokens (requires Development Build).
   - **Global/Local Leaderboards**: Based on XP and longest streaks.
   - **Rich Analytics**: Cloud-synced weekly completion charts and category distribution.
   - **True Data Export/Import**: JSON backup to device filesystem (`expo-file-system`).

---

## 6. Key Architectural Decisions
- **Repository Pattern**: `WishRepository` and `GamificationService` abstract database logic. This makes the eventual V2 migration to Supabase a matter of swapping the repository implementation, not rewriting UI components.
- **UUID Generation**: Uses `expo-crypto.randomUUID()` instead of `Date.now() + Math.random()` to ensure scalable, collision-resistant IDs (matching presentation claims).
- **State Separation**: UI state (loading, editing flags) is kept in React `useState`, while persistent app state (onboarding completion) uses `expo-secure-store` + Zustand.
- **Offline-First Design**: All critical paths work without network; cloud sync will be additive in V2.

---

## 7. ⚠️ CRITICAL: Termux & Expo Go Troubleshooting
*The next developer/AI MUST know these environment-specific constraints.*

### A. The Termux `ENOSPC` File Watcher Limit
Termux has a hard kernel limit of 8,192 `inotify` watchers. Metro will crash trying to watch `node_modules`.
**The Permanent Fix (Already Applied):**
1. `metro.config.js` contains a `resolver.blockList` regex to ignore heavy folders (`android`, `ios`, `tests`, `types_generated`).
2. If `ENOSPC` persists after `npm install`, run this cleanup script:
   ```bash
   rm -rf node_modules/react-native/types_generated node_modules/react-native/ReactAndroid node_modules/react-native/ReactCommon
   rm -rf node_modules/expo-modules-core/android node_modules/expo-modules-core/ios
   rm -rf node_modules/expo-notifications/android node_modules/expo-notifications/ios
   # (Add any newly installed expo package's android/ios folders to this list)
   ```

### B. Expo Go Notification Limitations
Expo SDK 53+ removed *remote* push notification support from Expo Go. 
**The Workaround (Already Applied):**
`src/services/notification.service.ts` uses dynamic `import('expo-notifications')` inside a `try/catch`. If it fails (Expo Go), it gracefully degrades and shows an Alert explaining that the feature requires a V2 Development Build, preventing a hard app crash.

### C. React Navigation Alert Double-Triggering
Using `setTimeout` to show alerts on render caused stacked, laggy popups.
**The Fix (Already Applied):**
Implemented a `useRef<boolean>` (`isShowingAlert`) and a `hasShownExpiredAlert` state flag to guarantee the expired wish modal only triggers exactly once per screen mount.
**⚠️ Verification Needed**: This fix should be tested across all modal scenarios to ensure no regressions.

---

## 8. Current Repository State
- **Branch**: `main`
- **Working Tree**: ✅ Clean (All Tier 1 fixes committed and pushed).
- **Remote**: `git@prof:ashraf-io/Girigo-.git`
- **Test Status**: `npm test` passes 11/11 (Gamification logic).
- **Next Focus**: UI/UX polish, performance optimization, bug fixes for demo readiness.

---

## 9. Instructions for the Next AI / Developer

### Immediate Priorities (Before Demo):
1. **Performance Audit**: 
   - Profile app with React DevTools to identify re-render bottlenecks
   - Optimize `WishCard` and `Dashboard` components with `React.memo` where appropriate
   - Ensure all `setInterval` and subscriptions have proper cleanup in `useEffect`

2. **UI/UX Polish**:
   - Add consistent touch feedback (scale/opacity) to all interactive elements
   - Implement skeleton loaders for async data fetching
   - Smooth out modal animations using `react-native-reanimated` if needed
   - Verify and fix any remaining alert double-triggering issues
   - Improve spacing consistency across all screens

3. **Bug Fixes**:
   - Test streak calculation across timezone boundaries
   - Verify XP updates immediately reflect in UI after wish completion
   - Ensure notification permission state persists correctly
   - Test database initialization race conditions on cold start

4. **Accessibility & Quality**:
   - Check color contrast ratios meet WCAG standards
   - Add proper ARIA labels where applicable
   - Test on multiple device sizes and Android versions

### How to Run:
```bash
npm install
npx expo start -c
# Remember the Termux `rm -rf` fix if Metro crashes on startup
```

### How to Test:
```bash
npm test  # Verifies TDD coverage (11/11 tests should pass)
```

### Recommended Workflow:
1. Create feature branch from `main`
2. Make small, focused changes
3. Test on actual device (Expo Go) frequently
4. Commit often with clear messages
5. Run full test suite before merging

### Next Recommended Tasks (Priority Order):
- [ ] **HIGH**: Profile and fix dashboard rendering lag
- [ ] **HIGH**: Add touch feedback to all buttons and cards
- [ ] **HIGH**: Implement skeleton loaders for async states
- [ ] **MEDIUM**: Add confetti animation for level-ups
- [ ] **MEDIUM**: Fix any remaining alert double-triggering
- [ ] **LOW**: Implement `expo-file-system` JSON export in Profile
- [ ] **LOW**: Begin scaffolding Supabase client for V2

---

## 10. Project Philosophy
- **User Experience First**: Even small delays matter. Optimize for perceived performance.
- **Graceful Degradation**: Features should fail silently with helpful messages, not crash.
- **Code Quality**: Maintain TDD practices, keep components small and focused.
- **Documentation**: Keep this document updated as the project evolves.

---

*Last Updated: $(date)*
*Maintained by: Girigo Development Team*

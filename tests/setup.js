// Mock expo-sqlite for unit tests
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Mock expo-crypto to return a unique string on every call
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `mocked-uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
}));

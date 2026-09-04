import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDqLwUlv5nI4BH0CmX9CRwt6ideBwM0eUY",
  authDomain: "girigo-ce3ee.firebaseapp.com",
  projectId: "girigo-ce3ee",
  storageBucket: "girigo-ce3ee.firebasestorage.app",
  messagingSenderId: "322586582676",
  appId: "1:322586582676:web:2d6592ae41de297c8e9e81",
  measurementId: "G-239BDYX4M5"
};

// Initialize Firebase (Firestore only, to avoid Web Analytics crashes in React Native)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log('✅ Firebase Firestore initialized successfully');

// Firestore Service (This is what your Telegram bot reads!)
export const FirebaseStore = {
  async logWishCreated(userId: string, wishData: any) {
    try {
      await addDoc(collection(db, 'wishes'), {
        userId,
        title: wishData.title,
        category: wishData.category,
        priority: wishData.priority,
        deadline: wishData.deadline,
        createdAt: serverTimestamp(),
      });
      console.log('✅ Wish logged to Firestore');
    } catch (error) {
      console.error('❌ Failed to log wish:', error);
    }
  },

  async logWishCompleted(userId: string, wishId: string, xpEarned: number) {
    try {
      await addDoc(collection(db, 'completions'), {
        userId,
        wishId,
        xpEarned,
        completedAt: serverTimestamp(),
      });
      console.log('✅ Completion logged to Firestore');
    } catch (error) {
      console.error('❌ Failed to log completion:', error);
    }
  },

  async logError(userId: string, error: any, context: string) {
    try {
      await addDoc(collection(db, 'errors'), {
        userId,
        errorMessage: error.message,
        errorStack: error.stack,
        context,
        timestamp: serverTimestamp(),
      });
      console.log('✅ Error logged to Firestore');
    } catch (error) {
      console.error('❌ Failed to log error:', error);
    }
  }
};
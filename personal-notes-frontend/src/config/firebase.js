import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

/**
 * Sign in with Google
 * @returns {Promise<UserCredential>}
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign in with Facebook
 * @returns {Promise<UserCredential>}
 */
export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return result;
  } catch (error) {
    console.error('Error signing in with Facebook:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

/**
 * Create account with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const createAccount = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

/**
 * Sign out
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get current user's ID token
 * @returns {Promise<string|null>}
 */
export const getCurrentUserToken = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
  return null;
};

/**
 * Get current user
 * @returns {User|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };

const admin = require('firebase-admin');

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = async () => {
  try {
    if (firebaseApp) {
      console.log('Firebase already initialized');
      return firebaseApp;
    }

    // Parse service account from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');

    if (!serviceAccount.project_id) {
      throw new Error('Invalid Firebase service account configuration');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    throw error;
  }
};

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token
 */
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error.message);
    throw new Error('Token de autenticação inválido');
  }
};

/**
 * Get user by UID
 * @param {string} uid - Firebase user UID
 * @returns {Promise<admin.auth.UserRecord>} User record
 */
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user:', error.message);
    throw new Error('Usuário não encontrado');
  }
};

/**
 * Delete user from Firebase
 * @param {string} uid - Firebase user UID
 */
const deleteUser = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
    console.log(`User ${uid} deleted from Firebase`);
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw new Error('Erro ao deletar usuário do Firebase');
  }
};

module.exports = {
  initializeFirebase,
  verifyIdToken,
  getUserByUid,
  deleteUser,
  admin
};

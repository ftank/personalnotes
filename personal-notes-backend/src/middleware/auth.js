const { verifyIdToken } = require('../config/firebase');
const { query } = require('../config/database');

/**
 * Middleware to authenticate user using Firebase token
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticação não fornecido'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token with Firebase
    const decodedToken = await verifyIdToken(token);

    // Get or create user in database
    const userResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create new user
      const newUserResult = await query(
        `INSERT INTO users (firebase_uid, email_encrypted, encryption_key_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [decodedToken.uid, decodedToken.email || '', '']
      );
      user = newUserResult.rows[0];
    } else {
      user = userResult.rows[0];

      // Update last login
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      firebase_uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      error: 'Token de autenticação inválido ou expirado'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);

    const userResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (userResult.rows.length > 0) {
      req.user = {
        id: userResult.rows[0].id,
        firebase_uid: decodedToken.uid,
        email: decodedToken.email
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth
};

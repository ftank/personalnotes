const express = require('express');
const router = express.Router();
const { verifyIdToken } = require('../config/firebase');
const { query } = require('../config/database');
const { generateSalt } = require('../utils/encryption');

/**
 * POST /api/auth/verify
 * Verify Firebase token and create/update user
 */
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);

    // Check if user exists
    let userResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create new user
      const salt = generateSalt();

      const newUserResult = await query(
        `INSERT INTO users (firebase_uid, email_encrypted, encryption_salt, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, firebase_uid, created_at, risk_level`,
        [decodedToken.uid, decodedToken.email || '', salt]
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

    res.json({
      success: true,
      user: {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: decodedToken.email,
        created_at: user.created_at,
        risk_level: user.risk_level
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Falha na autenticação' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side mainly, but log for analytics)
 */
router.post('/logout', async (req, res) => {
  try {
    // Just acknowledge logout
    // Actual token invalidation happens on Firebase client
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

module.exports = router;

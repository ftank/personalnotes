const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { deleteUser } = require('../config/firebase');
const { deleteCachePattern } = require('../config/redis');

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT id, firebase_uid, created_at, last_login, risk_level, theme_preference FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

/**
 * PATCH /api/user/theme
 * Update user theme preference
 */
router.patch('/theme', async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

    // Validate theme
    if (!theme || !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ error: 'Tema inválido. Use: light, dark ou system' });
    }

    await query(
      'UPDATE users SET theme_preference = $1 WHERE id = $2',
      [theme, userId]
    );

    res.json({ success: true, theme });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Erro ao atualizar tema' });
  }
});

/**
 * DELETE /api/user/delete-account
 * Delete user account (LGPD compliance)
 */
router.delete('/delete-account', async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const userId = req.user.id;
    const firebaseUid = req.user.firebase_uid;

    // Log deletion for audit
    await client.query(
      `INSERT INTO security_logs (user_id, event_type, ip_address, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, 'account_deleted', req.ip]
    );

    // Delete all user data (cascades automatically)
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    // Delete from Firebase
    await deleteUser(firebaseUid);

    // Clear Redis cache
    await deleteCachePattern(`user:${userId}:*`);
    await deleteCachePattern(`context:${userId}`);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Conta e todos os dados foram permanentemente deletados'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/user/export-data
 * Export all user data (LGPD compliance)
 */
router.get('/export-data', async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all user data
    const userData = await query('SELECT * FROM users WHERE id = $1', [userId]);

    const conversations = await query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const goals = await query(
      'SELECT * FROM user_goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const checkins = await query(
      'SELECT * FROM progress_checkins WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Note: Messages are encrypted and would need decryption
    // For now, return metadata only
    const messageCount = await query(
      `SELECT COUNT(*) as count FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.user_id = $1`,
      [userId]
    );

    res.json({
      exportDate: new Date().toISOString(),
      user: userData.rows[0],
      conversations: conversations.rows,
      goals: goals.rows,
      checkins: checkins.rows,
      messageCount: messageCount.rows[0].count,
      note: 'Mensagens estão criptografadas e requerem sua chave para exportação completa'
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

/**
 * POST /api/user/consent
 * Record user consent (LGPD compliance)
 */
router.post('/consent', async (req, res) => {
  try {
    const { consentType, accepted } = req.body;
    const userId = req.user.id;

    if (!consentType || accepted === undefined) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    await query(
      `INSERT INTO user_consents (user_id, consent_type, accepted, accepted_at, ip_address)
       VALUES ($1, $2, $3, NOW(), $4)`,
      [userId, consentType, accepted, req.ip]
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Error recording consent:', error);
    res.status(500).json({ error: 'Erro ao registrar consentimento' });
  }
});

module.exports = router;

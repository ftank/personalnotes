const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { EncryptionManager, generateSalt } = require('../utils/encryption');

/**
 * GET /api/goals
 * Get all goals for user (decrypted)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // Filter by status if provided

    let queryText = `
      SELECT id, goal_encrypted, goal_iv, goal_auth_tag,
             description_encrypted, description_iv, description_auth_tag,
             status, progress, created_at, completed_at
      FROM user_goals
      WHERE user_id = $1
    `;

    const params = [userId];

    if (status) {
      queryText += ' AND status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    // Get user's encryption salt
    const userResult = await query(
      'SELECT encryption_salt FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userSalt = userResult.rows[0].encryption_salt;

    if (!userSalt) {
      // No encryption salt, return empty array
      return res.json([]);
    }

    // Decrypt goals
    const encryptionManager = new EncryptionManager(req.user.firebase_uid, userSalt);
    encryptionManager.initMasterKey();

    const decryptedGoals = result.rows.map(goal => {
      try {
        const decryptedTitle = encryptionManager.decryptData({
          encrypted: goal.goal_encrypted,
          iv: goal.goal_iv,
          authTag: goal.goal_auth_tag
        });

        let decryptedDescription = null;
        if (goal.description_encrypted && goal.description_iv && goal.description_auth_tag) {
          decryptedDescription = encryptionManager.decryptData({
            encrypted: goal.description_encrypted,
            iv: goal.description_iv,
            authTag: goal.description_auth_tag
          });
        }

        return {
          id: goal.id,
          title: decryptedTitle,
          description: decryptedDescription,
          status: goal.status,
          progress: goal.progress,
          created_at: goal.created_at,
          completed_at: goal.completed_at
        };
      } catch (err) {
        console.error('Error decrypting goal:', err);
        return {
          id: goal.id,
          title: '[Erro ao descriptografar]',
          description: null,
          status: goal.status,
          progress: goal.progress,
          created_at: goal.created_at,
          completed_at: goal.completed_at
        };
      }
    });

    res.json(decryptedGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
});

/**
 * GET /api/goals/:id
 * Get specific goal
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;

    const result = await query(
      `SELECT * FROM user_goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Erro ao buscar meta' });
  }
});

/**
 * POST /api/goals
 * Create new goal (encrypted)
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Support both formats:
    // 1. { goal: "string", description: "string" } - old format
    // 2. { goal: { title, description, target_date } } - new format
    let goalTitle, goalDescription, targetDate;

    if (typeof req.body.goal === 'string') {
      // Old format
      goalTitle = req.body.goal;
      goalDescription = req.body.description;
    } else if (typeof req.body.goal === 'object' && req.body.goal !== null) {
      // New format
      goalTitle = req.body.goal.title;
      goalDescription = req.body.goal.description;
      targetDate = req.body.goal.target_date;
    } else {
      return res.status(400).json({ error: 'Formato de meta inválido' });
    }

    console.log('[Goals] Creating goal for user:', userId);
    console.log('[Goals] Goal data:', { goalTitle, goalDescription, targetDate });

    if (!goalTitle) {
      return res.status(400).json({ error: 'Título da meta é obrigatório' });
    }

    // Get user's encryption salt
    const userResult = await query(
      'SELECT encryption_salt FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.error('[Goals] User not found:', userId);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    let userSalt = userResult.rows[0].encryption_salt;
    console.log('[Goals] User salt exists:', !!userSalt);

    // If no salt exists, create one
    if (!userSalt) {
      userSalt = generateSalt();
      await query(
        'UPDATE users SET encryption_salt = $1 WHERE id = $2',
        [userSalt, userId]
      );
      console.log('[Goals] Generated new salt for user');
    }

    // Encrypt goal
    console.log('[Goals] Initializing encryption...');
    const encryptionManager = new EncryptionManager(req.user.firebase_uid, userSalt);
    encryptionManager.initMasterKey();
    console.log('[Goals] Encryption initialized');

    const encryptedGoal = encryptionManager.encryptData(goalTitle);
    console.log('[Goals] Goal encrypted');

    const encryptedDesc = goalDescription
      ? encryptionManager.encryptData(goalDescription)
      : null;
    console.log('[Goals] Description encrypted');

    console.log('[Goals] Inserting into database...');
    const result = await query(
      `INSERT INTO user_goals (
        user_id, goal_encrypted, goal_iv, goal_auth_tag,
        description_encrypted, description_iv, description_auth_tag,
        status, progress, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, status, progress, created_at`,
      [
        userId,
        encryptedGoal.encrypted,
        encryptedGoal.iv,
        encryptedGoal.authTag,
        encryptedDesc?.encrypted,
        encryptedDesc?.iv,
        encryptedDesc?.authTag,
        'active',
        0
      ]
    );

    console.log('[Goals] Goal created successfully:', result.rows[0].id);

    res.status(201).json({
      ...result.rows[0],
      title: goalTitle, // Return unencrypted for client
      description: goalDescription,
      target_date: targetDate
    });
  } catch (error) {
    console.error('[Goals] Error creating goal:', error);
    console.error('[Goals] Error stack:', error.stack);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
});

/**
 * PUT /api/goals/:id
 * Update goal
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { status, progress } = req.body;

    // Verify goal belongs to user
    const goalResult = await query(
      'SELECT * FROM user_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      // If completed, set completed_at
      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (progress !== undefined) {
      updates.push(`progress = $${paramIndex}`);
      params.push(progress);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhuma atualização fornecida' });
    }

    params.push(goalId);
    params.push(userId);

    const result = await query(
      `UPDATE user_goals
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING id, status, progress, completed_at`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

/**
 * DELETE /api/goals/:id
 * Delete goal
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;

    // Verify goal belongs to user
    const goalResult = await query(
      'SELECT * FROM user_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    await query('DELETE FROM user_goals WHERE id = $1', [goalId]);

    res.json({ success: true, message: 'Meta deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

/**
 * POST /api/goals/:id/checkin
 * Create progress check-in for goal
 */
router.post('/:id/checkin', async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { notes, moodScore } = req.body;

    // Verify goal belongs to user
    const goalResult = await query(
      'SELECT * FROM user_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    // Encrypt notes if provided
    let encryptedNotes = null;
    if (notes) {
      const userResult = await query(
        'SELECT encryption_salt FROM users WHERE id = $1',
        [userId]
      );

      const userSalt = userResult.rows[0].encryption_salt;
      const encryptionManager = new EncryptionManager(req.user.firebase_uid, userSalt);
      encryptionManager.initMasterKey();

      encryptedNotes = encryptionManager.encryptData(notes);
    }

    const result = await query(
      `INSERT INTO progress_checkins (
        user_id, goal_id, notes_encrypted, notes_iv, notes_auth_tag,
        mood_score, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, mood_score, created_at`,
      [
        userId,
        goalId,
        encryptedNotes?.encrypted,
        encryptedNotes?.iv,
        encryptedNotes?.authTag,
        moodScore
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      notes // Return unencrypted for client
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    res.status(500).json({ error: 'Erro ao criar check-in' });
  }
});

/**
 * GET /api/goals/:id/checkins
 * Get all check-ins for a goal
 */
router.get('/:id/checkins', async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;

    // Verify goal belongs to user
    const goalResult = await query(
      'SELECT * FROM user_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const result = await query(
      `SELECT id, notes_encrypted, notes_iv, notes_auth_tag,
              mood_score, created_at
       FROM progress_checkins
       WHERE goal_id = $1
       ORDER BY created_at DESC`,
      [goalId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Erro ao buscar check-ins' });
  }
});

module.exports = router;

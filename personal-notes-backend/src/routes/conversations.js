const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/conversations
 * Get all conversations for user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, title, created_at, updated_at
       FROM conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

/**
 * GET /api/conversations/:id
 * Get specific conversation
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Verify conversation belongs to user
    const convResult = await query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json(convResult.rows[0]);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
});

/**
 * POST /api/conversations
 * Create new conversation
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const result = await query(
      `INSERT INTO conversations (user_id, title, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [userId, title || 'Nova conversa']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
});

/**
 * PUT /api/conversations/:id
 * Update conversation (e.g., change title)
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { title } = req.body;

    // Verify conversation belongs to user
    const convResult = await query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    const result = await query(
      `UPDATE conversations
       SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [title, conversationId, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa' });
  }
});

/**
 * DELETE /api/conversations/:id
 * Delete conversation and all its messages
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Verify conversation belongs to user
    const convResult = await query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Delete conversation (messages cascade automatically)
    await query('DELETE FROM conversations WHERE id = $1', [conversationId]);

    res.json({ success: true, message: 'Conversa deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Erro ao deletar conversa' });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Get all messages in a conversation
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // Verify conversation belongs to user
    const convResult = await query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    const messages = await query(
      `SELECT id, content_encrypted, iv, auth_tag, role, timestamp
       FROM messages
       WHERE conversation_id = $1
       ORDER BY timestamp ASC`,
      [conversationId]
    );

    res.json(messages.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

module.exports = router;

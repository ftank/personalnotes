const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/resources
 * Get emergency resources
 */
router.get('/', async (req, res) => {
  try {
    const { type, city, state } = req.query;

    let queryText = `
      SELECT id, resource_type, name, description, address,
             city, state, country, phone, email, website,
             available_24_7, verified
      FROM local_resources
      WHERE verified = true
    `;

    const params = [];
    let paramIndex = 1;

    if (type) {
      queryText += ` AND resource_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (city) {
      queryText += ` AND LOWER(city) = LOWER($${paramIndex})`;
      params.push(city);
      paramIndex++;
    }

    if (state) {
      queryText += ` AND LOWER(state) = LOWER($${paramIndex})`;
      params.push(state);
      paramIndex++;
    }

    queryText += ' ORDER BY available_24_7 DESC, name ASC';

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Erro ao buscar recursos' });
  }
});

/**
 * GET /api/resources/emergency
 * Get emergency contacts (190, 180, 188, etc)
 */
router.get('/emergency', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, phone, available_24_7
       FROM local_resources
       WHERE resource_type = 'emergency'
       AND verified = true
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching emergency resources:', error);
    res.status(500).json({ error: 'Erro ao buscar recursos de emergência' });
  }
});

/**
 * GET /api/resources/:id
 * Get specific resource details
 */
router.get('/:id', async (req, res) => {
  try {
    const resourceId = req.params.id;

    const result = await query(
      'SELECT * FROM local_resources WHERE id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Erro ao buscar recurso' });
  }
});

/**
 * POST /api/resources/access-log
 * Log when user accesses a resource (for analytics)
 */
router.post('/access-log', async (req, res) => {
  try {
    const { resourceId, resourceType } = req.body;
    const userId = req.user.id;

    // Log analytics event (hashed user_id for privacy)
    const crypto = require('crypto');
    const hashedUserId = crypto
      .createHash('sha256')
      .update(userId.toString() + process.env.ANALYTICS_SALT)
      .digest('hex');

    await query(
      `INSERT INTO analytics_events (event_type, user_id_hashed, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        'resource_accessed',
        hashedUserId,
        JSON.stringify({ resourceId, resourceType })
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging resource access:', error);
    // Don't fail if logging fails
    res.json({ success: true });
  }
});

module.exports = router;

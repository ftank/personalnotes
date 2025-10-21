const { verifyIdToken } = require('../config/firebase');
const { query } = require('../config/database');
const { processMessage } = require('./claude');
const { detectEmergency } = require('./emergency');
const { EncryptionManager } = require('../utils/encryption');
const { setCache, getCache } = require('../config/redis');

/**
 * Setup Socket.IO server
 * @param {Server} io - Socket.IO server instance
 */
function setupSocketIO(io) {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify Firebase token
      const decodedToken = await verifyIdToken(token);

      // Get user from database
      const userResult = await query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [decodedToken.uid]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      // Attach user data to socket
      socket.userId = userResult.rows[0].id;
      socket.firebaseUid = decodedToken.uid;
      socket.userEmail = decodedToken.email;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userEmail})`);

    // Join user's private room
    socket.join(`user:${socket.userId}`);

    // Update last login
    query('UPDATE users SET last_login = NOW() WHERE id = $1', [socket.userId])
      .catch(err => console.error('Error updating last login:', err));

    // ============================================
    // CREATE NEW CONVERSATION
    // ============================================
    socket.on('create_conversation', async (data, callback) => {
      try {
        const { title } = data || {};

        const result = await query(
          `INSERT INTO conversations (user_id, title, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           RETURNING *`,
          [socket.userId, title || 'Nova conversa']
        );

        const conversation = result.rows[0];

        if (callback) {
          callback({ success: true, conversation });
        }

      } catch (error) {
        console.error('Error creating conversation:', error);
        if (callback) {
          callback({ success: false, error: 'Erro ao criar conversa' });
        }
      }
    });

    // ============================================
    // GET CONVERSATION HISTORY
    // ============================================
    socket.on('get_conversation', async (data, callback) => {
      try {
        const { conversationId } = data;

        // Verify conversation belongs to user
        const convResult = await query(
          'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
          [conversationId, socket.userId]
        );

        if (convResult.rows.length === 0) {
          if (callback) {
            callback({ success: false, error: 'Conversa não encontrada' });
          }
          return;
        }

        // Get messages
        const messagesResult = await query(
          `SELECT id, content_encrypted, iv, auth_tag, role, timestamp
           FROM messages
           WHERE conversation_id = $1
           ORDER BY timestamp ASC`,
          [conversationId]
        );

        // Get user's encryption data
        const userResult = await query(
          'SELECT encryption_salt FROM users WHERE id = $1',
          [socket.userId]
        );

        const userSalt = userResult.rows[0].encryption_salt;
        const encryptionManager = new EncryptionManager(socket.firebaseUid, userSalt);
        encryptionManager.initMasterKey();

        // Decrypt messages
        const decryptedMessages = messagesResult.rows.map(msg => {
          try {
            const decrypted = encryptionManager.decryptData({
              encrypted: msg.content_encrypted,
              iv: msg.iv,
              authTag: msg.auth_tag
            });
            return {
              id: msg.id,
              role: msg.role,
              content: decrypted,
              timestamp: msg.timestamp
            };
          } catch (err) {
            console.error('Error decrypting message:', err);
            return {
              id: msg.id,
              role: msg.role,
              content: '[Erro ao descriptografar]',
              timestamp: msg.timestamp
            };
          }
        });

        if (callback) {
          callback({
            success: true,
            conversation: convResult.rows[0],
            messages: decryptedMessages
          });
        }

      } catch (error) {
        console.error('Error getting conversation:', error);
        if (callback) {
          callback({ success: false, error: 'Erro ao buscar conversa' });
        }
      }
    });

    // ============================================
    // SEND MESSAGE (Main chat handler)
    // ============================================
    socket.on('user_message', async (data) => {
      try {
        const { message, conversationId } = data;

        if (!message || !conversationId) {
          socket.emit('error', { message: 'Dados incompletos' });
          return;
        }

        // Verify conversation belongs to user
        const convResult = await query(
          'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
          [conversationId, socket.userId]
        );

        if (convResult.rows.length === 0) {
          socket.emit('error', { message: 'Conversa não encontrada' });
          return;
        }

        // Get user's encryption data
        const userResult = await query(
          'SELECT encryption_salt FROM users WHERE id = $1',
          [socket.userId]
        );

        const userSalt = userResult.rows[0].encryption_salt;
        const encryptionManager = new EncryptionManager(socket.firebaseUid, userSalt);
        encryptionManager.initMasterKey();

        // Encrypt user message
        const encryptedMessage = encryptionManager.encryptData(message);

        // Save user message
        const userMsgResult = await query(
          `INSERT INTO messages (
            conversation_id, content_encrypted, iv, auth_tag, role, timestamp
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id, timestamp`,
          [
            conversationId,
            encryptedMessage.encrypted,
            encryptedMessage.iv,
            encryptedMessage.authTag,
            'user'
          ]
        );

        // Confirm message saved
        socket.emit('message_saved', {
          messageId: userMsgResult.rows[0].id,
          timestamp: userMsgResult.rows[0].timestamp
        });

        // Update conversation updated_at
        await query(
          'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
          [conversationId]
        );

        // Check if this is the first message and update title if needed
        const messageCountResult = await query(
          'SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1',
          [conversationId]
        );

        const messageCount = parseInt(messageCountResult.rows[0].count);

        // If this is the first user message, generate a title from it
        if (messageCount === 1) {
          const currentConv = convResult.rows[0];
          // Only update if it's still the default title
          if (currentConv.title === 'Nova conversa' || currentConv.title === 'Nova Conversa') {
            // Generate title from first 50 characters of message
            let generatedTitle = message.trim();
            if (generatedTitle.length > 50) {
              generatedTitle = generatedTitle.substring(0, 50) + '...';
            }

            await query(
              'UPDATE conversations SET title = $1 WHERE id = $2',
              [generatedTitle, conversationId]
            );

            console.log(`📝 Auto-generated title for conversation ${conversationId}: ${generatedTitle}`);

            // Notify client about title update
            socket.emit('conversation_title_updated', {
              conversationId,
              title: generatedTitle
            });
          }
        }

        // Get conversation history for context
        const historyResult = await query(
          `SELECT content_encrypted, iv, auth_tag, role, timestamp
           FROM messages
           WHERE conversation_id = $1
           ORDER BY timestamp DESC
           LIMIT 20`,
          [conversationId]
        );

        // Decrypt recent messages for context
        const conversationHistory = historyResult.rows.reverse().map(msg => {
          try {
            const decrypted = encryptionManager.decryptData({
              encrypted: msg.content_encrypted,
              iv: msg.iv,
              authTag: msg.auth_tag
            });
            return { role: msg.role, content: decrypted };
          } catch (err) {
            console.error('Error decrypting message:', err);
            return null;
          }
        }).filter(Boolean);

        // Detect emergency
        const emergencyCheck = await detectEmergency(message, conversationHistory);

        if (emergencyCheck.isEmergency) {
          socket.emit('emergency_detected', emergencyCheck);

          // Update user risk level
          await query(
            'UPDATE users SET risk_level = $1 WHERE id = $2',
            [emergencyCheck.riskLevel, socket.userId]
          );
        }

        // Show "assistant typing" indicator
        socket.emit('assistant_typing', true);

        // Get user context (goals, patterns, risk level)
        const [goalsResult, patternsResult, userRiskResult] = await Promise.all([
          query(
            `SELECT id, goal_encrypted, goal_iv, goal_auth_tag, progress, status
             FROM user_goals WHERE user_id = $1 AND status = 'active'`,
            [socket.userId]
          ),
          query(
            'SELECT pattern_type FROM identified_patterns WHERE user_id = $1',
            [socket.userId]
          ),
          query('SELECT risk_level FROM users WHERE id = $1', [socket.userId])
        ]);

        // Decrypt goals
        const activeGoals = goalsResult.rows.map(goal => {
          try {
            const decryptedGoal = encryptionManager.decryptData({
              encrypted: goal.goal_encrypted,
              iv: goal.goal_iv,
              authTag: goal.goal_auth_tag
            });
            return {
              id: goal.id,
              title: decryptedGoal,
              progress: goal.progress
            };
          } catch (err) {
            return null;
          }
        }).filter(Boolean);

        const context = {
          activeGoals,
          identifiedPatterns: patternsResult.rows,
          riskLevel: userRiskResult.rows[0]?.risk_level || 'low',
          isFirstMessage: conversationHistory.length === 0
        };

        // Process message with Claude AI
        const aiResponse = await processMessage(
          message,
          context,
          conversationHistory.slice(-10) // Last 10 messages for context
        );

        // Stop typing indicator
        socket.emit('assistant_typing', false);

        // Encrypt AI response
        const encryptedResponse = encryptionManager.encryptData(aiResponse);

        // Save AI response
        const aiMsgResult = await query(
          `INSERT INTO messages (
            conversation_id, content_encrypted, iv, auth_tag, role, timestamp
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id, timestamp`,
          [
            conversationId,
            encryptedResponse.encrypted,
            encryptedResponse.iv,
            encryptedResponse.authTag,
            'assistant'
          ]
        );

        // Send AI response to user
        socket.emit('assistant_message', {
          messageId: aiMsgResult.rows[0].id,
          message: aiResponse,
          timestamp: aiMsgResult.rows[0].timestamp,
          emergencyContext: emergencyCheck.isEmergency ? emergencyCheck : null
        });

        // Save identified patterns if any
        if (emergencyCheck.identifiedPatterns && emergencyCheck.identifiedPatterns.length > 0) {
          for (const pattern of emergencyCheck.identifiedPatterns) {
            await query(
              `INSERT INTO identified_patterns (user_id, pattern_type, identified_at)
               VALUES ($1, $2, NOW())
               ON CONFLICT DO NOTHING`,
              [socket.userId, pattern]
            ).catch(err => console.error('Error saving pattern:', err));
          }
        }

      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('assistant_typing', false);
        socket.emit('error', {
          message: 'Erro ao processar mensagem. Por favor, tente novamente.'
        });
      }
    });

    // ============================================
    // GET USER CONVERSATIONS LIST
    // ============================================
    socket.on('get_conversations', async (callback) => {
      try {
        const result = await query(
          `SELECT id, title, created_at, updated_at
           FROM conversations
           WHERE user_id = $1
           ORDER BY updated_at DESC`,
          [socket.userId]
        );

        if (callback) {
          callback({ success: true, conversations: result.rows });
        }

      } catch (error) {
        console.error('Error getting conversations:', error);
        if (callback) {
          callback({ success: false, error: 'Erro ao buscar conversas' });
        }
      }
    });

    // ============================================
    // UPDATE CONVERSATION TITLE
    // ============================================
    socket.on('update_conversation_title', async (data, callback) => {
      try {
        const { conversationId, title } = data;

        if (!conversationId || !title) {
          if (callback) {
            callback({ success: false, error: 'Dados incompletos' });
          }
          return;
        }

        // Verify conversation belongs to user
        const convResult = await query(
          'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
          [conversationId, socket.userId]
        );

        if (convResult.rows.length === 0) {
          if (callback) {
            callback({ success: false, error: 'Conversa não encontrada' });
          }
          return;
        }

        // Update title
        await query(
          'UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2',
          [title, conversationId]
        );

        console.log(`📝 Updated conversation ${conversationId} title to: ${title}`);

        if (callback) {
          callback({ success: true, title });
        }

      } catch (error) {
        console.error('Error updating conversation title:', error);
        if (callback) {
          callback({ success: false, error: 'Erro ao atualizar título' });
        }
      }
    });

    // ============================================
    // DELETE CONVERSATION
    // ============================================
    socket.on('delete_conversation', async (data, callback) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          if (callback) {
            callback({ success: false, error: 'ID da conversa não fornecido' });
          }
          return;
        }

        // Verify conversation belongs to user
        const convResult = await query(
          'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
          [conversationId, socket.userId]
        );

        if (convResult.rows.length === 0) {
          if (callback) {
            callback({ success: false, error: 'Conversa não encontrada' });
          }
          return;
        }

        // Delete messages first (foreign key constraint)
        await query(
          'DELETE FROM messages WHERE conversation_id = $1',
          [conversationId]
        );

        // Delete conversation
        await query(
          'DELETE FROM conversations WHERE id = $1',
          [conversationId]
        );

        console.log(`🗑️ Deleted conversation ${conversationId} for user ${socket.userId}`);

        if (callback) {
          callback({ success: true });
        }

      } catch (error) {
        console.error('Error deleting conversation:', error);
        if (callback) {
          callback({ success: false, error: 'Erro ao deletar conversa' });
        }
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

  });
}

module.exports = { setupSocketIO };

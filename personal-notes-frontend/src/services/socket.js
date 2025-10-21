import { io } from 'socket.io-client';
import { getCurrentUserToken } from '../config/firebase';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Connect to Socket.IO server
   */
  async connect() {
    if (this.socket && this.connected) {
      console.log('Socket already connected');
      return;
    }

    const token = await getCurrentUserToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connected = false;
    });

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => resolve());
      this.socket.on('connect_error', (error) => reject(error));
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Create new conversation
   * @param {string} title - Conversation title
   * @returns {Promise<Object>}
   */
  createConversation(title) {
    return new Promise((resolve, reject) => {
      this.socket.emit('create_conversation', { title }, (response) => {
        if (response.success) {
          resolve(response.conversation);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Get conversation with messages
   * @param {number} conversationId
   * @returns {Promise<Object>}
   */
  getConversation(conversationId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('get_conversation', { conversationId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Get all conversations
   * @returns {Promise<Array>}
   */
  getConversations() {
    return new Promise((resolve, reject) => {
      this.socket.emit('get_conversations', (response) => {
        if (response.success) {
          resolve(response.conversations);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Delete conversation
   * @param {number} conversationId
   * @returns {Promise<void>}
   */
  deleteConversation(conversationId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('delete_conversation', { conversationId }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Send message to AI
   * @param {string} message - User message
   * @param {number} conversationId - Conversation ID
   */
  sendMessage(message, conversationId) {
    this.socket.emit('user_message', { message, conversationId });
  }

  /**
   * Listen for message saved confirmation
   * @param {Function} callback
   */
  onMessageSaved(callback) {
    this.socket.on('message_saved', callback);
  }

  /**
   * Listen for AI typing indicator
   * @param {Function} callback
   */
  onAssistantTyping(callback) {
    this.socket.on('assistant_typing', callback);
  }

  /**
   * Listen for AI response
   * @param {Function} callback
   */
  onAssistantMessage(callback) {
    this.socket.on('assistant_message', callback);
  }

  /**
   * Listen for emergency detection
   * @param {Function} callback
   */
  onEmergencyDetected(callback) {
    this.socket.on('emergency_detected', callback);
  }

  /**
   * Listen for errors
   * @param {Function} callback
   */
  onError(callback) {
    this.socket.on('error', callback);
  }

  /**
   * Listen for conversation title updates
   * @param {Function} callback
   */
  onConversationTitleUpdated(callback) {
    this.socket.on('conversation_title_updated', callback);
  }

  /**
   * Update conversation title
   * @param {number} conversationId
   * @param {string} title
   * @returns {Promise<Object>}
   */
  updateConversationTitle(conversationId, title) {
    return new Promise((resolve, reject) => {
      this.socket.emit('update_conversation_title', { conversationId, title }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Remove specific listener
   * @param {string} event
   */
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

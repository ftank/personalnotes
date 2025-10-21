import { create } from 'zustand';
import socketService from '../services/socket';

const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  currentConversation: null,
  messages: [],
  isTyping: false,
  emergencyAlert: null,
  loading: false,
  error: null,
  socketInitialized: false,

  // Actions

  /**
   * Initialize socket listeners (only once)
   */
  initSocketListeners: () => {
    // Only initialize once
    if (get().socketInitialized) {
      console.log('Socket listeners already initialized');
      return;
    }

    console.log('Initializing socket listeners...');

    // Listen for message saved confirmation
    socketService.onMessageSaved((data) => {
      console.log('Message saved:', data);
    });

    // Listen for AI typing indicator
    socketService.onAssistantTyping((isTyping) => {
      set({ isTyping });
    });

    // Listen for AI response
    socketService.onAssistantMessage((data) => {
      const { messageId, message, timestamp, emergencyContext } = data;

      console.log('Received assistant message:', messageId);

      // Add AI message to messages
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: messageId,
            role: 'assistant',
            content: message,
            timestamp
          }
        ]
      }));

      // Handle emergency if present
      if (emergencyContext) {
        set({ emergencyAlert: emergencyContext });
      }
    });

    // Listen for emergency detection
    socketService.onEmergencyDetected((emergency) => {
      set({ emergencyAlert: emergency });
    });

    // Listen for errors
    socketService.onError((error) => {
      console.error('Socket error:', error);
      set({ error: error.message });
    });

    // Listen for conversation title updates
    socketService.onConversationTitleUpdated((data) => {
      const { conversationId, title } = data;
      console.log('Conversation title updated:', conversationId, title);

      // Update conversation in list
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, title } : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId
          ? { ...state.currentConversation, title }
          : state.currentConversation
      }));
    });

    // Mark as initialized
    set({ socketInitialized: true });
  },

  /**
   * Connect socket
   */
  connectSocket: async () => {
    try {
      // Check if already connected
      if (socketService.socket && socketService.connected) {
        console.log('Socket already connected');
        // Ensure listeners are initialized
        if (!get().socketInitialized) {
          get().initSocketListeners();
        }
        return;
      }

      console.log('Connecting socket...');
      await socketService.connect();
      get().initSocketListeners();
    } catch (error) {
      console.error('Error connecting socket:', error);
      set({ error: 'Erro ao conectar com o servidor' });
    }
  },

  /**
   * Load conversations list
   */
  loadConversations: async () => {
    set({ loading: true, error: null });
    try {
      // Ensure socket is connected
      if (!socketService.socket || !socketService.connected) {
        await get().connectSocket();
      }

      const conversations = await socketService.getConversations();
      set({ conversations, loading: false });
    } catch (error) {
      console.error('Error loading conversations:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Create new conversation
   */
  createConversation: async (title = 'Nova conversa') => {
    set({ loading: true, error: null });
    try {
      // Ensure socket is connected
      if (!socketService.socket || !socketService.connected) {
        await get().connectSocket();
      }

      const conversation = await socketService.createConversation(title);

      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation,
        messages: [],
        loading: false
      }));

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Set current conversation
   */
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  /**
   * Update conversation title
   */
  updateConversationTitle: async (conversationId, title) => {
    set({ loading: true, error: null });
    try {
      // Ensure socket is connected
      if (!socketService.socket || !socketService.connected) {
        await get().connectSocket();
      }

      await socketService.updateConversationTitle(conversationId, title);

      // Update in state
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, title } : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId
          ? { ...state.currentConversation, title }
          : state.currentConversation,
        loading: false
      }));

    } catch (error) {
      console.error('Error updating conversation title:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete conversation
   */
  deleteConversation: async (conversationId) => {
    set({ loading: true, error: null });
    try {
      // Ensure socket is connected
      if (!socketService.socket || !socketService.connected) {
        await get().connectSocket();
      }

      await socketService.deleteConversation(conversationId);

      // Remove from state
      set((state) => ({
        conversations: state.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId ? null : state.currentConversation,
        messages: state.currentConversation?.id === conversationId ? [] : state.messages,
        loading: false
      }));

    } catch (error) {
      console.error('Error deleting conversation:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Load messages for a conversation
   */
  loadMessages: async (conversationId) => {
    set({ loading: true, error: null });
    try {
      // Ensure socket is connected
      if (!socketService.socket || !socketService.connected) {
        await get().connectSocket();
      }

      const { conversation, messages } = await socketService.getConversation(conversationId);

      console.log('Loaded messages:', messages);

      // Messages come already decrypted from backend
      set({
        messages: messages || [],
        loading: false
      });

    } catch (error) {
      console.error('Error loading messages:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Load conversation and messages
   */
  loadConversation: async (conversationId) => {
    set({ loading: true, error: null });
    try {
      const { conversation, messages } = await socketService.getConversation(conversationId);

      // Convert encrypted messages to displayable format
      // Note: Messages are encrypted - we'll need to decrypt on backend or handle separately
      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: '[Encrypted]', // Placeholder - will need decryption
        encrypted: true,
        encryptedData: {
          content: msg.content_encrypted,
          iv: msg.iv,
          authTag: msg.auth_tag
        },
        timestamp: msg.timestamp
      }));

      set({
        currentConversation: conversation,
        messages: formattedMessages,
        loading: false
      });

    } catch (error) {
      console.error('Error loading conversation:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Send message
   */
  sendMessage: async (message) => {
    try {
      // Ensure socket is connected
      if (!socketService.socket || !socketService.connected) {
        await get().connectSocket();
      }

      const { currentConversation } = get();

      if (!currentConversation) {
        // Create new conversation if none selected
        try {
          const newConversation = await get().createConversation();
          set({ currentConversation: newConversation });
        } catch (error) {
          console.error('Error creating conversation:', error);
          return;
        }
      }

      // Add user message to UI immediately
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        pending: true
      };

      set((state) => ({
        messages: [...state.messages, userMessage]
      }));

      // Send via socket
      socketService.sendMessage(message, get().currentConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: 'Erro ao enviar mensagem' });
    }
  },

  /**
   * Clear emergency alert
   */
  clearEmergencyAlert: () => {
    set({ emergencyAlert: null });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset chat state
   */
  reset: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      isTyping: false,
      emergencyAlert: null,
      loading: false,
      error: null,
      socketInitialized: false
    });

    // Disconnect and remove socket listeners
    socketService.disconnect();
    socketService.removeAllListeners();
  }

}));

export default useChatStore;

import axios from 'axios';
import { getCurrentUserToken } from '../config/firebase';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getCurrentUserToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);

      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
    } else {
      // Error setting up request
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH ENDPOINTS
// ============================================

export const verifyAuth = async (idToken) => {
  const response = await api.post('/api/auth/verify', { idToken });
  return response.data;
};

export const logoutAPI = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

// ============================================
// USER ENDPOINTS
// ============================================

export const getUserProfile = async () => {
  const response = await api.get('/api/user/profile');
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete('/api/user/delete-account');
  return response.data;
};

export const exportUserData = async () => {
  const response = await api.get('/api/user/export-data');
  return response.data;
};

export const recordConsent = async (consentType, accepted) => {
  const response = await api.post('/api/user/consent', { consentType, accepted });
  return response.data;
};

// ============================================
// CONVERSATIONS ENDPOINTS
// ============================================

export const getConversations = async () => {
  const response = await api.get('/api/conversations');
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/api/conversations/${id}`);
  return response.data;
};

export const createConversation = async (title) => {
  const response = await api.post('/api/conversations', { title });
  return response.data;
};

export const updateConversation = async (id, title) => {
  const response = await api.put(`/api/conversations/${id}`, { title });
  return response.data;
};

export const deleteConversation = async (id) => {
  const response = await api.delete(`/api/conversations/${id}`);
  return response.data;
};

export const getConversationMessages = async (id) => {
  const response = await api.get(`/api/conversations/${id}/messages`);
  return response.data;
};

// ============================================
// GOALS ENDPOINTS
// ============================================

export const getGoals = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/api/goals', { params });
  return response.data;
};

export const getGoal = async (id) => {
  const response = await api.get(`/api/goals/${id}`);
  return response.data;
};

export const createGoal = async (goal, description) => {
  const response = await api.post('/api/goals', { goal, description });
  return response.data;
};

export const updateGoal = async (id, updates) => {
  const response = await api.put(`/api/goals/${id}`, updates);
  return response.data;
};

export const deleteGoal = async (id) => {
  const response = await api.delete(`/api/goals/${id}`);
  return response.data;
};

export const createCheckin = async (goalId, notes, moodScore) => {
  const response = await api.post(`/api/goals/${goalId}/checkin`, { notes, moodScore });
  return response.data;
};

export const getGoalCheckins = async (goalId) => {
  const response = await api.get(`/api/goals/${goalId}/checkins`);
  return response.data;
};

// ============================================
// RESOURCES ENDPOINTS
// ============================================

export const getResources = async (filters = {}) => {
  const response = await api.get('/api/resources', { params: filters });
  return response.data;
};

export const getEmergencyResources = async () => {
  const response = await api.get('/api/resources/emergency');
  return response.data;
};

export const getResource = async (id) => {
  const response = await api.get(`/api/resources/${id}`);
  return response.data;
};

export const logResourceAccess = async (resourceId, resourceType) => {
  const response = await api.post('/api/resources/access-log', { resourceId, resourceType });
  return response.data;
};

export default api;

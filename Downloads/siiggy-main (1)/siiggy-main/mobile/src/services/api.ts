import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './networkHelper';

// API Base URL - change this for production
const API_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  getUser: () => api.get('/auth/user'),
  
  updateLocation: (lat: number, lng: number) =>
    api.post('/auth/location', { lat, lng }),
};

// Signals API
export const signalsApi = {
  getFeed: (lat: number, lng: number, limit?: number) =>
    api.get('/signals', { params: { lat, lng, limit } }),
  
  getSignal: (id: number) => api.get(`/signals/${id}`),
  
  createSignal: (formData: FormData) =>
    api.post('/signals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  deleteSignal: (id: number) => api.delete(`/signals/${id}`),
  
  getMySignals: () => api.get('/my-signals'),
  
  trackView: (id: number) => api.post(`/signals/${id}/view`),
  
  trackTap: (id: number) => api.post(`/signals/${id}/tap`),
  
  trackShare: (id: number) => api.post(`/signals/${id}/share`),
};

// Contexts API
export const contextsApi = {
  getAll: () => api.get('/contexts'),
  
  getGrouped: () => api.get('/contexts/grouped'),
  
  getByCategory: (category: 'food' | 'services' | 'goods') =>
    api.get(`/contexts/category/${category}`),
};

// Subscriptions API
export const subscriptionsApi = {
  getAll: () => api.get('/subscriptions'),
  
  getMy: () => api.get('/subscriptions'),
  
  subscribe: (contextId: number, notify?: boolean) =>
    api.post('/subscriptions', { context_id: contextId, notify }),
  
  subscribeBulk: (contextIds: number[]) =>
    api.post('/subscriptions/bulk', { context_ids: contextIds }),
  
  unsubscribe: (subscriptionId: number) =>
    api.delete(`/subscriptions/${subscriptionId}`),
  
  toggleNotify: (contextId: number) =>
    api.patch(`/subscriptions/${contextId}/notify`),
};

// Demands API
export const demandsApi = {
  getFeed: (lat: number, lng: number, radius?: number, contextId?: number) =>
    api.get('/demands', { params: { lat, lng, radius, context_id: contextId } }),
  
  getDemand: (id: number) => api.get(`/demands/${id}`),
  
  createDemand: (data: {
    context_id: number;
    description: string;
    budget?: string;
    lat: number;
    lng: number;
    radius_km?: number;
    expires_hours?: number;
  }) => api.post('/demands', data),
  
  updateStatus: (id: number, status: 'active' | 'fulfilled' | 'cancelled') =>
    api.patch(`/demands/${id}/status`, { status }),
  
  deleteDemand: (id: number) => api.delete(`/demands/${id}`),
  
  getMyDemands: () => api.get('/my-demands'),
  
  getResponses: (demandId: number) => api.get(`/demands/${demandId}/responses`),
};

// Chat API
export const chatApi = {
  getConversations: () => api.get('/conversations'),
  
  startConversation: (data: {
    user_id: number;
    signal_id?: number;
    demand_id?: number;
    initial_message: string;
  }) => api.post('/conversations', data),
  
  getMessages: (conversationId: number, page?: number) =>
    api.get(`/conversations/${conversationId}/messages`, { params: { page } }),
  
  sendMessage: (conversationId: number, content: string, type?: 'text' | 'image' | 'location') =>
    api.post(`/conversations/${conversationId}/messages`, { content, type }),
  
  markRead: (conversationId: number) =>
    api.post(`/conversations/${conversationId}/read`),
  
  getUnreadCount: () => api.get('/chat/unread-count'),
};

// Notifications API
export const notificationsApi = {
  registerToken: (token: string, deviceType?: string, deviceName?: string) =>
    api.post('/notifications/token', { token, device_type: deviceType, device_name: deviceName }),
  
  removeToken: (token: string) =>
    api.delete('/notifications/token', { data: { token } }),
  
  getSettings: () => api.get('/notifications/settings'),
};

export default api;

import { apiClient } from '../client';

/**
 * Authentication API Resource
 * Handles user registration, login, and profile management
 */

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  register: (data: RegisterData) => apiClient.post('/auth/register', data),
  login: (data: LoginData) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getUser: () => apiClient.get('/auth/user'),
  updateLocation: (lat: number, lng: number) =>
    apiClient.post('/auth/location', { lat, lng }),
};

import { apiClient } from '../client';

/**
 * Signals API Resource
 * Handles signal CRUD operations and analytics
 */

export interface SignalFeedParams {
  lat: number;
  lng: number;
  limit?: number;
}

export const signalsApi = {
  getFeed: (lat: number, lng: number, limit?: number) =>
    apiClient.get('/signals', { params: { lat, lng, limit } }),
  
  getSignal: (id: number) => 
    apiClient.get(`/signals/${id}`),
  
  createSignal: (formData: FormData) =>
    apiClient.post('/signals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  deleteSignal: (id: number) => 
    apiClient.delete(`/signals/${id}`),
  
  getMySignals: () => 
    apiClient.get('/my-signals'),
  
  // Analytics
  trackView: (id: number) => 
    apiClient.post(`/signals/${id}/view`),
  
  trackTap: (id: number) => 
    apiClient.post(`/signals/${id}/tap`),
  
  trackShare: (id: number) => 
    apiClient.post(`/signals/${id}/share`),
};

import { apiClient } from '../client';

/**
 * Contexts API Resource
 * Handles signal context/category operations
 */

export type ContextCategory = 'food' | 'services' | 'goods';

export const contextsApi = {
  getAll: () => apiClient.get('/contexts'),
  
  getGrouped: () => apiClient.get('/contexts/grouped'),
  
  getByCategory: (category: ContextCategory) =>
    apiClient.get(`/contexts/category/${category}`),
};

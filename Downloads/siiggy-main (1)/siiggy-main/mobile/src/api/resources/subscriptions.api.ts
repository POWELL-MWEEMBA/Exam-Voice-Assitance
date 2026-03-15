import { apiClient } from '../client';

/**
 * Subscriptions API Resource
 * Handles user context subscriptions and notifications
 */

export interface SubscribeData {
  context_id: number;
  notify?: boolean;
}

export const subscriptionsApi = {
  getAll: () => apiClient.get('/subscriptions'),
  
  getMy: () => apiClient.get('/subscriptions'),
  
  subscribe: (contextId: number, notify: boolean = true) =>
    apiClient.post('/subscriptions', { context_id: contextId, notify }),
  
  subscribeBulk: (contextIds: number[]) =>
    apiClient.post('/subscriptions/bulk', { context_ids: contextIds }),
  
  unsubscribe: (subscriptionId: number) =>
    apiClient.delete(`/subscriptions/${subscriptionId}`),
  
  toggleNotify: (contextId: number) =>
    apiClient.patch(`/subscriptions/${contextId}/notify`),
};

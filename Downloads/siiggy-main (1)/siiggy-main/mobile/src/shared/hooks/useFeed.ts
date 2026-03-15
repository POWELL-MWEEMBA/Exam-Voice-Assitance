import { useState, useCallback } from 'react';
import { signalsApi } from '../../api';
import { useFeedStore, useLocationStore } from '../../store';
import { showNetworkError } from '../utils';
import { Signal } from '../../types';

/**
 * Hook to manage feed data loading and refreshing
 */
export const useFeed = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { location } = useLocationStore();
  const { signals, setSignals, isLoading, setLoading, setError, loadFromCache } = useFeedStore();

  const loadSignals = useCallback(async () => {
    if (!location) {
      await loadFromCache();
      return;
    }

    try {
      setLoading(true);
      const response = await signalsApi.getFeed(location.lat, location.lng);
      setSignals(response.data.data);
    } catch (error: any) {
      console.error('Failed to load signals:', error);
      if (!showNetworkError(error)) {
        setError('Failed to load signals');
      }
      await loadFromCache();
    } finally {
      setLoading(false);
    }
  }, [location]);

  const refreshSignals = useCallback(async () => {
    setRefreshing(true);
    await loadSignals();
    setRefreshing(false);
  }, [loadSignals]);

  return {
    signals,
    isLoading,
    refreshing,
    loadSignals,
    refreshSignals,
  };
};

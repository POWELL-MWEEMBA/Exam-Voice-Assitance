import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

/**
 * Hook to manage saved/bookmarked signals
 */
export const useSavedSignals = () => {
  const [savedSignals, setSavedSignals] = useState<Set<number>>(new Set());

  const isSaved = useCallback((signalId: number) => {
    return savedSignals.has(signalId);
  }, [savedSignals]);

  const toggleSave = useCallback((signalId: number) => {
    setSavedSignals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(signalId)) {
        newSet.delete(signalId);
      } else {
        newSet.add(signalId);
      }
      return newSet;
    });
    // TODO: API call to persist save state
  }, []);

  const saveSignal = useCallback((signalId: number) => {
    setSavedSignals(prev => new Set(prev).add(signalId));
    // TODO: API call
  }, []);

  const unsaveSignal = useCallback((signalId: number) => {
    setSavedSignals(prev => {
      const newSet = new Set(prev);
      newSet.delete(signalId);
      return newSet;
    });
    // TODO: API call
  }, []);

  return {
    savedSignals,
    isSaved,
    toggleSave,
    saveSignal,
    unsaveSignal,
  };
};

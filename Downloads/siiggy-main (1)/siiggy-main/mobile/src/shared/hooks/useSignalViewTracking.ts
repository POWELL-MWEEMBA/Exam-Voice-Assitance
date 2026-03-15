import { useRef, useCallback } from 'react';
import { ViewToken } from 'react-native';
import { signalsApi } from '../../api';
import { Signal } from '../../types';
import { VIDEO_VIEWABILITY_THRESHOLD } from '../../constants';

/**
 * Hook to track signal views for analytics
 */
export const useSignalViewTracking = (signals: Signal[]) => {
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: VIDEO_VIEWABILITY_THRESHOLD,
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== null) {
          const signal = signals[index];
          if (signal) {
            // Track view asynchronously without blocking UI
            signalsApi.trackView(signal.id).catch(() => {});
          }
          return index;
        }
      }
      return null;
    },
    [signals]
  );

  return {
    viewabilityConfig: viewabilityConfig.current,
    onViewableItemsChanged,
  };
};

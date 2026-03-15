/**
 * Haptic Feedback Utilities
 * Gracefully handles missing expo-haptics module
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const triggerHaptic = (style: HapticStyle = 'light') => {
  // No-op if expo-haptics is not installed
  // TODO: Implement with: import * as Haptics from 'expo-haptics';
  // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const triggerSelection = () => {
  // Haptics.selectionAsync();
};

export const triggerNotification = (type: 'success' | 'warning' | 'error') => {
  // Haptics.notificationAsync(Haptics.NotificationFeedbackType[type.charAt(0).toUpperCase() + type.slice(1)]);
};

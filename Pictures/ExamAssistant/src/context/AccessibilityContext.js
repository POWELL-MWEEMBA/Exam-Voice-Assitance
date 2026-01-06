/**
 * Accessibility Context
 * Provides app-wide accessibility settings for visually impaired users
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccessibilityContext = createContext(null);

const STORAGE_KEY = '@accessibility_settings';

const defaultSettings = {
  // Core accessibility features
  accessibilityMode: true,        // Master toggle for accessibility features
  autoReadQuestions: false,       // Disabled (no TTS)
  autoReadOptions: false,         // Disabled (no TTS)
  confirmSelections: false,       // Disabled (no TTS)
  voiceNavigation: false,        // Disabled (no STT)
  
  // Feedback settings
  hapticFeedback: true,           // Vibration feedback
  
  // Timing
  readingPauseDuration: 500,      // Pause between sections (ms)
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('[Accessibility] Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to storage whenever they change
  const updateSettings = useCallback(async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[Accessibility] Failed to save settings:', error);
    }
  }, [settings]);

  // Toggle a boolean setting
  const toggleSetting = useCallback((key) => {
    if (typeof settings[key] === 'boolean') {
      updateSettings({ [key]: !settings[key] });
    }
  }, [settings, updateSettings]);

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[Accessibility] Failed to reset settings:', error);
    }
  }, []);

  const value = {
    settings,
    isLoading,
    updateSettings,
    toggleSetting,
    resetSettings,
    // Convenience getters
    isAccessibilityEnabled: settings.accessibilityMode,
    shouldAutoRead: false, // Always false (no TTS)
    shouldConfirmSelections: false, // Always false (no TTS)
    hasVoiceNavigation: false, // Always false (no STT)
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;

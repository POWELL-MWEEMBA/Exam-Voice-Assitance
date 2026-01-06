/**
 * Accessibility Settings Screen
 * Allows blind users to customize their experience
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { AppColors } from '../../constants/AppColors';
import { globalStyles } from '../../constants/GlobalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@accessibility_settings';

// Default settings
const defaultSettings = {
  confirmSelections: true,
  hapticFeedback: true,
  audioFeedback: true,
  announceProgress: true,
  doubleConfirmSubmit: true,
};

const AccessibilitySettings = ({ navigation }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          setSettings({ ...defaultSettings, ...JSON.parse(stored) });
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Update a setting
  const updateSetting = async (key, value, announcement) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);
    
    if (settings.hapticFeedback) {
      Vibration.vibrate(50);
    }
  };

  // Toggle a boolean setting
  const toggleSetting = async (key, label) => {
    const newValue = !settings[key];
    await updateSetting(key, newValue);
  };

  // Go back
  const handleGoBack = () => {
    navigation?.goBack();
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={[globalStyles.safeContainer, styles.container]}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.safeContainer, styles.container]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            accessibilityLabel="Go back to home screen"
            accessibilityRole="button"
            accessibilityHint="Double tap to return to the previous screen"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text 
            style={styles.title}
            accessibilityRole="header"
          >
            Accessibility Settings
          </Text>
          <Text style={styles.subtitle}>
            Customize your experience
          </Text>
        </View>

        {/* Feedback Settings */}
        <View style={[globalStyles.card, styles.section]}>
          <Text 
            style={styles.sectionTitle}
            accessibilityRole="header"
          >
            📳 Feedback Settings
          </Text>

          <SettingToggle
            label="Confirm Answer Selections"
            description="Confirms your selected answer"
            value={settings.confirmSelections}
            onToggle={() => toggleSetting('confirmSelections', 'Answer confirmations')}
          />

          <SettingToggle
            label="Haptic Feedback (Vibration)"
            description="Vibrates when you interact with the app"
            value={settings.hapticFeedback}
            onToggle={() => toggleSetting('hapticFeedback', 'Vibration feedback')}
          />

          <SettingToggle
            label="Audio Feedback"
            description="Audio cues for actions and navigation"
            value={settings.audioFeedback}
            onToggle={() => toggleSetting('audioFeedback', 'Audio feedback')}
          />
        </View>

        {/* Exam Settings */}
        <View style={[globalStyles.card, styles.section]}>
          <Text 
            style={styles.sectionTitle}
            accessibilityRole="header"
          >
            📝 Exam Settings
          </Text>

          <SettingToggle
            label="Announce Progress"
            description="Tells you progress after every 5 questions"
            value={settings.announceProgress}
            onToggle={() => toggleSetting('announceProgress', 'Progress announcements')}
          />

          <SettingToggle
            label="Confirm Before Submit"
            description="Requires double confirmation to submit exam"
            value={settings.doubleConfirmSubmit}
            onToggle={() => toggleSetting('doubleConfirmSubmit', 'Submit confirmation')}
          />
        </View>


        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={async () => {
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);
            if (defaultSettings.hapticFeedback) {
              Vibration.vibrate([0, 100, 50, 100]);
            }
          }}
          accessibilityLabel="Reset all settings to defaults"
          accessibilityRole="button"
          accessibilityHint="Double tap to restore all default settings"
        >
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Toggle Setting Component
const SettingToggle = ({ label, description, value, onToggle }) => (
  <TouchableOpacity
    style={styles.toggleRow}
    onPress={onToggle}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
    accessibilityLabel={`${label}. ${description}. Currently ${value ? 'enabled' : 'disabled'}`}
    accessibilityHint={`Double tap to ${value ? 'disable' : 'enable'}`}
  >
    <View style={styles.toggleContent}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: AppColors.border, true: AppColors.primaryLight }}
      thumbColor={value ? AppColors.primary : AppColors.textLight}
    />
  </TouchableOpacity>
);

// Command Item Component
const CommandItem = ({ command, description }) => (
  <View 
    style={styles.commandItem}
    accessibilityLabel={`Say "${command}" to ${description}`}
  >
    <Text style={styles.commandText}>"{command}"</Text>
    <Text style={styles.commandDescription}>{description}</Text>
  </View>
);

export default AccessibilitySettings;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background || '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
    color: AppColors.textMedium,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: AppColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textMedium,
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
    marginBottom: 4,
  },
  sliderHint: {
    fontSize: 14,
    color: AppColors.textMedium,
    marginBottom: 8,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  testButton: {
    backgroundColor: AppColors.primaryLight || '#eff6ff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: AppColors.textMedium,
  },
  helpButton: {
    backgroundColor: AppColors.success || '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white || '#ffffff',
  },
  commandsList: {
    gap: 8,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  commandText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primary,
    width: 100,
  },
  commandDescription: {
    fontSize: 15,
    color: AppColors.textMedium,
    flex: 1,
  },
  resetButton: {
    backgroundColor: AppColors.white,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.error || '#ef4444',
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.error || '#ef4444',
  },
});






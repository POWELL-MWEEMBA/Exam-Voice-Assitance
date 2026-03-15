import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button, TextInput, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import * as Location from 'expo-location';
import { ContextPicker } from '../components';
import { contextsApi, demandsApi } from '../services';
import { useLocationStore } from '../store';
import { Context } from '../types';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';

interface PostDemandScreenProps {
  navigation: any;
}

export const PostDemandScreen: React.FC<PostDemandScreenProps> = ({ navigation }) => {
  const colors = useThemeColors();
  const [step, setStep] = useState<'context' | 'details'>('context');
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [radiusKm, setRadiusKm] = useState('5');
  const [expiresHours, setExpiresHours] = useState('24');
  const [loading, setLoading] = useState(false);
  const [loadingContexts, setLoadingContexts] = useState(true);

  const { location, setLocation } = useLocationStore();

  useEffect(() => {
    loadContexts();
  }, []);

  useEffect(() => {
    if (!location) {
      getCurrentLocation();
    }
  }, []);

  const loadContexts = async () => {
    try {
      const response = await contextsApi.getAll();
      setContexts(response.data.data);
    } catch (error) {
      console.error('Failed to load contexts:', error);
      Alert.alert('Error', 'Failed to load contexts');
    } finally {
      setLoadingContexts(false);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Location permission is required');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
    });
  };

  const handleSubmit = async () => {
    if (!selectedContextId || !description || !location) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    try {
      setLoading(true);

      await demandsApi.createDemand({
        context_id: selectedContextId,
        description,
        budget: budget || undefined,
        lat: location.lat,
        lng: location.lng,
        radius_km: parseFloat(radiusKm),
        expires_hours: parseInt(expiresHours),
      });

      Alert.alert('Success', 'Your request has been posted! Nearby suppliers will be notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to post demand:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to post request'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedContext = contexts.find((c) => c.id === selectedContextId);

  if (loadingContexts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.default }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Choose Context */}
        {step === 'context' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>🔍 What are you looking for?</Text>
            <Text style={styles.stepSubtitle}>
              Choose what type of product or service you need
            </Text>

            <ContextPicker
              contexts={contexts}
              selectedIds={selectedContextId ? [selectedContextId] : []}
              onSelect={(id) => {
                setSelectedContextId(id);
                setStep('details');
              }}
              onDeselect={() => setSelectedContextId(null)}
              maxSelections={1}
            />
          </View>
        )}

        {/* Step 2: Add Details */}
        {step === 'details' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {selectedContext?.emoji} Describe your request
            </Text>
            <Text style={styles.stepSubtitle}>
              Be specific so suppliers can help you better
            </Text>

            {/* Context Badge */}
            <View style={styles.contextBadge}>
              <Text style={styles.contextBadgeText}>
                {selectedContext?.emoji} {selectedContext?.name}
              </Text>
            </View>

            {/* Description Input */}
            <TextInput
              label="What do you need? *"
              value={description}
              onChangeText={(text) => setDescription(text.slice(0, 200))}
              placeholder="e.g., Looking for fresh fish, preferably bream..."
              style={styles.input}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.secondary}
              multiline={true}
              numberOfLines={4}
              right={<TextInput.Affix text={`${description.length}/200`} />}
            />

            {/* Budget Input */}
            <TextInput
              label="Budget (optional)"
              value={budget}
              onChangeText={setBudget}
              placeholder="e.g., K50-100"
              style={styles.input}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.secondary}
            />

            {/* Radius Selection */}
            <Text style={styles.sectionLabel}>Search radius</Text>
            <SegmentedButtons
              value={radiusKm}
              onValueChange={setRadiusKm}
              buttons={[
                { value: '2', label: '2km' },
                { value: '5', label: '5km' },
                { value: '10', label: '10km' },
                { value: '25', label: '25km' },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Expiry Selection */}
            <Text style={styles.sectionLabel}>How long should this stay active?</Text>
            <SegmentedButtons
              value={expiresHours}
              onValueChange={setExpiresHours}
              buttons={[
                { value: '6', label: '6h' },
                { value: '12', label: '12h' },
                { value: '24', label: '24h' },
                { value: '48', label: '48h' },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || !description}
              style={styles.submitButton}
              buttonColor={colors.secondary}
              contentStyle={{ paddingVertical: 8 }}
            >
              📢 Post Request
            </Button>

            <Button
              mode="text"
              onPress={() => setStep('context')}
              textColor={colors.text.light}
              disabled={loading}
            >
              Back
            </Button>

            {/* Extra space for keyboard */}
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.header,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  contextBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.secondary + '30',
  },
  contextBadgeText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 16,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.paragraph,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default PostDemandScreen;

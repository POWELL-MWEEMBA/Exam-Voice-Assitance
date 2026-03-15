import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { ContextPicker } from '../components/ContextPicker';
import { contextsApi, subscriptionsApi } from '../../../api';
import { useSubscriptionStore, useLocationStore } from '../../../store';
import { Context } from '../../../types';
import { colors, spacing } from '../../../theme';

/**
 * Subscriptions Screen
 * Manage user's context subscriptions
 */

interface SubscriptionsScreenProps {
  navigation: any;
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({ navigation }) => {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { subscriptions, setSubscriptions, addSubscription, removeSubscription } = useSubscriptionStore();
  const { location } = useLocationStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contextsResponse, subscriptionsResponse] = await Promise.all([
        contextsApi.getAll(),
        subscriptionsApi.getMy(),
      ]);

      setContexts(contextsResponse.data.data);
      setSubscriptions(subscriptionsResponse.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleSelect = async (contextId: number) => {
    if (!location) return;

    try {
      setSaving(true);
      const response = await subscriptionsApi.subscribe(contextId, true);
      addSubscription(response.data.data);
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeselect = async (contextId: number) => {
    const subscription = subscriptions.find((s) => s.context_id === contextId);
    if (!subscription) return;

    try {
      setSaving(true);
      await subscriptionsApi.unsubscribe(subscription.id);
      removeSubscription(subscription.id);
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    } finally {
      setSaving(false);
    }
  };

  const subscribedContextIds = subscriptions.map((s) => s.context_id);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
        <Text style={styles.subtitle}>{subscriptions.length} selected</Text>
      </View>

      <FlatList
        data={[{ key: 'contexts' }]}
        renderItem={() => (
          <ContextPicker
            contexts={contexts}
            selectedIds={subscribedContextIds}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            disabled={saving}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, FAB, Chip, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocationStore, useAuthStore } from '../store';
import { demandsApi } from '../services';
import { Demand } from '../types';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';

interface DemandsScreenProps {
  navigation: any;
}

export const DemandsScreen: React.FC<DemandsScreenProps> = ({ navigation }) => {
  const colors = useThemeColors();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const { location } = useLocationStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (location) {
      loadDemands();
    }
  }, [location]);

  const loadDemands = async () => {
    if (!location) return;

    try {
      setLoading(true);
      const response = await demandsApi.getFeed(location.lat, location.lng);
      setDemands(response.data.data);
    } catch (error) {
      console.error('Failed to load demands:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDemands();
    setRefreshing(false);
  }, [location]);

  const handleRespond = (demand: Demand) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    // Navigate to chat with the demand poster
    navigation.navigate('ChatScreen', { 
      otherUser: demand.user,
      demandId: demand.id,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const renderDemand = ({ item }: { item: Demand }) => (
    <Pressable 
      style={styles.demandCard}
      onPress={() => handleRespond(item)}
    >
      <LinearGradient
        colors={[colors.secondary, colors.secondaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.demandGradient}
      >
        {/* Header */}
        <View style={styles.demandHeader}>
          <View style={styles.contextBadge}>
            <Text style={styles.contextEmoji}>{item.context?.emoji}</Text>
            <Text style={styles.contextName}>{item.context?.name}</Text>
          </View>
          <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
        </View>

        {/* Description */}
        <Text style={styles.demandDescription} numberOfLines={3}>
          "{item.description}"
        </Text>

        {/* Budget & Distance */}
        <View style={styles.demandMeta}>
          {item.budget && (
            <Chip 
              mode="flat" 
              style={styles.budgetChip}
              textStyle={styles.chipText}
            >
              💰 {item.budget}
            </Chip>
          )}
          {item.distance_km !== undefined && (
            <Chip 
              mode="flat" 
              style={styles.distanceChip}
              textStyle={styles.chipText}
            >
              📍 {item.distance_km < 1 
                ? `${Math.round(item.distance_km * 1000)}m` 
                : `${item.distance_km.toFixed(1)}km`}
            </Chip>
          )}
        </View>

        {/* Respond Button - Hide on own demands */}
        {item.user?.id !== user?.id && (
          <Pressable 
            style={styles.respondButton}
            onPress={() => handleRespond(item)}
          >
            <Text style={styles.respondButtonText}>
              ✋ I Can Help
            </Text>
          </Pressable>
        )}

        {/* View Responses Button - Show on own demands */}
        {item.user?.id === user?.id && (
          <Pressable 
            style={[styles.respondButton, { backgroundColor: colors.background.light }]}
            onPress={() => navigation.navigate('DemandResponses', { demandId: item.id })}
          >
            <Text style={[styles.respondButtonText, { color: colors.text.header }]}>
              📬 View Responses ({item.responses_count})
            </Text>
          </Pressable>
        )}

        {/* Responses count - Only show for other users' demands */}
        {item.user?.id !== user?.id && item.responses_count > 0 && (
          <Text style={styles.responsesCount}>
            {item.responses_count} response{item.responses_count > 1 ? 's' : ''}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={[styles.emptyTitle, { color: colors.text.header }]}>No Demands Nearby</Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.light }]}>
        People near you haven't posted any requests yet.{'\n'}
        Be the first to ask for something!
      </Text>
    </View>
  );

  if (loading && demands.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.default }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.light }]}>Finding requests near you...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 50, backgroundColor: colors.background.default, borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.header }]}>Local Requests</Text>
        </View>
        <IconButton icon="magnify" size={28} iconColor={colors.text.header} style={{ margin: 0 }} />
      </View>

      <FlatList
        data={demands}
        renderItem={renderDemand}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Post Demand FAB */}
      {isAuthenticated && (
        <FAB
          icon="hand-wave"
          label="Request"
          style={[styles.fab, { bottom: insets.bottom + 100 }]}
          color="#fff"
          onPress={() => navigation.navigate('PostDemand')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#aaa',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 160,
  },
  demandCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  demandGradient: {
    padding: 20,
  },
  demandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  contextEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  contextName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  demandDescription: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 15,
  },
  demandMeta: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  budgetChip: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  distanceChip: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  respondButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewResponsesButton: {
  },
  respondButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  responsesCount: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 25,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: colors.primary,
  },
});

export default DemandsScreen;

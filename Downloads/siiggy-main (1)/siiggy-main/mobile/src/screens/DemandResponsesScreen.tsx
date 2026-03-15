import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Avatar, Chip, IconButton } from 'react-native-paper';
import { demandsApi } from '../services';
import { Conversation, Demand } from '../types';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';

interface DemandResponsesScreenProps {
  navigation: any;
  route: {
    params: {
      demandId: number;
    };
  };
}

export const DemandResponsesScreen: React.FC<DemandResponsesScreenProps> = ({
  navigation,
  route,
}) => {
  const colors = useThemeColors();
  const { demandId } = route.params;
  const [responses, setResponses] = useState<Conversation[]>([]);
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadResponses();
  }, [demandId]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const response = await demandsApi.getResponses(demandId);
      setResponses(response.data.data);
      setDemand(response.data.demand);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadResponses();
    setRefreshing(false);
  }, [demandId]);

  const handleOpenChat = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: conversation.other_user,
    });
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'No messages yet';
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

  const renderResponse = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.responseCard}
      onPress={() => handleOpenChat(item)}
      activeOpacity={0.7}
    >
      <Avatar.Text
        size={50}
        label={item.other_user?.name?.[0]?.toUpperCase() || '?'}
        style={{ backgroundColor: colors.secondary }}
      />
      <View style={styles.responseInfo}>
        <Text style={[styles.responderName, { color: colors.text.header }]}>{item.other_user?.name || 'User'}</Text>
        {item.latest_message && (
          <Text style={[styles.lastMessage, { color: colors.text.light }]} numberOfLines={1}>
            {item.latest_message.content}
          </Text>
        )}
        <Text style={[styles.timeAgo, { color: colors.text.light }]}>{formatTimeAgo(item.last_message_at)}</Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={[styles.emptyTitle, { color: colors.text.header }]}>No Responses Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.light }]}>
        People nearby will see your request and can respond.{'\n'}
        Check back later!
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (!demand) return null;
    return (
      <View style={[styles.demandHeader, { backgroundColor: colors.background.light, borderColor: colors.border }]}>
        <View style={styles.contextRow}>
          <Chip mode="flat" style={styles.contextChip} textStyle={{ color: '#fff' }}>
            {demand.context?.emoji} {demand.context?.name}
          </Chip>
          <Chip mode="flat" style={styles.statusChip} textStyle={{ color: '#fff' }}>
            {demand.status}
          </Chip>
        </View>
        <Text style={[styles.demandDescription, { color: colors.text.header }]}>"{demand.description}"</Text>
        {demand.budget && (
          <Text style={styles.demandBudget}>Budget: {demand.budget}</Text>
        )}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.responsesTitle, { color: colors.text.header }]}>
          {responses.length} Response{responses.length !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading responses...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      {/* Custom Header */}
      <View style={[styles.customHeader, { paddingTop: insets.top, backgroundColor: colors.background.default, borderBottomColor: colors.border }]}>
        <IconButton 
          icon="arrow-left" 
          iconColor={colors.text.header} 
          onPress={() => navigation.goBack()} 
        />
        <Text style={[styles.headerTitle, { color: colors.text.header }]}>Responses</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={responses}
        renderItem={renderResponse}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  demandHeader: {
    backgroundColor: '#111',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#222',
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  contextChip: {
    backgroundColor: colors.secondary,
  },
  statusChip: {
    backgroundColor: colors.primary,
  },
  demandDescription: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#fff',
    marginBottom: spacing.sm,
    lineHeight: 26,
  },
  demandBudget: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: spacing.md,
  },
  responsesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  responseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#222',
  },
  responseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  responderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default DemandResponsesScreen;

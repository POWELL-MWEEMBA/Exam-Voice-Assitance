import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Avatar, Badge, Searchbar, ActivityIndicator, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatApi } from '../services';
import { Conversation } from '../types';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';

export const ConversationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useThemeColors();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await chatApi.getConversations();
      setConversations(response.data.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'now' : `${diffMins}m`;
    }
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationCard, 
        { backgroundColor: colors.background.light, borderColor: colors.border },
        item.unread_count > 0 && [styles.unreadCard, { borderColor: colors.primary + '40' }]
      ]}
      onPress={() => navigation.navigate('Chat', { conversationId: item.id, otherUser: item.other_user })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar.Text
          size={55}
          label={item.other_user.name.substring(0, 2).toUpperCase()}
          style={styles.avatar}
          color="#fff"
        />
        {item.unread_count > 0 && (
          <Badge style={styles.unreadBadge}>{item.unread_count}</Badge>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.headerRow}>
          <Text style={[styles.userName, { color: colors.text.header }, item.unread_count > 0 && styles.unreadText]} numberOfLines={1}>
            {item.other_user.name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text.light }]}>{formatTime(item.last_message_at)}</Text>
        </View>

        {item.latest_message && (
          <Text style={[styles.lastMessage, { color: colors.text.paragraph }]} numberOfLines={2}>
            {item.latest_message.content}
          </Text>
        )}

        {item.context && (
          <View style={[styles.contextRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.contextLabel, { color: colors.text.light }]}>
              {item.context.type === 'signal' ? '📦 Signal' : '🔍 Request'}:{' '}
              <Text style={styles.contextTitle}>
                {item.context.emoji} {item.context.name}
              </Text>
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.default }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <View style={[styles.customHeader, { paddingTop: insets.top, backgroundColor: colors.background.default, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text.header }]}>Messages</Text>
        <IconButton
          icon="bell-outline"
          iconColor={colors.text.header}
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      <Searchbar
        placeholder="Search conversations..."
        placeholderTextColor={colors.text.light}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: colors.background.light, borderColor: colors.border }]}
        inputStyle={[styles.searchInput, { color: colors.text.header }]}
        iconColor={colors.text.light}
      />

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={[styles.emptyTitle, { color: colors.text.header }]}>No conversations yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.light }]}>
            Start chatting by responding to signals or requests
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadConversations(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchbar: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 0,
    borderWidth: 1,
  },
  searchInput: {
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  unreadCard: {
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    backgroundColor: colors.secondary,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    fontWeight: '700',
    color: '#000',
  },
  conversationContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadText: {
    fontWeight: '800',
    color: colors.primary,
  },
  timestamp: {
    fontSize: 13,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  contextRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  contextLabel: {
    fontSize: 12,
  },
  contextTitle: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ConversationsScreen;

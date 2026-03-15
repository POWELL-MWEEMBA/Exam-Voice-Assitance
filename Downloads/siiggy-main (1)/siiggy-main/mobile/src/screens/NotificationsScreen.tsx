import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Share, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, IconButton, Avatar, Button } from 'react-native-paper';
import { colors, useThemeColors } from '../theme';

interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'demand' | 'system';
  user?: {
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
  targetImage?: string;
  isUnread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: { name: 'martini_rond', avatar: 'https://i.pravatar.cc/150?u=1' },
    content: 'liked your signal "Fresh Fish available"',
    time: '2h',
    targetImage: 'https://picsum.photos/id/101/100/100',
    isUnread: true,
  },
  {
    id: '2',
    type: 'follow',
    user: { name: 'maxjacobson', avatar: 'https://i.pravatar.cc/150?u=2' },
    content: 'started following you',
    time: '5h',
    isUnread: true,
  },
  {
    id: '3',
    type: 'comment',
    user: { name: 'zackjohn', avatar: 'https://i.pravatar.cc/150?u=3' },
    content: 'commented: Is this still available?',
    time: '1d',
    targetImage: 'https://picsum.photos/id/102/100/100',
    isUnread: false,
  },
  {
    id: '4',
    type: 'demand',
    content: 'New demand: "Need reliable plumbing service near Masala"',
    time: '1d',
    isUnread: false,
  },
  {
    id: '5',
    type: 'system',
    content: 'Welcome to SIIGGY! Start exploring signals around you.',
    time: '2d',
    isUnread: false,
  },
];

interface NotificationsScreenProps {
  navigation: any;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All activity');
  const [filterVisible, setFilterVisible] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out SIIGGY - The local supply signal app!',
        url: 'https://siiggy.app',
      });
    } catch (error) {}
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, item.isUnread && styles.unreadItem]}
      onPress={() => {
        if (item.type === 'follow' || (item.user && !item.targetImage)) {
          navigation.navigate('Profile', { userId: item.id }); // Mock user ID
        } else if (item.targetImage) {
          // Navigate to a mock signal detail
          navigation.navigate('SignalDetail', { signal: { id: 1, description: item.content } });
        }
      }}
    >
      {item.user ? (
        <Avatar.Image size={48} source={{ uri: item.user.avatar }} />
      ) : (
        <View style={styles.systemIcon}>
          <IconButton 
            icon={item.type === 'demand' ? 'alert-circle-outline' : 'information-outline'} 
            iconColor={colors.primary} 
            size={24} 
            style={{ margin: 0 }}
          />
        </View>
      )}
      
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationText, { color: colors.text.paragraph }]}>
          {item.user && <Text style={[styles.userName, { color: colors.text.header }]}>{item.user.name} </Text>}
          <Text style={[styles.contentText, { color: colors.text.paragraph }]}>{item.content}</Text>
          <Text style={[styles.timeText, { color: colors.text.light }]}>  {item.time}</Text>
        </Text>
      </View>

      {item.targetImage ? (
        <Image source={{ uri: item.targetImage }} style={styles.targetThumbnail} />
      ) : item.type === 'follow' ? (
        <Button 
          mode="contained" 
          buttonColor={colors.primary} 
          textColor="#000"
          style={styles.followBtn}
          labelStyle={styles.followBtnLabel}
        >
          Follow
        </Button>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.background.default, borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-left" iconColor={colors.text.header} onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: colors.text.header }]}>
          Notifications
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <IconButton 
            icon="share-variant" 
            iconColor={colors.text.header} 
            onPress={handleShare} 
            size={22}
          />
          <IconButton 
            icon="send-outline" 
            iconColor={colors.text.header} 
            onPress={() => navigation.navigate('Messages')} 
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.filterRow} 
        onPress={() => setFilterVisible(true)}
      >
        <Text style={[styles.filterText, { color: colors.text.header }]}>
          {filter} ▾
        </Text>
      </TouchableOpacity>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconButton 
              icon="message-processing-outline" 
              size={48} 
              iconColor={colors.text.light} 
              disabled 
            />
            <Text style={[styles.title, { color: colors.text.header }]}>
              Notifications aren't available
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.light }]}>
              Notifications about your account will appear here
            </Text>
          </View>
        }
      />

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setFilterVisible(false)}
        >
          <View style={styles.filterMenu}>
            {['All activity', 'Likes', 'Comments', 'Mentions', 'Followers', 'From SIIGGY'].map((label) => (
              <TouchableOpacity 
                key={label} 
                style={styles.filterOption}
                onPress={() => { setFilter(label); setFilterVisible(false); }}
              >
                <Text style={[styles.filterOptionText, { color: colors.text.header }, filter === label && { color: colors.primary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: 'rgba(255,177,0,0.05)',
  },
  systemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 18,
  },
  userName: {
    fontWeight: 'bold',
  },
  contentText: {
  },
  timeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  targetThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  followBtn: {
    borderRadius: 4,
    height: 32,
    justifyContent: 'center',
  },
  followBtnLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  emptyState: {
    flex: 1,
    height: 500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterMenu: {
    borderRadius: 12,
    padding: 8,
    width: '60%',
    borderWidth: 1,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;

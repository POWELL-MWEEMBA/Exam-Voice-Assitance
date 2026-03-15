import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, FlatList, Dimensions, Modal, Text, TouchableOpacity, ScrollView, TextInput, Linking, Platform, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton, Avatar, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import FullScreenSignalCard from '../components/FullScreenSignalCard';
import { signalsApi, chatApi } from '../services';
import { useLocationStore, useFeedStore, useAuthStore } from '../store';
import { useThemeColors } from '../theme';

const { height, width } = Dimensions.get('window');
const BOTTOM_TAB_HEIGHT = 80;

const DUMMY_VIDEOS = [
  {
    id: '1',
    user: { name: 'siiggy_creator_1' },
    description: 'Welcome to SIIGGY! 🚀 Creating the best local supply UI.',
    media_type: 'video',
    media_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    context: { emoji: '🔥', name: 'Trending' },
    distance_km: 1.2,
    price: 0,
    lat: 40.7128,
    lng: -74.0060,
  },
  {
    id: '2',
    user: { name: 'siiggy_creator_2' },
    description: 'Swipe up for more awesomeness! SIIGGY is taking over!',
    media_type: 'video',
    media_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    context: { emoji: '🐘', name: 'Nature' },
    distance_km: 5.5,
    lat: 34.0522,
    lng: -118.2437,
  },
  {
    id: '3',
    user: { name: 'siiggy_creator_3' },
    description: 'Look at this amazing car! SIIGGY exclusive.',
    media_type: 'video',
    media_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    context: { emoji: '🚗', name: 'Autos' },
    distance_km: 12.0,
    lat: 51.5074,
    lng: -0.1278,
  }
];

// Note: SHARE_APPS moved inside component to access dynamic colors

const DUMMY_COMMENTS = [
  { id: '1', user: 'martini_rond', text: 'How neatly I write the date in my book', time: '22h', likes: '8098', replies: 4, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', user: 'maxjacobson', text: 'Now that’s a skill very talented', time: '22h', likes: '8098', replies: 1, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', user: 'zackjohn', text: 'Doing this would make me so anxious', time: '22h', likes: '8098', replies: 0, avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', user: 'kiero_d', text: 'Use that on r air forces to whiten them', time: '21h', likes: '8098', replies: 9, avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', user: 'mis_potter', text: 'Sjpuld’ve used that on his forces 😁😁', time: '13h', likes: '8098', replies: 4, verified: true, avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: '6', user: 'karennne', text: 'No prressure', time: '22h', likes: '8098', replies: 2, avatar: 'https://i.pravatar.cc/150?u=6' },
  { id: '7', user: 'joshua_l', text: 'My OCD couldn’t do it', time: '15h', likes: '8098', replies: 0, avatar: 'https://i.pravatar.cc/150?u=7' },
];

export default function HomeFeedScreen({ navigation }: any) {
  const colors = useThemeColors();
  
  const SHARE_APPS = [
    { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25D366', iconColor: '#fff', size: 30 },
    { id: 'whatsapp_status', label: 'WhatsApp\nstatus', icon: 'whatsapp', bgColor: '#25D366', iconColor: '#fff', size: 30 },
    { id: 'message', label: 'Message', icon: 'send', bgColor: colors.primary, iconColor: '#fff', size: 26 },
    { id: 'sms', label: 'SMS', icon: 'message-processing', bgColor: '#4cd964', iconColor: '#fff', size: 26 },
    { id: 'messenger', label: 'Messenger', icon: 'facebook-messenger', bgColor: '#0084FF', iconColor: '#fff', size: 30 },
    { id: 'instagram', label: 'Instagram', icon: 'instagram', bgColor: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'], iconColor: '#fff', size: 30 },
  ];

  const SHARE_ACTIONS = [
    { id: 'report', label: 'Report', icon: 'alert-outline', bgColor: colors.background.light, iconColor: colors.text.header, size: 28 },
    { id: 'not_interested', label: 'Not\ninterested', icon: 'heart-broken-outline', bgColor: colors.background.light, iconColor: colors.text.header, size: 28 },
    { id: 'save', label: 'Save video', icon: 'download-outline', bgColor: colors.background.light, iconColor: colors.text.header, size: 28 },
    { id: 'duet', label: 'Duet', icon: 'google-circles-extended', bgColor: colors.background.light, iconColor: colors.text.header, size: 28 },
    { id: 'react', label: 'React', icon: 'emoticon-outline', bgColor: colors.background.light, iconColor: colors.text.header, size: 28 },
    { id: 'favorite', label: 'Add to\nFavorites', icon: 'bookmark-outline', bgColor: colors.background.light, iconColor: colors.text.header, size: 28 },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  // Content state
  const { signals, setSignals, isLoading, setLoading, loadFromCache } = useFeedStore();
  const { location, setLocation, setError: setLocationError } = useLocationStore();
  const { isAuthenticated, user } = useAuthStore();
  
  const [cityName, setCityName] = useState('Ndola');
  const [neighborhood, setNeighborhood] = useState('Masala');
  const [commentsData, setCommentsData] = useState(DUMMY_COMMENTS);
  const [newCommentText, setNewCommentText] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Init location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      };
      setLocation(coords);

      // Reverse geocode to get city/neighborhood
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });
        if (address && address.length > 0) {
          const first = address[0];
          setCityName(first.city || 'Near me');
          setNeighborhood(first.district || first.subregion || 'Nearby');
        }
      } catch (e) {}
    })();
  }, []);

  // Load signals
  const loadSignals = async () => {
    if (!location) return;
    try {
      setLoading(true);
      const response = await signalsApi.getFeed(location.lat, location.lng);
      setSignals(response.data.data);
    } catch (error: any) {
      console.error('Failed to load signals:', error);
      await loadFromCache();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (location) {
        loadSignals();
      } else {
        loadFromCache();
      }
    }, [location])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSignals();
    setRefreshing(false);
  }, [location]);

  const handleInterest = async (signal: any) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'You need to be logged in to express interest.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Create a conversation for this interest
      await chatApi.startConversation({
        user_id: signal.user.id,
        signal_id: signal.id,
        initial_message: `Hi! I'm interested in your post: "${signal.description}"`
      });
      
      Alert.alert(
        'Interested! 🎉',
        `We've notified ${signal.user.name}. You can find the chat in your Inbox.`,
        [
          { text: 'Go to Inbox', onPress: () => navigation.navigate('ChatScreen', { conversationId: 0, otherUser: signal.user }) },
          { text: 'Keep Browsing', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send interest. Please try again.');
    }
  };


  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    
    const newComment = {
      id: Date.now().toString(),
      user: 'siggy_creator',
      text: newCommentText.trim(),
      time: 'Just now',
      likes: '0',
      replies: 0,
      avatar: 'https://i.pravatar.cc/150?u=current_user'
    };
    
    setCommentsData([newComment, ...commentsData]);
    setNewCommentText('');
  };

  const toggleCommentLike = (commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const toggleRepliesInfo = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
  });

  const handleOpenComments = () => {
    setCommentsVisible(true);
  };

  const handleOpenShare = () => {
    setShareVisible(true);
  };

  const handleLocationPress = async (signal: any) => {
    const { lat, lng } = signal;
    if (!lat || !lng) {
      Alert.alert('Location unavailable', 'This post does not have a valid location attached.');
      return;
    }

    const label = encodeURIComponent(signal.context?.name || 'Signal Location');
    
    // Google Maps URL that works on both platforms natively
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${label}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    
    // Web fallback
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url || webUrl);
      if (canOpen && url) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open maps:', error);
      Alert.alert('Error', 'Could not open maps application');
    }
  };

  return (
    <View style={styles.container}>
      {/* Absolute Header with Tabs */}
      <View style={[styles.topBar, { backgroundColor: 'transparent' }]}>
        <View style={styles.tabContainer}>
           <Text style={styles.tabTextInactive}>{cityName}</Text>
           <Text style={styles.tabTextSeparator}>|</Text>
           <Text style={styles.tabTextActive}>{neighborhood}</Text>
        </View>
        <IconButton icon="magnify" iconColor="#fff" size={28} style={styles.searchIcon} />
      </View>

      <FlatList
        data={signals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <FullScreenSignalCard 
            signal={item as any}
            isActive={!commentsVisible && !shareVisible && index === activeIndex}
            onChatPress={handleOpenComments}
            onSharePress={handleOpenShare}
            onVendorPress={() => navigation.navigate('Profile', { userId: item.user?.id })}
            onLocationPress={handleLocationPress}
            onSavePress={() => {}}
            onInterestPress={() => handleInterest(item)}
            onSoundPress={() => navigation.navigate('Gallery')}
            isSaved={false}
          />
        )}
        showsVerticalScrollIndicator={false}
        snapToInterval={height - BOTTOM_TAB_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: height - BOTTOM_TAB_HEIGHT,
          offset: (height - BOTTOM_TAB_HEIGHT) * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ flex: 1, height: height - BOTTOM_TAB_HEIGHT, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.default }}>
              <Text style={{ color: colors.text.header, fontSize: 18, fontWeight: 'bold' }}>No signals nearby yet</Text>
              <Text style={{ color: colors.text.light, marginTop: 10 }}>Be the first to post something!</Text>
            </View>
          ) : null
        }
      />

      {/* Comments Bottom Sheet */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentsVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCommentsVisible(false)} />
        <View style={[styles.commentsSheet, { backgroundColor: colors.background.default }]}>
          <View style={styles.sheetHeader}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text.header }]}>Comments</Text>
            {/* Simple close button slightly hidden to keep the look clean, but still usable */}
            <IconButton icon="close" size={20} iconColor={colors.text.header} style={styles.closeButtonAbsolute} onPress={() => setCommentsVisible(false)} />
          </View>
          <ScrollView style={styles.commentsList}>
            {commentsData.map((comment) => {
              const isLiked = likedComments.has(comment.id);
              const likeCountStr = isLiked 
                ? (parseInt(comment.likes) + 1).toString() 
                : comment.likes;
                
              return (
                <View key={comment.id} style={styles.commentRow}>
                  <Avatar.Image size={36} source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                  <View style={styles.commentContent}>
                    <View style={styles.commentUserRow}>
                      <Text style={styles.commentUser}>{comment.user}</Text>
                      {comment.verified && <IconButton icon="check-decagram" size={12} iconColor={colors.primary} style={{margin:0, padding:0, width: 14, height: 14}} />}
                    </View>
                    <Text style={[styles.commentText, { color: colors.text.header }]}>
                      {comment.text} <Text style={[styles.commentTime, { color: colors.text.light }]}>{comment.time}</Text>
                    </Text>
                    {comment.replies > 0 && (
                      <View>
                        <TouchableOpacity onPress={() => toggleRepliesInfo(comment.id)}>
                          <Text style={[styles.viewRepliesText, { color: colors.text.light }]}>
                            {expandedReplies.has(comment.id) ? 'Hide replies' : `View replies (${comment.replies})`}
                            <IconButton icon={expandedReplies.has(comment.id) ? "chevron-up" : "chevron-down"} size={12} iconColor={colors.text.light} style={{margin:0, padding:0, width:14,height:14}} />
                          </Text>
                        </TouchableOpacity>
                        
                        {/* Mock Expanded Replies */}
                        {expandedReplies.has(comment.id) && Array.from({ length: Math.min(comment.replies, 3) }).map((_, i) => (
                           <View key={`reply-${comment.id}-${i}`} style={styles.replyRow}>
                              <Avatar.Image size={24} source={{ uri: `https://i.pravatar.cc/150?u=r${comment.id}${i}` }} style={styles.commentAvatar} />
                              <View style={styles.commentContent}>
                                <Text style={styles.commentUser}>reply_user_{i} <Text style={styles.commentTime}>2h</Text></Text>
                                <Text style={styles.commentText}>This is a mock reply {i + 1}!</Text>
                              </View>
                              <View style={styles.commentLikeContainer}>
                                <IconButton icon="heart-outline" iconColor="#888" size={16} style={{margin: 0, padding: 0, width: 24, height: 24}} />
                                <Text style={styles.commentLikeCount}>{(i + 1) * 12}</Text>
                              </View>
                           </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.commentLikeContainer}>
                    <TouchableOpacity onPress={() => toggleCommentLike(comment.id)}>
                      <IconButton 
                        icon={isLiked ? "heart" : "heart-outline"} 
                        iconColor={isLiked ? "#fe0979" : "#888"} 
                        size={20} 
                        style={{margin: 0, padding: 0}} 
                      />
                    </TouchableOpacity>
                    <Text style={[styles.commentLikeCount, { color: colors.text.light }, isLiked && {color: '#fe0979'}]}>{likeCountStr}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={[styles.commentInputContainer, { borderTopColor: colors.border, backgroundColor: colors.background.default }]}>
             <TextInput 
                placeholder="Add comment..." 
                placeholderTextColor={colors.text.light}
                style={[styles.commentInput, { color: colors.text.header }]} 
                value={newCommentText}
                onChangeText={setNewCommentText}
                onSubmitEditing={handleAddComment}
                returnKeyType="send"
             />
             {newCommentText.trim().length > 0 ? (
               <IconButton icon="arrow-up-circle" iconColor="#fe0979" size={28} style={{margin: 0}} onPress={handleAddComment} />
             ) : (
               <>
                 <IconButton icon="at" iconColor={colors.text.header} size={24} style={{margin: 0}} />
                 <IconButton icon="emoticon-outline" iconColor={colors.text.header} size={24} style={{margin: 0}} />
               </>
             )}
          </View>
        </View>
      </Modal>

      {/* Share Bottom Sheet */}
      <Modal
        visible={shareVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShareVisible(false)} />
        <View style={[styles.shareSheet, { backgroundColor: colors.background.default }]}>
          <Text style={[styles.shareSheetTitle, { color: colors.text.header }]}>Share to</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shareRowScroll} contentContainerStyle={styles.shareRowContent}>
            {SHARE_APPS.map((app) => (
              <View key={app.id} style={styles.shareItemContainer}>
                {Array.isArray(app.bgColor) ? (
                  <LinearGradient colors={app.bgColor as [string, string, ...string[]]} style={styles.shareCircleBg}>
                    <IconButton icon={app.icon} iconColor={app.iconColor} size={app.size} style={{margin: 0, padding: 0}} />
                  </LinearGradient>
                ) : (
                  <View style={[styles.shareCircleBg, { backgroundColor: app.bgColor }]}>
                    <IconButton icon={app.icon} iconColor={app.iconColor} size={app.size} style={{margin: 0, padding: 0}} />
                  </View>
                )}
                <Text style={[styles.shareLabel, { color: colors.text.header }]}>{app.label}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.shareDivider, { backgroundColor: colors.border }]} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shareRowScroll} contentContainerStyle={styles.shareRowContent}>
            {SHARE_ACTIONS.map((action) => (
              <View key={action.id} style={styles.shareItemContainer}>
                  <View style={[styles.shareCircleBg, { backgroundColor: action.bgColor }]}>
                    <IconButton icon={action.icon} iconColor={action.iconColor || colors.text.header} size={action.size} style={{margin: 0, padding: 0}} />
                  </View>
                <Text style={[styles.shareLabel, { color: colors.text.header }]}>{action.label}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={[styles.cancelButtonOuter, { borderTopColor: colors.border, backgroundColor: colors.background.default }]} onPress={() => setShareVisible(false)}>
            <Text style={[styles.cancelButtonText, { color: colors.text.header }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: BOTTOM_TAB_HEIGHT, // Reserve bottom for tabs so snapping works exactly
  },
  
  // Top Headers
  topBar: {
    position: 'absolute', top: 50, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', zIndex: 10,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 20
  },
  tabTextActive: {
    fontSize: 18, color: '#fff', fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  tabTextInactive: {
    fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  tabTextSeparator: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)', marginHorizontal: -10,
  },
  searchIcon: {
    position: 'absolute', right: 10, margin: 0
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  commentsSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '75%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 13, fontWeight: 'bold',
  },
  closeButtonAbsolute: {
    position: 'absolute', right: 10, top: 10,
  },
  commentsList: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 15,
  },
  commentRow: {
    flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start'
  },
  commentAvatar: {
    marginRight: 10,
  },
  replyRow: {
    flexDirection: 'row', 
    marginTop: 15,
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1, marginRight: 10
  },
  commentUserRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 2
  },
  commentUser: {
    fontSize: 12, color: '#888', fontWeight: '600'
  },
  commentText: {
    fontSize: 14, lineHeight: 20,
  },
  commentTime: {
    color: '#888', fontSize: 12,
  },
  viewRepliesText: {
    fontSize: 12, marginTop: 5, fontWeight: '600', alignItems: 'center'
  },
  commentLikeContainer: {
    alignItems: 'center', width: 40,
  },
  commentLikeCount: {
    fontSize: 11, color: '#888',
  },
  commentInputContainer: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center',
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1, backgroundColor: 'transparent', paddingHorizontal: 5, paddingVertical: 10, fontSize: 14,
  },
  
  shareSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 15,
  },
  shareSheetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  shareRowScroll: {
    marginBottom: 5,
  },
  shareRowContent: {
    paddingHorizontal: 15,
  },
  shareItemContainer: {
    alignItems: 'center',
    width: 65,
    marginRight: 10,
  },
  shareCircleBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  shareDivider: {
    height: 1,
    marginHorizontal: 15,
    marginVertical: 15,
  },
  cancelButtonOuter: {
    marginTop: 10,
    paddingVertical: 15,
    paddingBottom: 35, // For safe area and style
    alignItems: 'center',
    borderTopWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
  }
});

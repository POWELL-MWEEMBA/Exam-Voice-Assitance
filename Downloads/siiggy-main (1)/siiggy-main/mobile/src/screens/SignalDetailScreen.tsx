import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Chip, IconButton, Divider } from 'react-native-paper';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Signal } from '../types';
import { signalsApi } from '../services';
import { getMediaUrl } from '../services/networkHelper';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store';

const { width } = Dimensions.get('window');

interface SignalDetailScreenProps {
  navigation: any;
  route: {
    params: {
      signal: Signal;
    };
  };
}

export const SignalDetailScreen: React.FC<SignalDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const colors = useThemeColors();
  const { signal } = route.params;
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  // Check if this is the current user's signal
  const isOwnSignal = user?.id === signal.user.id;

  // Track view when screen loads
  useEffect(() => {
    if (!viewTracked) {
      signalsApi.trackView(signal.id).catch(() => {});
      setViewTracked(true);
    }
  }, [signal.id, viewTracked]);

  const handleShare = async () => {
    try {
      await signalsApi.trackShare(signal.id);
      await Share.share({
        message: `Check out this signal on SIIGGY: ${signal.context?.emoji} ${signal.context?.name}${
          signal.description ? ` - ${signal.description}` : ''
        }${signal.price ? ` - ${signal.price}` : ''}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDistance = (km?: number) => {
    if (!km) return '';
    if (km < 1) {
      return `${Math.round(km * 1000)}m away`;
    }
    return `${km.toFixed(1)}km away`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / 60000);
      return `Expires in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    }
    if (diffHours < 24) {
      return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleMessageSeller = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Chat', {
      otherUser: signal.user,
      signalId: signal.id,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Media Section */}
      <View style={[styles.mediaContainer, { backgroundColor: signal.media_type === 'video' ? '#000' : colors.background.default }]}>
        {/* Floating Back Button */}
        <TouchableOpacity 
          style={[styles.backButton, { top: Math.max(insets.top, 20), backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={() => navigation.goBack()}
        >
          <IconButton icon="arrow-left" iconColor="white" size={28} />
        </TouchableOpacity>

        {signal.media_type === 'video' && signal.media_url ? (
          <Pressable onPress={togglePlayPause} style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: getMediaUrl(signal.media_url) }}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={true}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              useNativeControls={false}
            />
            {!isPlaying && (
              <View style={styles.playOverlay}>
                <IconButton
                  icon="play-circle"
                  iconColor={colors.text.white}
                  size={64}
                  onPress={togglePlayPause}
                />
              </View>
            )}
          </Pressable>
        ) : signal.media_type === 'photo' && signal.media_url ? (
          <Image
            source={{ uri: getMediaUrl(signal.media_url) }}
            style={styles.media}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.media, styles.placeholderMedia]}>
            <Text style={styles.placeholderEmoji}>
              {signal.context?.emoji || '📍'}
            </Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Context Badge */}
        <View style={[styles.contextBadge, { backgroundColor: colors.background.light }]}>
          <Text style={styles.contextEmoji}>{signal.context?.emoji}</Text>
          <Text style={[styles.contextName, { color: colors.primary }]}>{signal.context?.name}</Text>
        </View>

        {/* Price */}
        {signal.price && <Text style={styles.price}>{signal.price}</Text>}

        {/* Description */}
        {signal.description && (
          <Text style={[styles.description, { color: colors.text.paragraph }]}>{signal.description}</Text>
        )}

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <Chip
            icon="map-marker"
            style={[styles.chip, { backgroundColor: colors.background.light }]}
            textStyle={[styles.chipText, { color: colors.text.light }]}
          >
            {formatDistance(signal.distance_km)}
          </Chip>
          <Chip icon="clock" style={[styles.chip, { backgroundColor: colors.background.light }]} textStyle={[styles.chipText, { color: colors.text.light }]}>
            {formatTimeAgo(signal.created_at)}
          </Chip>
        </View>

        {/* Expiry Info */}
        <View style={styles.expiryContainer}>
          <IconButton icon="timer-sand" size={20} iconColor={colors.text.light} />
          <Text style={styles.expiryText}>
            {formatExpiresAt(signal.expires_at)}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>
                {signal.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text.header }]}>{signal.user.name}</Text>
              <Text style={[styles.userLabel, { color: colors.text.light }]}>Posted by</Text>
            </View>
          </View>
        </View>

        {/* Analytics (if available) */}
        {signal.analytics && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.analyticsSection}>
              <Text style={styles.analyticsTitle}>Engagement</Text>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticItem}>
                  <IconButton icon="eye" size={20} iconColor={colors.primary} />
                  <Text style={styles.analyticValue}>
                    {signal.analytics.views}
                  </Text>
                  <Text style={styles.analyticLabel}>Views</Text>
                </View>
                <View style={styles.analyticItem}>
                  <IconButton
                    icon="cursor-pointer"
                    size={20}
                    iconColor={colors.primary}
                  />
                  <Text style={styles.analyticValue}>
                    {signal.analytics.taps}
                  </Text>
                  <Text style={styles.analyticLabel}>Taps</Text>
                </View>
                <View style={styles.analyticItem}>
                  <IconButton icon="share" size={20} iconColor={colors.primary} />
                  <Text style={styles.analyticValue}>
                    {signal.analytics.shares}
                  </Text>
                  <Text style={styles.analyticLabel}>Shares</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!isOwnSignal && (
            <Button
              mode="contained"
              icon="chat"
              onPress={handleMessageSeller}
              style={styles.messageButton}
              buttonColor={colors.primary}
              contentStyle={{ paddingVertical: 8 }}
            >
              Message Seller
            </Button>
          )}
          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleShare}
            style={styles.shareButton}
            buttonColor={colors.secondary}
            contentStyle={{ paddingVertical: 8 }}
          >
            Share Signal
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    zIndex: 100,
    borderRadius: 20,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholderMedia: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    padding: spacing.lg,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  contextEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  contextName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.background.gray,
  },
  chipText: {
    fontSize: 12,
    color: colors.text.light,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expiryText: {
    fontSize: 14,
    color: colors.text.light,
    marginLeft: -spacing.sm,
  },
  divider: {
    marginVertical: spacing.md,
  },
  userSection: {
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.header,
  },
  userLabel: {
    fontSize: 12,
    color: colors.text.light,
  },
  analyticsSection: {
    marginBottom: spacing.md,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.header,
    marginBottom: spacing.sm,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analyticItem: {
    alignItems: 'center',
  },
  analyticValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.header,
    marginTop: -spacing.xs,
  },
  analyticLabel: {
    fontSize: 12,
    color: colors.text.light,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  messageButton: {
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  shareButton: {
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
});

export default SignalDetailScreen;

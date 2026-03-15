import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, IconButton } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { Signal } from '../../../types';
import { colors, spacing, borderRadius } from '../../../theme';
import { getMediaUrl, formatDistance, formatTimeAgo } from '../../../shared/utils';
import { VendorAvatar, Badge, ActionButton } from '../../../shared/components';
import { SCREEN_WIDTH, SCREEN_HEIGHT, DOUBLE_TAP_DELAY } from '../../../constants';

/**
 * Full Screen Signal Card Component
 * SIIGGY-style immersive card for displaying signals
 */

interface FullScreenSignalCardProps {
  signal: Signal;
  isActive: boolean;
  onVendorPress: (signal: Signal) => void;
  onChatPress: (signal: Signal) => void;
  onLocationPress: (signal: Signal) => void;
  onSavePress: (signal: Signal) => void;
  onSharePress: (signal: Signal) => void;
  onInterestPress: (signal: Signal) => void;
  isSaved?: boolean;
}

export const FullScreenSignalCard: React.FC<FullScreenSignalCardProps> = ({
  signal,
  isActive,
  onVendorPress,
  onChatPress,
  onLocationPress,
  onSavePress,
  onSharePress,
  onInterestPress,
  isSaved = false,
}) => {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isActive]);

  const handleDoubleTap = () => {
    setIsLiked(true);
    onSavePress(signal);
    
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => setIsLiked(false), 800);
    });
  };

  let lastTap = 0;
  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    }
    lastTap = now;
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Media Background */}
      <View style={styles.mediaContainer}>
        {signal.media_type === 'video' && signal.media_url ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: getMediaUrl(signal.media_url) }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              isLooping
              isMuted={isMuted}
              shouldPlay={isActive}
            />
            <TouchableOpacity
              style={styles.muteButton}
              onPress={() => setIsMuted(!isMuted)}
            >
              <IconButton
                icon={isMuted ? 'volume-off' : 'volume-high'}
                iconColor={colors.text.white}
                size={24}
              />
            </TouchableOpacity>
          </>
        ) : (
          <Image
            source={{ 
              uri: getMediaUrl(signal.media_url || signal.thumbnail_url) || 
                   `https://via.placeholder.com/${SCREEN_WIDTH}x${SCREEN_HEIGHT}`
            }}
            style={styles.media}
            resizeMode="contain"
          />
        )}
        
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.4)']}
          style={styles.gradient}
          locations={[0, 0.7, 1]}
        />
      </View>

      {/* Double Tap Heart */}
      {isLiked && (
        <Animated.View style={[styles.likeHeart, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.likeHeartIcon}>❤️</Text>
        </Animated.View>
      )}

      {/* Top Bar - Context & Price */}
      <View style={styles.topBar}>
        <Badge text={signal.context?.name || ''} emoji={signal.context?.emoji} />
        {signal.price && <Badge text={signal.price} variant="price" />}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <ActionButton icon="message-text" label="Chat" onPress={() => onChatPress(signal)} />
        <ActionButton 
          icon="map-marker" 
          label={formatDistance(signal.distance_km)} 
          onPress={() => onLocationPress(signal)} 
        />
        <ActionButton 
          icon={isSaved ? 'bookmark' : 'bookmark-outline'} 
          label="Save" 
          onPress={() => onSavePress(signal)}
          color={isSaved ? colors.primary : colors.text.white}
        />
        <ActionButton icon="share-variant" label="Share" onPress={() => onSharePress(signal)} />
      </View>

      {/* Bottom Bar - Vendor Info */}
      <View style={styles.bottomBar}>
        <View style={styles.vendorAvatar}>
          <VendorAvatar
            name={signal.user?.name || 'Vendor'}
            isVerified={signal.user?.is_verified}
            onPress={() => onVendorPress(signal)}
          />
        </View>

        <View style={styles.signalInfo}>
          <TouchableOpacity onPress={() => onVendorPress(signal)}>
            <Text style={styles.vendorName}>
              {signal.user?.name || 'Vendor'}
              {signal.user?.is_verified && ' ✓'}
            </Text>
          </TouchableOpacity>
          
          {signal.description && (
            <Text style={styles.description} numberOfLines={2}>
              {signal.description}
            </Text>
          )}
          
          <Text style={styles.metadata}>
            {formatTimeAgo(signal.created_at)}
            {signal.distance_km && ` • ${formatDistance(signal.distance_km)} away`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={() => onInterestPress(signal)}
        >
          <Text style={styles.primaryActionIcon}>🏃</Text>
          <Text style={styles.primaryActionText}>I'm Coming</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    backgroundColor: '#000',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  muteButton: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
  },
  likeHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    zIndex: 100,
  },
  likeHeartIcon: {
    fontSize: 100,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  actionButtons: {
    position: 'absolute',
    right: spacing.md,
    bottom: 200,
    alignItems: 'center',
    gap: spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl + 20,
  },
  vendorAvatar: {
    marginBottom: spacing.md,
  },
  signalInfo: {
    marginBottom: spacing.md,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 14,
    color: colors.text.white,
    lineHeight: 20,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metadata: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryActionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.white,
    letterSpacing: 0.5,
  },
});

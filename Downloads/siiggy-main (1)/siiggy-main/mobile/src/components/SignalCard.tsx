import React from 'react';
import { View, Image, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Text, Chip } from 'react-native-paper';
import { Signal } from '../types';
import { colors, spacing, borderRadius } from '../theme';
import { getMediaUrl } from '../services/networkHelper';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 3) / 2;

interface SignalCardProps {
  signal: Signal;
  onPress: (signal: Signal) => void;
  onTap?: (signal: Signal) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onPress, onTap }) => {
  const handlePress = () => {
    onTap?.(signal);
    onPress(signal);
  };

  const formatDistance = (km?: number) => {
    if (!km) return '';
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
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

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.card}>
        {/* Image with gradient overlay */}
        <View style={styles.imageContainer}>
          {signal.thumbnail_url ? (
            <Image
              source={{ uri: getMediaUrl(signal.thumbnail_url) }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text style={styles.placeholderEmoji}>
                {signal.context?.emoji || '📍'}
              </Text>
            </View>
          )}
          
          {/* Dark gradient overlay for better text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
          
          {/* Video indicator */}
          {signal.media_type === 'video' && (
            <View style={styles.videoIndicator}>
              <Text style={styles.videoIcon}>▶</Text>
            </View>
          )}
          
          {/* Distance badge - top right */}
          {signal.distance_km !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                📍 {formatDistance(signal.distance_km)}
              </Text>
            </View>
          )}
          
          {/* Overlay content on image */}
          <View style={styles.overlayContent}>
            {/* Context with emoji */}
            <View style={styles.contextBadge}>
              <Text style={styles.contextEmoji}>{signal.context?.emoji}</Text>
              <Text style={styles.contextName} numberOfLines={1}>
                {signal.context?.name}
              </Text>
            </View>
            
            {/* Price - prominent */}
            {signal.price && (
              <Text style={styles.price}>{signal.price}</Text>
            )}
          </View>
        </View>

        {/* Bottom content area */}
        {signal.description && (
          <View style={styles.bottomContent}>
            <Text style={styles.description} numberOfLines={2}>
              {signal.description}
            </Text>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(signal.created_at)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.background.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH * 1.2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  placeholderImage: {
    backgroundColor: colors.background.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  videoIndicator: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  videoIcon: {
    color: colors.text.white,
    fontSize: 14,
    marginLeft: 2,
  },
  distanceBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  distanceText: {
    color: colors.text.white,
    fontSize: 10,
    fontWeight: '700',
  },
  overlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  contextEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  contextName: {
    fontSize: 11,
    color: colors.text.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomContent: {
    padding: spacing.sm,
    backgroundColor: colors.background.default,
  },
  description: {
    fontSize: 12,
    color: colors.text.paragraph,
    marginBottom: 4,
    lineHeight: 16,
  },
  timeAgo: {
    fontSize: 10,
    color: colors.text.light,
    fontWeight: '500',
  },
});

export default SignalCard;

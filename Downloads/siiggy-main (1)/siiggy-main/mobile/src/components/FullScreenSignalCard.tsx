import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Avatar, IconButton } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');
const BOTTOM_TAB_HEIGHT = 80;

interface FullScreenSignalCardProps {
  signal: any;
  isActive: boolean;
  isOwnSignal?: boolean;
  onVendorPress: (signal: any) => void;
  onChatPress: (signal: any) => void;
  onLocationPress: (signal: any) => void;
  onSavePress: (signal: any) => void;
  onSharePress: (signal: any) => void;
  onInterestPress: (signal: any) => void;
  onSoundPress?: (signal: any) => void;
  isSaved?: boolean;
}

export const FullScreenSignalCard: React.FC<FullScreenSignalCardProps> = ({
  signal,
  isActive,
  isOwnSignal = false,
  onVendorPress,
  onChatPress,
  onLocationPress,
  onSavePress,
  onSharePress,
  onInterestPress,
  onSoundPress,
  isSaved = false,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [isLiked, setIsLiked] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Animations
  const playIconOpacity = useRef(new Animated.Value(0)).current;
  const playIconScale = useRef(new Animated.Value(1)).current;
  const musicDiscRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsPlaying(isActive);
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.playAsync();
        startMusicDiscAnimation();
      } else {
        videoRef.current.pauseAsync();
        musicDiscRotate.stopAnimation();
      }
    }
  }, [isPlaying]);

  const startMusicDiscAnimation = () => {
    Animated.loop(
      Animated.timing(musicDiscRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const showPlayPauseAnimation = (paused: boolean) => {
    playIconScale.setValue(paused ? 1.5 : 0.8);
    playIconOpacity.setValue(1);
    
    if (!paused) {
      Animated.timing(playIconOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  let lastTap = 0;
  const handlePress = (e: GestureResponderEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap
      handleDoubleTap(e);
      lastTap = 0; // Reset
    } else {
      // Single tap after a delay (or just toggle immediately if we accept accidental double taps)
      setTimeout(() => {
        if (Date.now() - lastTap >= DOUBLE_TAP_DELAY && lastTap !== 0) {
           const nextState = !isPlaying;
           setIsPlaying(nextState);
           showPlayPauseAnimation(nextState);
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap = now;
  };

  const handleDoubleTap = (e: GestureResponderEvent) => {
    if (!isLiked) setIsLiked(true);

    const { pageX, pageY } = e.nativeEvent;
    
    const newHeart = { id: Date.now(), x: pageX - 50, y: pageY - 50 }; // Center heart
    setHearts([...hearts, newHeart]);

    // Remove heart after animation (1s)
    setTimeout(() => {
      setHearts((current) => current.filter((h) => h.id !== newHeart.id));
    }, 1000);
  };

  const spin = musicDiscRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.mediaContainer}>
        {signal.media_type === 'video' && signal.media_url ? (
          <Video
            ref={videoRef}
            source={{ uri: signal.media_url }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isPlaying}
          />
        ) : (
          <Image
            source={{ uri: signal.media_url || signal.thumbnail_url || `https://via.placeholder.com/${width}x${height}` }}
            style={styles.media}
            resizeMode="cover"
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        
        {/* Play Icon Centered */}
        <Animated.View style={[styles.playPauseContainer, { opacity: playIconOpacity, transform: [{ scale: playIconScale }] }]}>
           <IconButton icon="play" size={80} iconColor="rgba(255,255,255,0.7)" />
        </Animated.View>

        {/* Floating Hearts from Double Tap */}
        {hearts.map((heart) => (
          <FloatingHeart key={heart.id} x={heart.x} y={heart.y} />
        ))}
        
      </Pressable>

      {/* Action Buttons - Right Side Vertical Stack */}
      <View style={styles.actionButtons}>
        <View style={styles.vendorAvatarContainer}>
          <TouchableOpacity style={styles.vendorAvatar} onPress={() => onVendorPress(signal)}>
            <Avatar.Text size={48} label={signal.user?.name?.[0]?.toUpperCase() || 'S'} style={{ backgroundColor: colors.primary, borderWidth: 1, borderColor: '#fff' }} />
          </TouchableOpacity>
          {!isOwnSignal && (
            <TouchableOpacity style={styles.followBadge}>
              <Text style={styles.followBadgeText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => setIsLiked(!isLiked)}>
          <IconButton icon={isLiked ? "heart" : "heart-outline"} iconColor={isLiked ? colors.primary : '#fff'} size={32} style={styles.iconButtonAction} />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onChatPress(signal)}>
          <IconButton icon="comment-processing" iconColor="#fff" size={32} style={styles.iconButtonAction} />
          <Text style={styles.actionText}>234</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => onLocationPress(signal)}>
          <IconButton icon="map-marker" iconColor="#fff" size={32} style={styles.iconButtonAction} />
          <Text style={styles.actionText}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onSharePress(signal)}>
          <IconButton icon="share" iconColor="#fff" size={32} style={styles.iconButtonAction} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <Animated.View style={{ transform: [{ rotate: spin }], marginTop: 20 }}>
          <TouchableOpacity style={styles.soundDiscContainer} onPress={() => onSoundPress && onSoundPress(signal)}>
            <Image source={{uri: 'https://i.pravatar.cc/100'}} style={styles.soundDisc} />
            <IconButton icon="music" iconColor="#fff" size={16} style={{position: 'absolute', opacity: 0.8}} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Info - Username, Tags, Music Track */}
      <View style={styles.bottomBar}>
        <View style={styles.vendorAndInterestRow}>
           <Text style={styles.vendorName}>
             @{signal.user?.name?.toLowerCase().replace(' ', '') || 'siggy_user'}
           </Text>
           {signal.context && (
             <Text style={styles.locationActive}>{signal.context.emoji} {signal.context.name}</Text>
           )}
        </View>
        <Text style={styles.description}>
          {signal.price > 0 && <Text style={{fontWeight: 'bold', color: '#00ffcc'}}>${signal.price} </Text>}
          {signal.description} #sigg #trending
        </Text>
        
        <View style={styles.musicTrackContainer}>
           <IconButton icon="music-note" iconColor="#fff" size={16} style={{margin: 0, padding: 0, width: 16, height: 16}} />
           <Text style={styles.musicTrackText}> Original Sound - SIGG Music</Text>
        </View>
      </View>
    </View>
  );
};

// Sub-component for individual floating hearts
const FloatingHeart = ({ x, y }: { x: number; y: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] });
  const opacity = anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.5, 1.2, 1.5] });
  const rotate = (Math.random() * 40 - 20) + 'deg';

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: x,
        transform: [{ translateY }, { scale }, { rotate }],
        opacity,
        zIndex: 100,
      }}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 80, textShadowColor: '#000', textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 } }}>❤️</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width, height: height - BOTTOM_TAB_HEIGHT, backgroundColor: '#000' },
  mediaContainer: { flex: 1, backgroundColor: '#000' },
  media: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
  
  playPauseContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    zIndex: 10,
  },

  actionButtons: {
    position: 'absolute', right: 10, bottom: 20, alignItems: 'center', gap: 10,
    zIndex: 2,
  },
  vendorAvatarContainer: { alignItems: 'center', marginBottom: 15 },
  vendorAvatar: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  followBadge: {
    position: 'absolute', bottom: -8, width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff'
  },
  followBadgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  actionButton: { alignItems: 'center', marginBottom: 5 },
  iconButtonAction: { margin: 0, padding: 0, width: 40, height: 40 },
  actionText: { fontSize: 13, color: '#fff', marginTop: -2, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  
  soundDiscContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#333',
    justifyContent: 'center', alignItems: 'center', padding: 5, borderWidth: 10, borderColor: '#111',
  },
  soundDisc: {
    width: 30, height: 30, borderRadius: 15,
  },

  bottomBar: {
    position: 'absolute', bottom: 10, left: 15, right: 80,
    zIndex: 2,
  },
  vendorName: {
    fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  description: {
    fontSize: 14, color: '#fff', marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  musicTrackContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  musicTrackText: {
    fontSize: 13, color: '#fff', fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  
  vendorAndInterestRow: {
    flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 5,
  },
  locationActive: { color: colors.primary, marginLeft: 10, fontSize: 14, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
});

export default FullScreenSignalCard;

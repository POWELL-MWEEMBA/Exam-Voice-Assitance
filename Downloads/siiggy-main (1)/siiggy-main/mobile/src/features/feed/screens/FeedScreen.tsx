import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { IconButton } from 'react-native-paper';
import { FullScreenSignalCard } from '../components/FullScreenSignalCard';
import { LoadingState, EmptyState } from '../../../shared/components';
import { useLocation, useFeed, useSavedSignals, useSignalViewTracking } from '../../../shared/hooks';
import { colors } from '../../../theme';
import { SCREEN_HEIGHT } from '../../../constants';
import { Signal } from '../../../types';
import { useAuthStore } from '../../../store';

/**
 * Feed Screen
 * Main vertical feed with TikTok-style signal cards
 */

interface FeedScreenProps {
  navigation: any;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { isAuthenticated } = useAuthStore();
  
  // Custom hooks for business logic
  const { location, isLocationAvailable } = useLocation();
  const { signals, isLoading, refreshing, loadSignals, refreshSignals } = useFeed();
  const { isSaved, toggleSave } = useSavedSignals();
  const { viewabilityConfig, onViewableItemsChanged } = useSignalViewTracking(signals);

  useEffect(() => {
    if (isLocationAvailable) {
      loadSignals();
    }
  }, [isLocationAvailable]);

  // Navigation handlers
  const handleVendorPress = (signal: Signal) => {
    navigation.navigate('Profile', { userId: signal.user?.id });
  };

  const handleChatPress = (signal: Signal) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to chat with vendors');
      return;
    }
    Alert.alert('Chat', `Starting chat with ${signal.user?.name}`);
  };

  const handleLocationPress = (signal: Signal) => {
    Alert.alert('Location', `Show ${signal.user?.name} on map`);
  };

  const handleSharePress = async (signal: Signal) => {
    try {
      await Share.share({
        message: `Check out this signal: ${signal.description}\n${signal.price || ''}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleInterestPress = (signal: Signal) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to express interest');
      return;
    }
    Alert.alert(
      'Great! 🎉',
      `We've notified ${signal.user?.name} that you're coming!`,
      [
        { text: 'Chat Now', onPress: () => handleChatPress(signal) },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const renderSignal = ({ item, index }: { item: Signal; index: number }) => {
    const isActive = index === activeIndex;

    return (
      <FullScreenSignalCard
        signal={item}
        isActive={isActive}
        onVendorPress={handleVendorPress}
        onChatPress={handleChatPress}
        onLocationPress={handleLocationPress}
        onSavePress={() => toggleSave(item.id)}
        onSharePress={handleSharePress}
        onInterestPress={handleInterestPress}
        isSaved={isSaved(item.id)}
      />
    );
  };

  if (isLoading && signals.length === 0) {
    return <LoadingState message="Finding signals near you..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={signals}
        renderItem={renderSignal}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        refreshing={refreshing}
        onRefresh={refreshSignals}
        ListEmptyComponent={
          <EmptyState
            emoji="📡"
            title="No Signals Nearby"
            subtitle="Be the first to share what you have!"
          />
        }
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />
      
      {isAuthenticated && (
        <TouchableOpacity
          style={styles.postButton}
          onPress={() => navigation.navigate('PostSignal')}
          activeOpacity={0.8}
        >
          <IconButton
            icon="plus"
            iconColor={colors.text.white}
            size={28}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  postButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

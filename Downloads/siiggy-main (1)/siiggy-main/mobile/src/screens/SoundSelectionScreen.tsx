import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { IconButton, Searchbar, List, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, spacing } from '../theme';

interface Sound {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  isFavorite: boolean;
  audioUrl?: string;
}

const DUMMY_SOUNDS: Sound[] = [
  { id: '1', title: 'Trending Beat', artist: 'Producer X', duration: '0:15', thumbnail: 'https://picsum.photos/id/200/100', isFavorite: false, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Summer Vibes', artist: 'Sunny Mike', duration: '0:30', thumbnail: 'https://picsum.photos/id/201/100', isFavorite: true, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Night Drive', artist: 'Lo-Fi Girl', duration: '1:00', thumbnail: 'https://picsum.photos/id/202/100', isFavorite: false, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'Zambian Rhythms', artist: 'Local Star', duration: '0:45', thumbnail: 'https://picsum.photos/id/203/100', isFavorite: true, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: '5', title: 'Market Hustle', artist: 'Street Ambience', duration: '0:15', thumbnail: 'https://picsum.photos/id/204/100', isFavorite: false, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: '6', title: 'Afrobeats Flow', artist: 'Wizkid Style', duration: '0:30', thumbnail: 'https://picsum.photos/id/205/100', isFavorite: false, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
];

const CATEGORIES = ['Trending', 'Discover', 'Favorites', 'Recently used', 'Afro', 'Pop', 'Hip-Hop'];

export const SoundSelectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundObject) {
        soundObject.unloadAsync().catch(() => {});
      }
    };
  }, [soundObject]);

  const playSound = async (audioUrl: string) => {
    try {
      // Unload previous sound if any
      if (soundObject) {
        try {
          const status = await soundObject.getStatusAsync();
          if (status.isLoaded) {
            await soundObject.stopAsync();
          }
          await soundObject.unloadAsync();
        } catch (e) {}
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSoundObject(sound);
    } catch (error) {
      console.error('Error playing sound', error);
    }
  };

  const handleSelectSound = async (item: Sound) => {
    setSelectedSoundId(item.id);
    if (item.audioUrl) {
      playSound(item.audioUrl);
    }
  };

  const handleConfirm = async (item: Sound) => {
    if (soundObject) {
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded) {
        await soundObject.stopAsync();
      }
    }
    navigation.navigate({
      name: 'PostSignal',
      params: { selectedSound: item },
      merge: true,
    });
  };

  const renderSoundItem = ({ item }: { item: Sound }) => (
    <TouchableOpacity 
      style={[
        styles.soundItem, 
        { borderBottomColor: colors.border },
        selectedSoundId === item.id && [styles.selectedSound, { backgroundColor: colors.background.light }]
      ]}
      onPress={() => handleSelectSound(item)}
    >
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <IconButton icon="play" iconColor="#fff" size={24} style={styles.playIcon} />
      </View>
      <View style={styles.soundInfo}>
        <Text style={[styles.soundTitle, { color: colors.text.header }]}>{item.title}</Text>
        <Text style={[styles.soundArtist, { color: colors.text.light }]}>{item.artist} • {item.duration}</Text>
      </View>
      <TouchableOpacity onPress={() => {}}>
         <IconButton 
           icon={item.isFavorite ? "bookmark" : "bookmark-outline"} 
           iconColor={item.isFavorite ? colors.primary : "#888"} 
           size={24} 
         />
      </TouchableOpacity>
      {selectedSoundId === item.id && (
        <TouchableOpacity 
          style={styles.useButton}
          onPress={() => handleConfirm(item)}
        >
          <IconButton icon="check" iconColor={colors.background.default} size={20} style={{ backgroundColor: colors.primary, margin: 0 }} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background.default }]}>
      <View style={styles.header}>
        <IconButton icon="close" iconColor={colors.text.header} size={28} onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: colors.text.header }]}>Sounds</Text>
        <View style={{ width: 48 }} />
      </View>

      <Searchbar
        placeholder="Search sounds"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.background.light, borderColor: colors.border }]}
        inputStyle={{ color: colors.text.header }}
        iconColor={colors.text.light}
        placeholderTextColor={colors.text.light}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[styles.categoryChip, { backgroundColor: colors.background.light, borderColor: colors.border }]}>
            <Text style={[styles.categoryText, { color: colors.text.header }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.header }]}>Playlist</Text>
        <TouchableOpacity>
          <Text style={[styles.seeMore, { color: colors.text.light }]}>All {'>'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={DUMMY_SOUNDS}
        renderItem={renderSoundItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 0,
    height: 45,
    borderWidth: 1,
  },
  categoriesScroll: {
    paddingLeft: 16,
    marginBottom: 20,
    maxHeight: 40,
  },
  categoryChip: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeMore: {
    color: '#888',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  selectedSound: {
    borderRadius: 8,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  soundInfo: {
    flex: 1,
    marginLeft: 12,
  },
  soundTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  soundArtist: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  useButton: {
    marginLeft: 10,
  },
});

export default SoundSelectionScreen;

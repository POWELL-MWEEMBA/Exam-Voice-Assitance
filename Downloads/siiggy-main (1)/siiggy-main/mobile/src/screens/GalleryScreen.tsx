import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors, useThemeColors } from '../theme';

const { width } = Dimensions.get('window');
const colWidth = width / 3;

interface GalleryScreenProps {
  navigation: any;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ navigation }) => {
  const colors = useThemeColors();
  // Dummy data representing gallery items mimicking Screenshot 5
  // The first item (video) spans 1 cell in the grid but is larger visually or just a list of items where the first is a video.
  // Actually, screenshot 5 shows a 3-column grid. The first item has a play icon. All items are perfect squares.
  const galleryItems = [
    { id: '1', type: 'video', url: 'https://images.unsplash.com/photo-1542044896530-05d3c054e17b?w=200' },
    { id: '2', type: 'photo', url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=200' },
    { id: '3', type: 'photo', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200' },
    { id: '4', type: 'photo', url: 'https://images.unsplash.com/photo-1506744626753-1fa30f37730e?w=200' },
    { id: '5', type: 'photo', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200' },
    { id: '6', type: 'photo', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=200' },
    { id: '7', type: 'photo', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200' },
    { id: '8', type: 'photo', url: 'https://images.unsplash.com/photo-1470071131384-001b85755b36?w=200' },
    { id: '9', type: 'photo', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200' },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.gridItem}>
      <Image source={{ uri: item.url }} style={styles.gridImage} />
      {item.type === 'video' && (
        <View style={styles.playIconOverlay}>
           <IconButton icon="play" iconColor="white" size={30} style={{margin:0}} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.background.default, borderBottomColor: colors.border, paddingTop: 50 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <IconButton icon="chevron-left" iconColor={colors.text.header} size={32} style={{ margin: 0 }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.header }]}>Gallery</Text>
        <TouchableOpacity style={styles.cameraButton}>
          <IconButton icon="camera-outline" iconColor={colors.text.header} size={24} style={{ margin: 0 }} />
        </TouchableOpacity>
      </View>

      {/* Main Grid */}
      <FlatList
        data={galleryItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <IconButton icon="video" iconColor="white" size={24} style={{ margin: 0, marginRight: 8 }} />
        <Text style={styles.floatingButtonText}>Use this sound</Text>
      </TouchableOpacity>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  closeButton: {
    paddingLeft: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraButton: {
    paddingRight: 15,
  },
  gridItem: {
    width: colWidth,
    height: colWidth * 1.2,
    borderWidth: 1,
    borderColor: 'white',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GalleryScreen;

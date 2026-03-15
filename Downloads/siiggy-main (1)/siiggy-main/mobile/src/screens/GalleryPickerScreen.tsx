import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { IconButton } from 'react-native-paper';

const { width } = Dimensions.get('window');

interface GalleryPickerScreenProps {
  navigation: any;
}

export const GalleryPickerScreen: React.FC<GalleryPickerScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Templates');

  // Dummy data representing gallery items
  const photos = [
    'https://images.unsplash.com/photo-1542044896530-05d3c054e17b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <IconButton icon="close" iconColor="white" size={24} style={{ margin: 0 }} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>My 2020</Text>
          <Text style={styles.subtitle}>Upload up to 8 photos</Text>
        </View>
      </View>

      {/* Main Content - Horizontal Carousel */}
      <View style={styles.mainContent}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
           <Image source={{uri: photos[0]}} style={styles.sideImage} />
           <Image source={{uri: photos[1]}} style={styles.mainImage} />
           <Image source={{uri: photos[2]}} style={styles.sideImage} />
        </ScrollView>
        <Text style={styles.counterText}>3/22</Text>

        <TouchableOpacity style={styles.selectButton} onPress={() => navigation.goBack()}>
          <Text style={styles.selectButtonText}>Select photos</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Tabs */}
      <View style={styles.bottomControls}>
        <View style={styles.tabsRow}>
           {['60s', '15s', 'Templates'].map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
                 <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab}
                 </Text>
                 {activeTab === tab && <View style={styles.activeDot} />}
              </TouchableOpacity>
           ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  header: {
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'serif',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    alignItems: 'center',
    paddingHorizontal: 50,
    gap: 15,
  },
  mainImage: {
    width: width * 0.65,
    height: width * 0.9,
    borderRadius: 8,
  },
  sideImage: {
    width: width * 0.35,
    height: width * 0.5,
    borderRadius: 8,
    opacity: 0.8,
  },
  counterText: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  selectButton: {
    backgroundColor: '#ff9500',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '70%',
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomControls: {
    paddingBottom: 40,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabText: {
    color: '#8e8e93',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginTop: 6,
  },
});

export default GalleryPickerScreen;

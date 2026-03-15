import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity, ScrollView, Modal, Platform, RefreshControl, TextInput, Alert } from 'react-native';
import { IconButton, Avatar, Divider, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useThemeStore } from '../store';
import { colors, lightColors, darkColors, useThemeColors } from '../theme';
import { signalsApi } from '../services';
import { Signal } from '../types';
import { useFocusEffect } from '@react-navigation/native';

import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const DUMMY_VIDEOS = Array.from({ length: 15 }).map((_, i) => ({
  id: String(i),
  thumbnail: `https://picsum.photos/id/${100 + i}/300/400`,
  views: Math.floor(Math.random() * 1000) + 'K',
}));

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user, logout } = useAuthStore();
  const { themeMode, setThemeMode } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const [mySignals, setMySignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const [tempUsername, setTempUsername] = useState(user?.name?.toLowerCase().replace(' ', '') || '');
  const [bio, setBio] = useState('Local supply enthusiast 🚀');
  
  // Settings Toggles
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifications, setNotifications] = useState({ likes: true, comments: true, followers: false });
  const [dataSaver, setDataSaver] = useState(false);
  const [restrictedMode, setRestrictedMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [reportText, setReportText] = useState('');

  const loadMySignals = async () => {
    try {
      setLoading(true);
      const response = await signalsApi.getMySignals();
      setMySignals(response.data.data);
    } catch (error) {
      console.error('Failed to load my signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMySignals();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMySignals();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await logout();
    } catch (error) {
    }
  };

  const handleSettingPress = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSetting(label);
  };

  const handleUpdateProfile = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditModalVisible(false);
    // In a real app, we'd call an API here. Let's just update local store/state
    if (user) {
      // simulate update
    }
  };

  const renderVideoItem = ({ item }: { item: Signal }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image 
        source={{ uri: (item.thumbnail_url || item.media_url || 'https://via.placeholder.com/300x400') }} 
        style={styles.gridImage} 
      />
      <View style={styles.viewsBadge}>
        <IconButton icon="play-outline" size={12} iconColor="#fff" style={{ margin: 0, width: 14, height: 14 }} />
        <Text style={styles.viewsText}>{item.analytics?.views || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  const SETTINGS_SECTIONS = [
    {
      title: 'ACCOUNT',
      items: [
        { icon: 'account-outline', label: 'Manage my account' },
        { icon: 'lock-outline', label: 'Privacy and safety' },
        { icon: 'video-outline', label: 'Content preferences' },
        { icon: 'share-outline', label: 'Share profile' },
        { icon: 'qrcode', label: 'SIIGGY Code' },
      ]
    },
    {
      title: 'GENERAL',
      items: [
        { icon: 'bell-outline', label: 'Push notifications' },
        { icon: 'palette-outline', label: 'Display' },
        { icon: 'format-font', label: 'Language' },
        { icon: 'umbrella-outline', label: 'Digital Wellbeing' },
        { icon: 'human-handsup', label: 'Accessibility' },
        { icon: 'water-outline', label: 'Data Saver' },
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: 'pencil-outline', label: 'Report a problem' },
        { icon: 'help-circle-outline', label: 'Help Center' },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top > 0 ? insets.top + 10 : 50,
        backgroundColor: colors.background.default,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }]}>
        <IconButton icon="account-plus-outline" size={28} iconColor={colors.text.header} />
        <TouchableOpacity style={styles.headerCenter}>
          <Text style={[styles.headerUsername, { color: colors.text.header }]}>@{user?.name?.toLowerCase().replace(' ', '') || 'guest'}</Text>
          <IconButton icon="menu-down" size={20} iconColor={colors.text.header} style={{ margin: 0 }} />
        </TouchableOpacity>
        <IconButton icon="dots-horizontal" size={28} iconColor={colors.text.header} onPress={() => setSettingsVisible(true)} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Row (Avatar + Stats) */}
        <View style={styles.profileTopRow}>
          <View style={styles.avatarContainer}>
             <Avatar.Text size={80} label={user?.name?.[0]?.toUpperCase() || 'S'} style={[styles.avatar, { backgroundColor: colors.primary }]} />
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.header }]}>{mySignals.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.light }]}>Signals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.header }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.text.light }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.header }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.text.light }]}>Likes</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.background.light, borderColor: colors.border }]} 
            onPress={() => { setEditModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.editButtonText, { color: colors.text.header }]}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bookmarkButton, { backgroundColor: colors.background.light, borderColor: colors.border }]}>
            <IconButton icon="bookmark-outline" size={20} iconColor={colors.text.header} style={{margin:0}} />
          </TouchableOpacity>
        </View>
          
        <View style={styles.bioContainer}>
           <Text style={[styles.bioText, { color: colors.text.paragraph }]}>{bio}</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'videos' && { borderBottomColor: colors.text.header }]} 
            onPress={() => setActiveTab('videos')}
          >
             <IconButton 
               icon="view-grid-outline" 
               size={26} 
               iconColor={activeTab === 'videos' ? colors.text.header : colors.text.light} 
             />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'liked' && { borderBottomColor: colors.text.header }]} 
            onPress={() => setActiveTab('liked')}
          >
             <IconButton 
               icon="heart-broken-outline" 
               size={26} 
               iconColor={activeTab === 'liked' ? colors.text.header : colors.text.light} 
             />
          </TouchableOpacity>
        </View>

        {/* Video Grid */}
        <FlatList
          data={activeTab === 'videos' ? mySignals : []}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVideoItem}
          scrollEnabled={false} // Since it's inside a ScrollView
          columnWrapperStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.default }]}>
              <IconButton icon={activeTab === 'videos' ? 'video-plus-outline' : 'heart-outline'} size={48} iconColor={colors.text.light} />
              <Text style={[styles.emptyText, { color: colors.text.light }]}>
                {activeTab === 'videos' ? "No signals yet." : "No liked signals."}
              </Text>
            </View>
          }
        />
        <View style={{height: 100}}/>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettingsVisible(false)}>
        <View style={[styles.settingsModalContainer, { backgroundColor: colors.background.default }]}>
            <View style={[styles.settingsHeader, { 
              paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 20,
              backgroundColor: colors.background.default,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }]}>
              {selectedSetting ? (
                <IconButton icon="chevron-left" size={30} iconColor={colors.text.header} onPress={() => setSelectedSetting(null)} />
              ) : (
                <IconButton icon="chevron-left" size={30} iconColor={colors.text.header} onPress={() => setSettingsVisible(false)} />
              )}
              <Text style={[styles.settingsHeaderTitle, { color: colors.text.header }]}>{selectedSetting || 'Privacy and settings'}</Text>
              <View style={{width: 48}} />
            </View>
            <Divider style={{backgroundColor: colors.border}} />

            {!selectedSetting ? (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.settingsScrollView}>
                 {SETTINGS_SECTIONS.map((section, idx) => (
                   <View key={idx}>
                     <Text style={[styles.settingsSectionTitle, { color: colors.text.light }]}>{section.title}</Text>
                     {section.items.map((item, idxx) => (
                       <TouchableOpacity key={idxx} style={styles.settingsItem} onPress={() => handleSettingPress(item.label)}>
                          <View style={styles.settingsItemLeft}>
                             <IconButton icon={item.icon} size={24} iconColor={colors.text.light} style={{margin:0, marginRight: 15}} />
                             <Text style={[styles.settingsItemLabel, { color: colors.text.header }]}>{item.label}</Text>
                          </View>
                          <IconButton icon="chevron-right" size={24} iconColor={colors.border} style={{margin:0}} />
                       </TouchableOpacity>
                     ))}
                     {idx < SETTINGS_SECTIONS.length - 1 && <Divider style={[styles.settingsDivider, { backgroundColor: colors.border }]} />}
                   </View>
                 ))}
                 
                 <TouchableOpacity style={[styles.settingsItem, { marginTop: 20 }]} onPress={handleLogout}>
                   <View style={styles.settingsItemLeft}>
                     <IconButton icon="logout" size={24} iconColor="#ff4d4d" style={{margin:0}} />
                     <Text style={[styles.settingsItemLabel, { color: '#ff4d4d', marginLeft: 15 }]}>Log out</Text>
                   </View>
                 </TouchableOpacity>
                 
                 <View style={{ height: 100 }} />
              </ScrollView>
            ) : (
              <ScrollView style={styles.settingsScrollView} contentContainerStyle={{ padding: 20 }}>
                {selectedSetting === 'Privacy and safety' ? (
                  <View style={styles.detailContainer}>
                    <Text style={[styles.detailTitle, { color: colors.text.header }]}>Privacy</Text>
                    <View style={[styles.settingsGroup, { backgroundColor: colors.background.light }]}>
                      <View style={[styles.settingToggleRow, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.settingRowLabel, { color: colors.text.header }]}>Private account</Text>
                          <Text style={[styles.settingRowSub, { color: colors.text.light }]}>Only approved users can see your signals</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => { setIsPrivate(!isPrivate); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                          style={[styles.toggleBase, isPrivate && { backgroundColor: colors.primary }]}
                        >
                          <View style={[styles.toggleCircle, isPrivate && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={[styles.mockSettingRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.mockSettingLabel, { color: colors.text.header }]}>Blocked accounts</Text>
                        <Text style={[styles.mockValue, { color: colors.text.light }]}>0</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : selectedSetting === 'Manage my account' ? (
                  <View style={styles.detailContainer}>
                    <Text style={[styles.detailTitle, { color: colors.text.header }]}>Account Info</Text>
                    <View style={[styles.settingsGroup, { backgroundColor: colors.background.light }]}>
                      <TouchableOpacity style={[styles.mockSettingRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.mockSettingLabel, { color: colors.text.header }]}>Phone number</Text>
                        <Text style={[styles.mockValue, { color: colors.text.light }]}>+260 97****123</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.mockSettingRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.mockSettingLabel, { color: colors.text.header }]}>Email</Text>
                        <Text style={[styles.mockValue, { color: colors.text.light }]}>{user?.name?.toLowerCase().replace(' ', '')}@example.com</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.mockSettingRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.mockSettingLabel, { color: colors.text.header }]}>Password</Text>
                        <IconButton icon="chevron-right" size={20} iconColor={colors.text.light} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : selectedSetting === 'Content preferences' ? (
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailTitle}>Preferences</Text>
                    <View style={styles.settingsGroup}>
                      <View style={styles.settingToggleRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.settingRowLabel}>Restricted Mode</Text>
                          <Text style={styles.settingRowSub}>Limit signals that may be inappropriate</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => { setRestrictedMode(!restrictedMode); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                          style={[styles.toggleBase, restrictedMode && styles.toggleActive]}
                        >
                          <View style={[styles.toggleCircle, restrictedMode && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.mockSettingRow}>
                        <Text style={styles.mockSettingLabel}>Filter keywords</Text>
                        <IconButton icon="chevron-right" size={20} iconColor="#444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : selectedSetting === 'Push notifications' ? (
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailTitle}>Notifications</Text>
                    <View style={styles.settingsGroup}>
                      {Object.keys(notifications).map((key) => (
                        <View key={key} style={styles.settingToggleRow}>
                          <Text style={[styles.settingRowLabel, { textTransform: 'capitalize' }]}>{key}</Text>
                          <TouchableOpacity 
                            onPress={() => { 
                              setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof notifications] }));
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={[styles.toggleBase, notifications[key as keyof typeof notifications] && styles.toggleActive]}
                          >
                            <View style={[styles.toggleCircle, notifications[key as keyof typeof notifications] && styles.toggleCircleActive]} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : selectedSetting === 'Data Saver' ? (
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailTitle}>Data Usage</Text>
                    <View style={styles.settingsGroup}>
                      <View style={styles.settingToggleRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.settingRowLabel}>Data Saver</Text>
                          <Text style={styles.settingRowSub}>Lower video resolution to save mobile data</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => { setDataSaver(!dataSaver); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                          style={[styles.toggleBase, dataSaver && styles.toggleActive]}
                        >
                          <View style={[styles.toggleCircle, dataSaver && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : selectedSetting === 'Display' ? (
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailTitle}>Display Mode</Text>
                    <Text style={styles.detailDescription}>Choose how you want SIIGGY to look on your device.</Text>
                    <View style={styles.settingsGroup}>
                      {[
                        { label: 'Light', value: 'light', icon: 'white-balance-sunny' },
                        { label: 'Dark', value: 'dark', icon: 'moon-waning-crescent' },
                        { label: 'Use system setting', value: 'system', icon: 'cellphone-cog' },
                      ].map((item) => (
                        <TouchableOpacity 
                          key={item.value} 
                          style={[styles.mockSettingRow, { borderBottomColor: colors.border }]} 
                          onPress={() => { setThemeMode(item.value as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconButton icon={item.icon} size={20} iconColor={themeMode === item.value ? colors.primary : colors.text.light} />
                            <Text style={[styles.mockSettingLabel, { color: colors.text.header }, themeMode === item.value && { color: colors.primary }]}>{item.label}</Text>
                          </View>
                          {themeMode === item.value && <IconButton icon="check" size={20} iconColor={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : selectedSetting === 'Language' ? (
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailTitle}>App Language</Text>
                    <View style={styles.settingsGroup}>
                      {['English', 'Bemba', 'Nyanja', 'Tonga', 'Lozi'].map((lang) => (
                        <TouchableOpacity key={lang} style={styles.mockSettingRow} onPress={() => { setLanguage(lang); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                          <Text style={[styles.mockSettingLabel, language === lang && { color: colors.primary }]}>{lang}</Text>
                          {language === lang && <IconButton icon="check" size={20} iconColor={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : selectedSetting === 'SIIGGY Code' ? (
                  <View style={styles.detailContainer}>
                     <View style={styles.qrCard}>
                       <IconButton icon="qrcode" size={120} iconColor="#fff" style={{ margin: 0 }} />
                       <Text style={styles.qrUsername}>@{user?.name?.toLowerCase().replace(' ', '') || 'guest'}</Text>
                       <Text style={styles.qrSub}>Scan to follow me on SIIGGY</Text>
                     </View>
                     <Button mode="contained" buttonColor={colors.primary} style={{ marginTop: 30, width: '100%' }} labelStyle={{ color: '#000', fontWeight: 'bold' }}>Save QR Code</Button>
                  </View>
                ) : selectedSetting === 'Report a problem' ? (
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailTitle}>Report</Text>
                    <TextInput 
                      multiline
                      value={reportText}
                      onChangeText={setReportText}
                      placeholder="Describe the issue you're facing..."
                      placeholderTextColor="#444"
                      style={styles.reportInput}
                    />
                    <Button 
                      mode="contained" 
                      buttonColor={colors.primary} 
                      onPress={() => { Alert.alert('Thank you', 'Your report has been submitted.'); setReportText(''); setSelectedSetting(null); }}
                      style={{ width: '100%', marginTop: 20 }}
                      labelStyle={{ color: '#000', fontWeight: 'bold' }}
                    >
                      Submit
                    </Button>
                  </View>
                ) : (
                  <View style={styles.detailContainer}>
                    <IconButton icon="information-outline" size={48} iconColor={colors.primary} style={{ alignSelf: 'center' }} />
                    <Text style={styles.detailTitle}>{selectedSetting}</Text>
                    <Text style={styles.detailDescription}>
                      Manage your {selectedSetting.toLowerCase()} settings here. You can customize how your profile and data are shared with the community.
                    </Text>
                    
                    <View style={styles.detailMocks}>
                      {[1, 2, 3].map(i => (
                        <View key={i} style={styles.mockSettingRow}>
                          <Text style={styles.mockSettingLabel}>Option {i}</Text>
                          <Button mode="text" labelStyle={{ color: colors.primary }}>Change</Button>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                <TouchableOpacity style={styles.saveButton} onPress={() => setSelectedSetting(null)}>
                  <Text style={styles.saveButtonText}>Back to Settings</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
        <View style={[styles.editModalContainer, { backgroundColor: colors.background.default }]}>
          <View style={[styles.settingsHeader, { backgroundColor: colors.background.default, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Button onPress={() => setEditModalVisible(false)} textColor={colors.text.header}>Cancel</Button>
            <Text style={[styles.settingsHeaderTitle, { color: colors.text.header }]}>Edit Profile</Text>
            <Button onPress={handleUpdateProfile} textColor={colors.primary} labelStyle={{ fontWeight: '800' }}>Save</Button>
          </View>
          
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={styles.editAvatarSection}>
              <Avatar.Text size={100} label={tempName[0] || 'S'} style={{ backgroundColor: colors.primary }} />
              <TouchableOpacity>
                 <Text style={{ color: colors.primary, marginTop: 15, fontWeight: '600' }}>Change photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editForm}>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput 
                  value={tempName} 
                  onChangeText={setTempName} 
                  style={[styles.formInput, { backgroundColor: colors.background.light, color: colors.text.header, borderColor: colors.border }]} 
                  placeholderTextColor={colors.text.light} 
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Username</Text>
                <TextInput 
                  value={tempUsername} 
                  onChangeText={setTempUsername} 
                  style={[styles.formInput, { backgroundColor: colors.background.light, color: colors.text.header, borderColor: colors.border }]} 
                  placeholderTextColor={colors.text.light} 
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput 
                  value={bio} 
                  onChangeText={setBio} 
                  style={[styles.formInput, { height: 80, backgroundColor: colors.background.light, color: colors.text.header, borderColor: colors.border }]} 
                  multiline 
                  placeholderTextColor={colors.text.light} 
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#222',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  editButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 35,
  },
  editButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  bookmarkButton: {
    borderWidth: 1,
    borderRadius: 4,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioContainer: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  bioText: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
  },
  gridItem: {
    width: (width - 2) / 3,
    height: 160,
    backgroundColor: '#111',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  

  // Settings Modal Styles
  settingsModalContainer: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingsHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingsScrollView: {
    flex: 1,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemLabel: {
    fontSize: 15,
  },
  settingsDivider: {
    marginLeft: 60, // offset past the icon
    marginRight: 20,
    marginTop: 10,
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  detailContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 15,
  },
  detailDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  detailMocks: {
    width: '100%',
    borderRadius: 12,
    padding: 10,
    marginBottom: 40,
  },
  mockSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  mockSettingLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  saveButton: {
    width: '100%',
    borderWidth: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  // New Functional Styles
  settingsGroup: {
    width: '100%',
    borderRadius: 12,
    marginTop: 20,
    overflow: 'hidden',
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingRowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleBase: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  walletCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
  },
  walletLabel: {
    fontSize: 14,
    marginTop: 10,
  },
  walletAmount: {
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 15,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  walletBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
  },
  walletBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  qrCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  qrUsername: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  qrSub: {
    fontSize: 14,
    marginTop: 5,
  },
  reportInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    width: '100%',
    height: 150,
    marginTop: 20,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  mockValue: {
    fontSize: 14,
  },
  editModalContainer: {
    flex: 1,
  },
  editAvatarSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  editForm: {
    gap: 20,
  },
  formItem: {
    gap: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 5,
  },
  formInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
  }
});

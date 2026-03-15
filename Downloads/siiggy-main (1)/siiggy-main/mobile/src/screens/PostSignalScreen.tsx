import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Button, TextInput, ActivityIndicator, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ContextPicker } from '../components';
import { contextsApi, signalsApi } from '../services';
import { useLocationStore, useFeedStore } from '../store';
import { Context } from '../types';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

interface PostSignalScreenProps {
  navigation: any;
  route: any;
}

export const PostSignalScreen: React.FC<PostSignalScreenProps> = ({ navigation, route }) => {
  const colors = useThemeColors();
  const [step, setStep] = useState<'media' | 'context' | 'details'>('media');
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<number | null>(null);
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | any>(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingContexts, setLoadingContexts] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('15s');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [beautyEnabled, setBeautyEnabled] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [effectsEnabled, setEffectsEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedSound, setSelectedSound] = useState<any>(null);
  const [recordingSound, setRecordingSound] = useState<Audio.Sound | null>(null);
  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const { location, setLocation } = useLocationStore();
  const { addSignal } = useFeedStore();

  useEffect(() => {
    loadContexts();
    if (!location) getCurrentLocation();
    (async () => {
      if (!permission?.granted) await requestPermission();
      if (!microphonePermission?.granted) await requestMicrophonePermission();
      if (!mediaLibraryPermission?.granted) await requestMediaLibraryPermission();
    })();
  }, []);

  useEffect(() => {
    if (route.params?.selectedSound) {
      setSelectedSound(route.params.selectedSound);
    }
  }, [route.params?.selectedSound]);

  const loadContexts = async () => {
    try {
      setLoadingContexts(true);
      const response = await contextsApi.getAll();
      setContexts(response.data.data);
    } catch (error) {
    } finally {
      setLoadingContexts(false);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  useEffect(() => {
    if (isRecording) {
      const baseDuration = activeTab === '15s' ? 15000 : 60000;
      const duration = baseDuration / speed;
      
      progressAnim.setValue(0);
      RNAnimated.timing(progressAnim, {
        toValue: 100,
        duration: duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          handleStopRecording();
        }
      });
    } else {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  }, [isRecording, activeTab, speed]);

  // Countdown Timer Logic
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      timerInterval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      startRecordingLogic();
    }
    return () => clearInterval(timerInterval);
  }, [isCountingDown, countdown]);

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const handleStopRecording = async () => {
    if (recordingSound) {
      await recordingSound.stopAsync();
      await recordingSound.unloadAsync();
      setRecordingSound(null);
    }
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
      } catch (e) {
        console.error("Stop recording error:", e);
      }
      setIsRecording(false);
    }
  };

  const startRecordingLogic = async () => {
    if (!cameraReady || !cameraRef.current) return;
    setIsRecording(true);

    if (selectedSound?.audioUrl) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: selectedSound.audioUrl });
        setRecordingSound(sound);
        await sound.playAsync();
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }
    
    // Small delay to ensure camera sensor is ready for video mode
    setTimeout(async () => {
      try {
        const video = await cameraRef.current?.recordAsync({ 
          maxDuration: (activeTab === '15s' ? 15 : 60) / speed 
        });
        setIsRecording(false);
        if (video) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMedia({ uri: video.uri, type: 'video', name: 'video.mp4' });
          setStep('context');
        }
      } catch (e: any) {
        console.error("Recording error:", e);
        setIsRecording(false);
        // Only alert if it's a real failure, not a manual stop
        if (e.message && !e.message.includes('stopped')) {
          Alert.alert('Camera Error', 'Could not start recording. Please try again.');
        }
      }
    }, 300);
  };

  const handleRecord = async () => {
    if (!permission?.granted || !cameraRef.current || !cameraReady) return;

    if (activeTab === 'Templates') {
       try {
         const picture = await cameraRef.current.takePictureAsync({
            quality: 0.8
         });
         if (picture) {
            setMedia({ uri: picture.uri, type: 'image', name: 'photo.jpg' });
            setStep('context');
         }
       } catch (e) {
         console.error(e);
       }
    } else {
      if (isRecording) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handleStopRecording();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (timer > 0) {
          setCountdown(timer);
          setIsCountingDown(true);
        } else {
          startRecordingLogic();
        }
      }
    }
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setMedia(result.assets[0]);
      setStep('context');
    }
  };

  const handleSubmit = async () => {
    if (!selectedContextId || !media || !location) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('context_id', selectedContextId.toString());
      formData.append('lat', location.lat.toString());
      formData.append('lng', location.lng.toString());

      if (description) formData.append('description', description);
      if (price) formData.append('price', price);

      const mediaUri = media.uri;
      const mediaType = media.type === 'video' ? 'video/mp4' : 'image/jpeg';
      const mediaName = media.type === 'video' ? 'video.mp4' : 'photo.jpg';

      formData.append('media', {
        uri: mediaUri,
        type: mediaType,
        name: mediaName,
      } as any);

      if (selectedSound) {
        formData.append('sound_id', selectedSound.id);
      }

      const response = await signalsApi.createSignal(formData);
      addSignal(response.data.data);
      Alert.alert('Success', 'Signal posted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post signal');
    } finally {
      setLoading(false);
    }
  };

  const selectedContext = contexts.find((c) => c.id === selectedContextId);

  if (step === 'media') {
    if (!permission || !permission.granted) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
          <Text style={{ color: 'white', marginBottom: 20, textAlign: 'center' }}>We need your permission to use the camera and microphone</Text>
          <TouchableOpacity 
            style={styles.requestButton} 
            onPress={async () => {
              await requestPermission();
              await requestMicrophonePermission();
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={flash === 'on'}
          flash={flash === 'on' ? 'on' : 'off'}
          ref={cameraRef}
          mode={activeTab === 'Templates' ? 'picture' : 'video'}
          onCameraReady={() => setCameraReady(true)}
        />

        {/* --- CAMERA UI OVERLAY --- */}
        {isRecording ? (
          <View style={[styles.progressContainer, { top: insets.top > 0 ? insets.top + 10 : 40 }]}>
            <RNAnimated.View 
              style={[
                styles.progressBar, 
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }) 
                }
              ]} 
            />
          </View>
        ) : null}

        <View style={[styles.topControls, { paddingTop: insets.top > 0 ? insets.top + 10 : 40 }]}>
          {!isRecording ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <IconButton icon="close" iconColor="white" size={28} style={{ margin: 0 }} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
          
          <TouchableOpacity 
            style={[styles.soundsButton, selectedSound && { backgroundColor: 'rgba(255,100,100,0.15)' }]} 
            onPress={() => !isRecording && navigation.navigate('SoundSelection')}
            disabled={isRecording}
          >
            <IconButton icon="music-note" iconColor={selectedSound ? colors.primary : "white"} size={16} style={{ margin: 0 }} />
            <Text style={[styles.soundsText, selectedSound && { color: colors.primary }]} numberOfLines={1}>
              {selectedSound ? selectedSound.title : 'Sounds'}
            </Text>
            {selectedSound && !isRecording && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedSound(null);
                }}
                style={styles.closeSoundBtn}
              >
                 <IconButton icon="close-circle" iconColor="white" size={14} style={{ margin: 0 }} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <View style={{ width: 44 }} />
        </View>

        {!isRecording ? (
          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.rightControlItem} onPress={toggleCameraFacing}>
              <IconButton icon="camera-flip-outline" iconColor="#fff" size={26} style={{ margin: 0 }} />
              <Text style={styles.rightControlText}>Flip</Text>
            </TouchableOpacity>
            
            <View>
              <TouchableOpacity style={styles.rightControlItem} onPress={() => setShowSpeedOptions(!showSpeedOptions)}>
                <IconButton icon="speedometer" iconColor={speed !== 1 ? colors.primary : "#fff"} size={26} style={{ margin: 0 }} />
                <Text style={[styles.rightControlText, speed !== 1 && {color: colors.primary}]}>{speed}x</Text>
              </TouchableOpacity>
              {showSpeedOptions && (
                <View style={styles.speedSubMenu}>
                  {[0.3, 0.5, 1, 2, 3].map(s => (
                    <TouchableOpacity key={s} onPress={() => {setSpeed(s); setShowSpeedOptions(false);}} style={styles.speedOption}>
                      <Text style={{color: speed === s ? colors.primary : '#fff', fontWeight: 'bold'}}>{s}x</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.rightControlItem} onPress={() => {setBeautyEnabled(!beautyEnabled); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}}>
              <IconButton icon="auto-fix" iconColor={beautyEnabled ? colors.primary : "#fff"} size={26} style={{ margin: 0 }} />
              <Text style={[styles.rightControlText, beautyEnabled && {color: colors.primary}]}>Beauty</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rightControlItem} onPress={() => {setFilterEnabled(!filterEnabled); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}}>
              <IconButton icon="filter-variant" iconColor={filterEnabled ? colors.primary : "#fff"} size={26} style={{ margin: 0 }} />
              <Text style={[styles.rightControlText, filterEnabled && {color: colors.primary}]}>Filters</Text>
            </TouchableOpacity>

            <View>
              <TouchableOpacity style={styles.rightControlItem} onPress={() => setShowTimerOptions(!showTimerOptions)}>
                <IconButton icon="timer-outline" iconColor={timer > 0 ? colors.primary : "#fff"} size={26} style={{ margin: 0 }} />
                <Text style={[styles.rightControlText, timer > 0 && {color: colors.primary}]}>{timer > 0 ? `${timer}s` : 'Timer'}</Text>
              </TouchableOpacity>
              {showTimerOptions && (
                <View style={styles.timerSubMenu}>
                  {[0, 3, 10].map(t => (
                    <TouchableOpacity key={t} onPress={() => {setTimer(t); setShowTimerOptions(false);}} style={styles.timerOption}>
                      <Text style={{color: timer === t ? colors.primary : '#fff', fontWeight: 'bold'}}>{t === 0 ? 'Off' : `${t}s`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.rightControlItem} onPress={toggleFlash}>
              <IconButton icon={flash === 'on' ? "flash" : "flash-off"} iconColor={flash === 'on' ? colors.primary : "#fff"} size={26} style={{ margin: 0 }} />
              <Text style={[styles.rightControlText, flash === 'on' && {color: colors.primary}]}>Flash</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isCountingDown && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        <View style={[styles.bottomControls, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}>
          <View style={styles.actionsRow}>
            {!isRecording ? (
              <TouchableOpacity style={styles.actionIcon} onPress={() => {setEffectsEnabled(!effectsEnabled); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}}>
                <View style={[styles.effectIconWrapper, effectsEnabled && {backgroundColor: colors.primary}]}>
                  <Text style={{ fontSize: 24 }}>{effectsEnabled ? "😎" : "😉"}</Text>
                </View>
                <Text style={[styles.actionText, effectsEnabled && {color: colors.primary}]}>Effects</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} />
            )}

            <TouchableOpacity
              style={[
                styles.recordOuterContainer,
                isRecording && { borderColor: 'rgba(255,100,100,0.5)', transform: [{ scale: 1.2 }], borderWidth: 8 }
              ]}
              onPressIn={handleRecord}
            >
              <View style={[
                styles.recordInnerContainer,
                isRecording && { borderRadius: 8, width: 26, height: 26, backgroundColor: colors.primary },
                activeTab === 'Templates' && { backgroundColor: 'white' }
              ]} />
            </TouchableOpacity>

            {!isRecording ? (
              <TouchableOpacity style={styles.actionIcon} onPress={pickMedia}>
                <View style={styles.uploadIconWrapper}>
                  <IconButton icon="image-outline" iconColor="white" size={24} style={{ margin: 0 }} />
                </View>
                <Text style={styles.actionText}>Upload</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {!isRecording ? (
            <View style={styles.tabsRow}>
              {['60s', '15s', 'Templates'].map((tab) => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'Templates' ? 'Photo' : tab}
                  </Text>
                  {activeTab === tab ? <View style={styles.activeDot} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.default }]}>
        <IconButton icon="check-circle" iconColor="#70FF00" size={100} />
        <Text style={{ color: colors.text.header, fontSize: 28, fontWeight: '800', marginTop: 20 }}>Signal Posted!</Text>
        <Text style={{ color: colors.text.light, fontSize: 16, marginTop: 10 }}>Nearby buyers have been notified.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.default }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background.default, borderBottomColor: colors.border }]}>
         <TouchableOpacity 
           onPress={() => setStep(step === 'details' ? 'context' : 'media')} 
           style={styles.headerClose}
         >
            <IconButton icon="arrow-left" iconColor={colors.text.header} size={24} />
         </TouchableOpacity>
         <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text.header }]}>
               {step === 'context' ? 'What are you posting?' : 'Add Details'}
            </Text>
            {selectedSound && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <IconButton icon="music-note" iconColor={colors.primary} size={12} style={{ margin: 0 }} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>{selectedSound.title}</Text>
              </View>
            )}
         </View>
         <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 'context' ? (
          <View style={styles.stepContainer}>
            <ContextPicker
              contexts={contexts}
              selectedIds={selectedContextId ? [selectedContextId] : []}
              onSelect={(id) => { 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedContextId(id); 
                setStep('details'); 
              }}
              onDeselect={() => setSelectedContextId(null)}
              maxSelections={1}
              isLoading={loadingContexts}
              onRefresh={loadContexts}
            />
          </View>
        ) : null}

        {step === 'details' ? (
          <View style={styles.stepContainer}>
            <View style={styles.mediaPreview}>
              <Image source={{ uri: media?.uri }} style={styles.previewImage} resizeMode="cover" />
              {selectedSound && (
                <View style={styles.soundBadge}>
                  <IconButton icon="music-note" iconColor={colors.primary} size={14} style={{ margin: 0 }} />
                  <Text style={styles.soundBadgeText} numberOfLines={1}>{selectedSound.title}</Text>
                </View>
              )}
              <Button mode="text" onPress={() => setStep('media')} textColor={colors.primary} compact>Change Media</Button>
            </View>

            <TouchableOpacity 
              style={styles.selectedContextRow} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep('context');
              }}
            >
              <View style={[styles.contextBadge, { backgroundColor: colors.background.light, borderColor: colors.border }]}>
                <Text style={[styles.contextBadgeText, { color: colors.text.header }]}>{selectedContext?.emoji} {selectedContext?.name}</Text>
              </View>
              <Text style={styles.changeContextText}>Change</Text>
            </TouchableOpacity>

            <TextInput
              label="Price (optional)"
              value={price}
              onChangeText={setPrice}
              placeholder="e.g., K50"
              style={styles.input}
              mode="flat"
              textColor={colors.text.header}
              placeholderTextColor={colors.text.light}
              underlineColor={colors.border}
              activeUnderlineColor={colors.primary}
              keyboardType="numeric"
              onFocus={() => Haptics.selectionAsync()}
            />
            
            <TextInput
              label="Note (optional)"
              value={description}
              onChangeText={(text) => setDescription(text.slice(0, 60))}
              placeholder="Brief description..."
              style={styles.input}
              mode="flat"
              textColor={colors.text.header}
              placeholderTextColor={colors.text.light}
              underlineColor={colors.border}
              activeUnderlineColor={colors.primary}
              multiline={true}
              numberOfLines={2}
              onFocus={() => Haptics.selectionAsync()}
              right={<TextInput.Affix text={`${description.length}/60`} textStyle={{ color: description.length >= 50 ? colors.primary : colors.text.light }} />}
            />

            <Button
              mode="contained"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleSubmit();
              }}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              buttonColor={colors.primary}
              contentStyle={{ paddingVertical: 10 }}
              labelStyle={{ fontWeight: '800', fontSize: 16 }}
            >
              Post Signal
            </Button>
            
            <View style={{ height: 100 }} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderBottomWidth: 1,
  },
  headerClose: { paddingLeft: 8 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepIndicatorRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xs },
  stepSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: spacing.md, paddingHorizontal: spacing.xl },
  mediaPreview: { alignItems: 'center', marginVertical: spacing.md },
  previewImage: { width: 120, height: 160, borderRadius: 12, marginBottom: spacing.xs },
  soundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingRight: 12,
    marginTop: -20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  soundBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 100,
  },
  
  selectedContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: 12,
  },
  contextBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: spacing.lg, 
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)',
  },
  contextBadgeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  changeContextText: { color: colors.primary, fontWeight: '600', fontSize: 14 },

  input: { marginBottom: spacing.md, backgroundColor: 'transparent', width: '90%', alignSelf: 'center' },
  submitButton: { marginTop: spacing.xl, width: '90%', alignSelf: 'center', borderRadius: 8 },
  requestButton: { padding: 15, backgroundColor: colors.primary, borderRadius: 8 },

  progressContainer: { position: 'absolute', left: 15, right: 15, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', zIndex: 999 },
  progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  soundsButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderRadius: 20, 
    paddingRight: 8, 
    maxWidth: width * 0.6,
  },
  soundsText: { color: 'white', fontWeight: '700', fontSize: 13, marginLeft: -4 },
  closeSoundBtn: {
    marginLeft: 4,
  },
  rightControls: { position: 'absolute', right: 10, top: 100, alignItems: 'center', gap: 15 },
  rightControlItem: { alignItems: 'center' },
  rightControlText: { color: 'white', fontSize: 11, fontWeight: 'bold', marginTop: -5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  actionIcon: { alignItems: 'center' },
  effectIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  uploadIconWrapper: { width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { color: 'white', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  recordOuterContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
  recordInnerContainer: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.primary },
  tabsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 25 },
  tabItem: { alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  tabTextActive: { color: 'white' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'white', marginTop: 6 },
  speedSubMenu: {
    position: 'absolute',
    right: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
    gap: 12,
  },
  speedOption: {
    padding: 4,
  },
  timerSubMenu: {
    position: 'absolute',
    right: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
    gap: 12,
  },
  timerOption: {
    padding: 4,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '800',
    color: '#fff',
  },
});


export default PostSignalScreen;

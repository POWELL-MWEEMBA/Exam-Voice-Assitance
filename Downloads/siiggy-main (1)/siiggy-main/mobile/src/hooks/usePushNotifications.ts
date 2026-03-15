import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store';
import {
  registerForPushNotifications,
  registerTokenWithBackend,
  unregisterToken,
  addNotificationListeners,
  getLastNotificationResponse,
} from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = 'expo_push_token';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const { isAuthenticated, user } = useAuthStore();
  const navigation = useNavigation<any>();
  const isRegistering = useRef(false);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isRegistering.current) {
      registerPushToken();
    }
  }, [isAuthenticated, user]);

  // Set up notification listeners
  useEffect(() => {
    const cleanup = addNotificationListeners(
      // Notification received while app is foregrounded
      (notification) => {
        setNotification(notification);
      },
      // User tapped on notification
      (response) => {
        handleNotificationTap(response);
      }
    );

    // Check if app was opened from a notification
    checkInitialNotification();

    return cleanup;
  }, []);

  const registerPushToken = async () => {
    if (isRegistering.current) return;
    isRegistering.current = true;

    try {
      // Check if we already have a registered token
      const existingToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      
      // Get new token
      const token = await registerForPushNotifications();
      
      if (token) {
        setExpoPushToken(token);
        
        // Only register with backend if token is new or different
        if (token !== existingToken) {
          const success = await registerTokenWithBackend(token);
          if (success) {
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
          }
        }
      }
    } catch (error) {
      console.error('Error in registerPushToken:', error);
    } finally {
      isRegistering.current = false;
    }
  };

  const unregisterPushToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (token) {
        await unregisterToken(token);
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
        setExpoPushToken(null);
      }
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }, []);

  const checkInitialNotification = async () => {
    const response = await getLastNotificationResponse();
    if (response) {
      handleNotificationTap(response);
    }
  };

  const handleNotificationTap = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    if (!data) return;

    // Navigate based on notification type
    switch (data.type) {
      case 'new_signal':
        if (data.signal_id) {
          navigation.navigate('SignalDetail', { signal: { id: data.signal_id } });
        }
        break;

      case 'new_message':
        if (data.conversation_id && data.sender) {
          navigation.navigate('Chat', {
            conversationId: data.conversation_id,
            otherUser: data.sender,
          });
        }
        break;

      case 'new_demand':
        // Navigate to demands tab
        navigation.navigate('Main', { screen: 'Demands' });
        break;

      default:
        // Default to main screen
        navigation.navigate('Main');
    }
  };

  return {
    expoPushToken,
    notification,
    registerPushToken,
    unregisterPushToken,
  };
}

export default usePushNotifications;

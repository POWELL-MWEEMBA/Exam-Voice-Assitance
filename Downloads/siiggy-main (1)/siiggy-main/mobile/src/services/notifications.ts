import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsApi } from './api';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Must be a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    const tokenOptions: { projectId?: string } = {};
    
    if (projectId) {
      tokenOptions.projectId = projectId;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync(tokenOptions);

    const token = tokenData.data;
    console.log('Expo push token:', token);

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB100',
      });

      // Channel for new signals
      await Notifications.setNotificationChannelAsync('signals', {
        name: 'New Signals',
        description: 'Notifications for new signals in your area',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB100',
      });

      // Channel for messages
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        description: 'Notifications for new chat messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#465A73',
      });

      // Channel for demands
      await Notifications.setNotificationChannelAsync('demands', {
        name: 'Demand Requests',
        description: 'Notifications for new demand requests nearby',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#465A73',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Register the push token with the backend
 */
export async function registerTokenWithBackend(token: string): Promise<boolean> {
  try {
    const deviceType = Platform.OS as 'ios' | 'android';
    const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}`;

    await notificationsApi.registerToken(token, deviceType, deviceName);
    console.log('Push token registered with backend');
    return true;
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
    return false;
  }
}

/**
 * Remove push token from backend (on logout)
 */
export async function unregisterToken(token: string): Promise<void> {
  try {
    await notificationsApi.removeToken(token);
    console.log('Push token removed from backend');
  } catch (error) {
    console.error('Failed to remove push token:', error);
  }
}

/**
 * Add notification listeners
 */
export function addNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response:', response);
      onNotificationResponse?.(response);
    }
  );

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Get last notification response (for when app was opened by tapping notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export default {
  registerForPushNotifications,
  registerTokenWithBackend,
  unregisterToken,
  addNotificationListeners,
  getLastNotificationResponse,
  clearAllNotifications,
  getBadgeCount,
  setBadgeCount,
};

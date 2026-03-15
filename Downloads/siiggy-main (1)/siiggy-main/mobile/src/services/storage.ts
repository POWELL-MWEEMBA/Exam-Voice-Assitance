import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  SUBSCRIPTIONS: 'subscriptions',
  CACHED_SIGNALS: 'cached_signals',
  LAST_LOCATION: 'last_location',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};

export const storage = {
  // Auth
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  // User
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Subscriptions cache
  async setSubscriptions(subscriptions: any[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  },

  async getSubscriptions(): Promise<any[] | null> {
    const subs = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!subs) return null;
    
    const parsed = JSON.parse(subs);
    // Ensure boolean fields are actual booleans
    return parsed.map((sub: any) => ({
      ...sub,
      notify: Boolean(sub.notify),
    }));
  },

  // Cached signals (offline support)
  async setCachedSignals(signals: any[]): Promise<void> {
    // Keep only last 50 signals
    const toCache = signals.slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_SIGNALS, JSON.stringify(toCache));
  },

  async getCachedSignals(): Promise<any[] | null> {
    const signals = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_SIGNALS);
    if (!signals) return null;
    
    const parsed = JSON.parse(signals);
    // Ensure boolean fields are actual booleans
    return parsed.map((signal: any) => ({
      ...signal,
      is_expired: Boolean(signal.is_expired),
    }));
  },

  // Location
  async setLastLocation(lat: number, lng: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify({ lat, lng }));
  },

  async getLastLocation(): Promise<{ lat: number; lng: number } | null> {
    const location = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
    return location ? JSON.parse(location) : null;
  },

  // Onboarding
  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },

  async isOnboardingComplete(): Promise<boolean> {
    const complete = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return complete === 'true';
  },

  // Clear all
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },
};

export default storage;

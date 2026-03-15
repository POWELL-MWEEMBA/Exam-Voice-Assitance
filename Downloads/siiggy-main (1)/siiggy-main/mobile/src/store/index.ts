import { create } from 'zustand';
import { User, Subscription, Location, Signal } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../services';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setToken: async (token) => {
    if (token) {
      await storage.setToken(token);
    } else {
      await storage.removeToken();
    }
    set({ token });
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: async () => {
    await storage.clearAll();
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  clearAuth: async () => {
    await storage.clearAll();
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  loadFromStorage: async () => {
    const token = await storage.getToken();
    const user = await storage.getUser();
    set({ 
      token, 
      user, 
      isAuthenticated: !!token && !!user,
      isLoading: false,
    });
  },
}));

interface LocationState {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  
  setLocation: (location: Location) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadFromStorage: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  isLoading: true,
  error: null,

  setLocation: async (location) => {
    await storage.setLastLocation(location.lat, location.lng);
    set({ location, error: null });
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  loadFromStorage: async () => {
    const location = await storage.getLastLocation();
    set({ location, isLoading: false });
  },
}));

interface SubscriptionState {
  subscriptions: Subscription[];
  subscribedContextIds: number[];
  
  setSubscriptions: (subscriptions: Subscription[]) => void;
  addSubscription: (subscription: Subscription) => void;
  removeSubscription: (contextId: number) => void;
  toggleNotify: (contextId: number) => void;
  loadFromStorage: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  subscribedContextIds: [],

  setSubscriptions: async (subscriptions) => {
    // Ensure notify field is boolean
    const normalized = subscriptions.map((s) => ({
      ...s,
      notify: Boolean(s.notify),
    }));
    await storage.setSubscriptions(normalized);
    set({ 
      subscriptions: normalized, 
      subscribedContextIds: normalized.map((s) => s.context_id),
    });
  },
  
  addSubscription: (subscription) => {
    const { subscriptions } = get();
    // Ensure notify field is boolean
    const normalized = {
      ...subscription,
      notify: Boolean(subscription.notify),
    };
    const updated = [...subscriptions, normalized];
    set({ 
      subscriptions: updated,
      subscribedContextIds: updated.map((s) => s.context_id),
    });
  },
  
  removeSubscription: (contextId) => {
    const { subscriptions } = get();
    const updated = subscriptions.filter((s) => s.context_id !== contextId);
    set({ 
      subscriptions: updated,
      subscribedContextIds: updated.map((s) => s.context_id),
    });
  },
  
  toggleNotify: (contextId) => {
    const { subscriptions } = get();
    const updated = subscriptions.map((s) => 
      s.context_id === contextId ? { ...s, notify: !s.notify } : s
    );
    set({ subscriptions: updated });
  },
  
  loadFromStorage: async () => {
    const subscriptions = await storage.getSubscriptions();
    if (subscriptions) {
      set({ 
        subscriptions, 
        subscribedContextIds: subscriptions.map((s) => s.context_id),
      });
    }
  },
}));

interface FeedState {
  signals: Signal[];
  isLoading: boolean;
  error: string | null;
  
  setSignals: (signals: Signal[]) => void;
  addSignal: (signal: Signal) => void;
  removeSignal: (signalId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadFromCache: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  signals: [],
  isLoading: true,
  error: null,

  setSignals: async (signals) => {
    // Ensure boolean fields are actual booleans
    const normalized = signals.map((s) => ({
      ...s,
      is_expired: Boolean(s.is_expired),
    }));
    await storage.setCachedSignals(normalized);
    set({ signals: normalized, error: null });
  },
  
  addSignal: (signal) => {
    const { signals } = get();
    // Ensure boolean fields are actual booleans
    const normalized = {
      ...signal,
      is_expired: Boolean(signal.is_expired),
    };
    set({ signals: [normalized, ...signals] });
  },
  
  removeSignal: (signalId) => {
    const { signals } = get();
    set({ signals: signals.filter((s) => s.id !== signalId) });
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  loadFromCache: async () => {
    const cached = await storage.getCachedSignals();
    if (cached) {
      set({ signals: cached });
    }
    set({ isLoading: false });
  },
}));

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  loadFromStorage: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',
  setThemeMode: async (themeMode) => {
    await AsyncStorage.setItem('theme_mode', themeMode);
    set({ themeMode });
  },
  loadFromStorage: async () => {
    const mode = await AsyncStorage.getItem('theme_mode');
    if (mode) {
      set({ themeMode: mode as ThemeMode });
    }
  },
}));

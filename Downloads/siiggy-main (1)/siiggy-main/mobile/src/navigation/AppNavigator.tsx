import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

// Feature Screens
import HomeFeedScreen from '../screens/HomeFeedScreen';
import { SubscriptionsScreen } from '../features/subscriptions';

// Legacy Screens (to be migrated to features)
import {
  LoginScreen,
  RegisterScreen,
  PostSignalScreen,
  SignalDetailScreen,
  ProfileScreen,
  DemandsScreen,
  PostDemandScreen,
  ConversationsScreen,
  ChatScreen,
  DemandResponsesScreen,
  NotificationsScreen,
  GalleryPickerScreen,
  GalleryScreen,
  SoundSelectionScreen,
} from '../screens';

import { useAuthStore, useThemeStore } from '../store';
import { useThemeColors } from '../theme';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { User } from '../types';
import { usePushNotifications } from '../hooks';

// Types
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  PostSignal: undefined;
  PostDemand: undefined;
  SignalDetail: { signal: any };
  DemandResponses: { demandId: number };
  Chat: { conversationId?: number; otherUser: User; signalId?: number; demandId?: number };
  MySignals: undefined;
  Notifications: undefined;
  GalleryPicker: undefined;
  Gallery: undefined;
  SoundSelection: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Demands: undefined;
  PostAction: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Push notifications handler - must be inside NavigationContainer
const PushNotificationsHandler: React.FC = () => {
  usePushNotifications();
  return null;
};

// Main Tab Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.light,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          backgroundColor: colors.background.default,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          paddingBottom: 5,
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={HomeFeedScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Supply',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="home" iconColor={color} size={size} style={{margin: 0}} />
          ),
        }}
      />
      <Tab.Screen
        name="Demands"
        component={DemandsScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Demand',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="magnify" iconColor={color} size={size} style={{margin: 0}} />
          ),
        }}
      />
      <Tab.Screen
        name="PostAction"
        component={PostSignalScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            (navigation as any).navigate('PostSignal');
          },
        })}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={{
              backgroundColor: colors.primary,
              width: 48,
              height: 32,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 4,
            }}>
              <IconButton icon="plus" iconColor="#000" size={24} style={{margin: 0}} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ConversationsScreen}
        options={{
          title: 'Messages',
          headerStyle: { backgroundColor: colors.background.default },
          headerTintColor: colors.text.header,
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="message-outline" iconColor={color} size={size} style={{margin: 0}} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="account-outline" iconColor={color} size={size} style={{margin: 0}} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const colors = useThemeColors();

  const MyTheme = {
    ...(colors.background.default === '#000000' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colors.background.default === '#000000' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background.default,
      card: colors.background.default,
      text: colors.text.header,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={MyTheme}>
      <PushNotificationsHandler />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Main App */}
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Sign In',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: 'Create Account',
            headerShown: false,
          }}
        />

        {/* Modal Screens */}
        <Stack.Screen
          name="PostSignal"
          component={PostSignalScreen}
          options={{
            title: 'Post Signal',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="PostDemand"
          component={PostDemandScreen}
          options={{
            presentation: 'modal',
          }}
        />

        {/* Detail Screens */}
        <Stack.Screen
          name="SignalDetail"
          component={SignalDetailScreen}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
        />
        <Stack.Screen
          name="DemandResponses"
          component={DemandResponsesScreen}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
        <Stack.Screen
          name="GalleryPicker"
          component={GalleryPickerScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SoundSelection"
          component={SoundSelectionScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

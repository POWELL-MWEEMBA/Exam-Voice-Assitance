/**
 * App Constants
 * Centralized application configuration values
 */

import { Dimensions } from 'react-native';

// Screen Dimensions
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// API Configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;

// Feed Configuration
export const FEED_PAGE_SIZE = 10;
export const MAX_FEED_CACHE_SIZE = 50;
export const VIDEO_VIEWABILITY_THRESHOLD = 80; // Percentage

// Media Configuration
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov'];

// UI Configuration
export const DOUBLE_TAP_DELAY = 300; // milliseconds
export const ANIMATION_DURATION = 200;
export const TOAST_DURATION = 3000;

// Context/Subscription Limits
export const MAX_CONTEXT_SELECTIONS = 15;
export const MIN_CONTEXT_SELECTIONS = 1;

// Location Configuration
export const LOCATION_ACCURACY = 100; // meters
export const MAX_SIGNAL_DISTANCE = 10; // kilometers

// Cache Keys
export const CACHE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  FEED_CACHE: 'feed_cache',
  LOCATION: 'last_location',
  SUBSCRIPTIONS: 'subscriptions_cache',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Cannot connect to server. Please check your connection.',
  UNAUTHORIZED: 'Please login to continue.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  LOCATION_DENIED: 'Location permission is required to use this app.',
} as const;

/**
 * SIIGGY Theme Configuration
 * 
 * Colors inspired by Ukweli brand identity:
 * - Primary: Orange/Amber (#F5A623)
 * - Secondary: Navy Blue (#465A73)
 */

export const lightColors = {
  primary: '#FFB100',      // Vibrant amber/orange
  primaryDark: '#F59E0B',
  primaryLight: '#FFD54F',
  secondary: '#465A73',
  secondaryDark: '#3F5569',
  secondaryLight: '#5A7091',
  accent: '#FFB100',
  text: {
    header: '#1F2937',
    paragraph: '#374151',
    light: '#6B7280',
    white: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },
  background: {
    default: '#FFFFFF',
    gray: '#F3F4F6',
    light: '#F9FAFB',
    dark: '#1F2937',
    navy: '#465A73',
    orange: '#FFB100',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#465A73',
  },
  border: '#E5E7EB',
  divider: '#E5E7EB',
};

export const darkColors = {
  ...lightColors,
  text: {
    header: '#FFFFFF',
    paragraph: '#E5E7EB',
    light: '#9CA3AF',
    white: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },
  background: {
    default: '#000000',
    gray: '#111827',
    light: '#1F2937',
    dark: '#000000',
    navy: '#465A73',
    orange: '#FFB100',
  },
  border: '#374151',
  divider: '#374151',
};

import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store';

// Default export for backward compatibility (will be light mode)
export const colors = lightColors;

export const useThemeColors = () => {
  const systemScheme = useColorScheme();
  const { themeMode } = useThemeStore();
  
  if (themeMode === 'dark') return darkColors;
  if (themeMode === 'light') return lightColors;
  return systemScheme === 'dark' ? darkColors : lightColors;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
};

export default theme;

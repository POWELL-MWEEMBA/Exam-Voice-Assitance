/**
 * SIIGGY Color Palette
 * Inspired by Ukweli brand identity
 * 
 * Primary Brand Colors:
 * - Orange/Amber: Warm, energetic, represents activity and engagement
 * - Navy Blue: Professional, trustworthy, represents stability
 */

/**
 * SIIGGY Brand Color Palette
 * Updated with vibrant amber theme matching high-end TikTok UI.
 */
export const brandColors = {
  // Primary - Orange/Amber
  orange: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFB100',  // Main brand orange (Vibrant Amber)
    600: '#F59E0B',  // Medium orange
    700: '#D97706',  // Darker orange
    800: '#B45309',
    900: '#92400E',
  },
  
  // Secondary - Navy Blue
  navy: {
    50: '#E8EDF2',
    100: '#C6D3DF',
    200: '#A1B6CA',
    300: '#7B98B5',
    400: '#5F82A5',
    500: '#465A73',  // Main brand navy
    600: '#3F5569',  // Darker navy
    700: '#364959',
    800: '#2D3D49',
    900: '#1F2B35',
  },
  
  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const functionalColors = {
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#2563EB',
  },
};

export const semanticColors = {
  text: {
    primary: brandColors.gray[900],
    secondary: brandColors.gray[700],
    tertiary: brandColors.gray[500],
    disabled: brandColors.gray[400],
    white: '#FFFFFF',
    onOrange: '#FFFFFF',
    onNavy: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: brandColors.gray[50],
    tertiary: brandColors.gray[100],
    dark: brandColors.gray[800],
    orange: brandColors.orange[500],
    navy: brandColors.navy[500],
  },
  border: {
    light: brandColors.gray[200],
    main: brandColors.gray[300],
    dark: brandColors.gray[400],
  },
};

export default {
  ...brandColors,
  functional: functionalColors,
  semantic: semanticColors,
};

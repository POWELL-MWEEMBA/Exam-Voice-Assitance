import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './theme';

// Map Material 3 typography roles to Proxima Nova font families
const fontConfig = {
  displayLarge: {
    fontFamily: 'ProximaNova-Regular',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'ProximaNova-Regular',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'ProximaNova-Regular',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'ProximaNova-Bold',
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'ProximaNova-Bold',
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'ProximaNova-Bold',
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'ProximaNova-Semibold',
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'ProximaNova-Semibold',
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'ProximaNova-Semibold',
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: 'ProximaNova-Regular',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'ProximaNova-Regular',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'ProximaNova-Regular',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: 'ProximaNova-Semibold',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'ProximaNova-Semibold',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'ProximaNova-Semibold',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,           // Orange
    primaryContainer: colors.primary + '20',
    secondary: colors.secondary,        // Navy blue
    secondaryContainer: colors.secondary + '20',
    tertiary: colors.primaryDark,       // Darker orange
    surface: colors.background.default,
    surfaceVariant: colors.background.gray,
    background: colors.background.default,
    error: colors.status.error,
    onPrimary: colors.text.onPrimary,
    onSecondary: colors.text.onSecondary,
    onSurface: colors.text.header,
    onSurfaceVariant: colors.text.paragraph,
    onBackground: colors.text.header,
    outline: colors.border,
    outlineVariant: colors.divider,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export default paperTheme;

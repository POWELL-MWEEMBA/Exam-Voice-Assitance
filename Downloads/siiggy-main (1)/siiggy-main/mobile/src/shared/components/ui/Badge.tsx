import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../../theme';

/**
 * Badge Component
 * Reusable badge for context, price, status, etc.
 */

interface BadgeProps {
  text: string;
  emoji?: string;
  variant?: 'context' | 'price' | 'status';
  backgroundColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  emoji,
  variant = 'context',
  backgroundColor,
}) => {
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    switch (variant) {
      case 'price':
        return colors.primary;
      case 'status':
        return colors.secondary;
      default:
        return 'rgba(0,0,0,0.6)';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.white,
  },
});

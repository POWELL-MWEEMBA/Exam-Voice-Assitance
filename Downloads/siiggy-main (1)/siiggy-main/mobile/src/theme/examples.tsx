/**
 * SIIGGY Theme Examples
 * Practical implementation examples using the Ukweli-inspired color scheme
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, Chip, Avatar } from 'react-native-paper';
import { colors, spacing, borderRadius } from './theme';

/**
 * Example 1: Primary Action Button (Orange)
 */
export const PrimaryButton = () => (
  <Button
    mode="contained"
    buttonColor={colors.primary}
    textColor={colors.text.onPrimary}
    style={styles.button}
  >
    Post Signal
  </Button>
);

/**
 * Example 2: Secondary Action Button (Navy)
 */
export const SecondaryButton = () => (
  <Button
    mode="contained"
    buttonColor={colors.secondary}
    textColor={colors.text.onSecondary}
    style={styles.button}
  >
    View Details
  </Button>
);

/**
 * Example 3: Outlined Button
 */
export const OutlinedButton = () => (
  <Button
    mode="outlined"
    textColor={colors.primary}
    style={[styles.button, { borderColor: colors.primary }]}
  >
    Edit
  </Button>
);

/**
 * Example 4: Signal Card with Orange Accent
 */
export const SignalCardExample = () => (
  <Card style={styles.card}>
    {/* Orange accent border */}
    <View style={styles.accentBorder} />
    <Card.Content>
      <View style={styles.cardHeader}>
        <Chip
          style={styles.categoryChip}
          textStyle={{ color: colors.text.onPrimary }}
        >
          🍕 Food
        </Chip>
        <Text style={styles.timeText}>2h ago</Text>
      </View>
      <Text style={styles.priceText}>R35</Text>
      <Text style={styles.descriptionText}>Fresh bunny chow available</Text>
    </Card.Content>
  </Card>
);

/**
 * Example 5: Navigation Header
 */
export const NavigationHeaderExample = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>SIIGGY</Text>
    <View style={styles.headerButtons}>
      <Avatar.Icon
        size={40}
        icon="bell"
        style={{ backgroundColor: colors.primary }}
        color={colors.text.onPrimary}
      />
    </View>
  </View>
);

/**
 * Example 6: Status Badges
 */
export const StatusBadges = () => (
  <View style={styles.badgeContainer}>
    <Chip
      icon="check-circle"
      style={[styles.badge, { backgroundColor: colors.status.success }]}
      textStyle={{ color: colors.text.white }}
    >
      Active
    </Chip>
    <Chip
      icon="clock"
      style={[styles.badge, { backgroundColor: colors.status.warning }]}
      textStyle={{ color: colors.text.white }}
    >
      Pending
    </Chip>
    <Chip
      icon="star"
      style={[styles.badge, { backgroundColor: colors.primary }]}
      textStyle={{ color: colors.text.onPrimary }}
    >
      Featured
    </Chip>
  </View>
);

/**
 * Example 7: Info Banner with Navy Background
 */
export const InfoBannerExample = () => (
  <View style={styles.infoBanner}>
    <Text style={styles.infoBannerText}>
      📍 Signals near you are being updated
    </Text>
  </View>
);

/**
 * Example 8: Price Highlight
 */
export const PriceHighlightExample = () => (
  <View style={styles.priceContainer}>
    <Text style={styles.priceLabelSmall}>Price</Text>
    <Text style={styles.priceHighlight}>R150</Text>
    <Text style={styles.priceLabelSmall}>negotiable</Text>
  </View>
);

/**
 * Example 9: Context Selector
 */
export const ContextSelectorExample = () => (
  <View style={styles.contextSelector}>
    <View style={[styles.contextItem, styles.contextItemActive]}>
      <Text style={styles.contextEmoji}>🍕</Text>
      <Text style={styles.contextTextActive}>Food</Text>
    </View>
    <View style={styles.contextItem}>
      <Text style={styles.contextEmoji}>🛠️</Text>
      <Text style={styles.contextText}>Services</Text>
    </View>
    <View style={styles.contextItem}>
      <Text style={styles.contextEmoji}>📦</Text>
      <Text style={styles.contextText}>Products</Text>
    </View>
  </View>
);

/**
 * Example 10: Gradient Background (Orange to Light)
 */
export const GradientBackgroundExample = () => (
  <View style={styles.gradientContainer}>
    <Text style={styles.gradientText}>🎉 Special Offer!</Text>
  </View>
);

const styles = StyleSheet.create({
  // Buttons
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    marginVertical: spacing.xs,
  },

  // Cards
  card: {
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    overflow: 'hidden',
  },
  accentBorder: {
    height: 4,
    backgroundColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.primary,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.light,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.paragraph,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
    letterSpacing: 1.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // Badges
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  badge: {
    marginRight: spacing.xs,
  },

  // Info Banner
  infoBanner: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    margin: spacing.md,
  },
  infoBannerText: {
    color: colors.text.white,
    textAlign: 'center',
    fontSize: 14,
  },

  // Price Highlight
  priceContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.gray,
    borderRadius: borderRadius.lg,
  },
  priceLabelSmall: {
    fontSize: 12,
    color: colors.text.light,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceHighlight: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: spacing.xs,
  },

  // Context Selector
  contextSelector: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  contextItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.gray,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contextItemActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  contextEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  contextText: {
    fontSize: 12,
    color: colors.text.paragraph,
    fontWeight: '500',
  },
  contextTextActive: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },

  // Gradient
  gradientContainer: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
  },
  gradientText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
  },
});

export default {
  PrimaryButton,
  SecondaryButton,
  OutlinedButton,
  SignalCardExample,
  NavigationHeaderExample,
  StatusBadges,
  InfoBannerExample,
  PriceHighlightExample,
  ContextSelectorExample,
  GradientBackgroundExample,
};

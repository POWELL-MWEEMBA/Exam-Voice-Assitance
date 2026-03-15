import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { colors, spacing } from '../../../theme';

/**
 * Vendor Avatar Component
 * Displays vendor avatar with verification badge
 */

interface VendorAvatarProps {
  name: string;
  isVerified?: boolean;
  onPress?: () => void;
  size?: number;
}

export const VendorAvatar: React.FC<VendorAvatarProps> = ({
  name,
  isVerified = false,
  onPress,
  size = 48,
}) => {
  const initial = name?.[0]?.toUpperCase() || 'V';

  const content = (
    <View style={styles.container}>
      <Avatar.Text
        size={size}
        label={initial}
        style={styles.avatar}
      />
      {isVerified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedIcon}>✓</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: colors.secondary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  verifiedIcon: {
    fontSize: 10,
    color: colors.text.white,
    fontWeight: '900',
  },
});

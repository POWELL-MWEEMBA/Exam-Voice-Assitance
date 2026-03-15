import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../../../theme';

/**
 * Action Button Component
 * Reusable button with icon and label
 */

interface ActionButtonProps {
  icon: string;
  label?: string;
  onPress: () => void;
  color?: string;
  size?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onPress,
  color = colors.text.white,
  size = 28,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <IconButton
        icon={icon}
        iconColor={color}
        size={size}
        style={styles.iconContainer}
      />
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    color: colors.text.white,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

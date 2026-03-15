import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Context } from '../../../types';
import { colors, spacing } from '../../../theme';

/**
 * Context Picker Component
 * Facebook-style clean list for selecting contexts
 */

interface ContextPickerProps {
  contexts: Context[];
  selectedIds: number[];
  onSelect: (contextId: number) => void;
  onDeselect: (contextId: number) => void;
  maxSelections?: number;
  grouped?: boolean;
  disabled?: boolean;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'food': return '#FF6B6B';
    case 'services': return '#4ECDC4';
    case 'goods': return '#95E1D3';
    default: return colors.primary;
  }
};

export const ContextPicker: React.FC<ContextPickerProps> = ({
  contexts,
  selectedIds,
  onSelect,
  onDeselect,
  maxSelections = 15,
  grouped = true,
  disabled = false,
}) => {
  const handlePress = (contextId: number) => {
    if (disabled) return;
    
    if (selectedIds.includes(contextId)) {
      onDeselect(contextId);
    } else if (selectedIds.length < maxSelections) {
      onSelect(contextId);
    }
  };

  const groupedContexts = grouped
    ? {
        food: contexts.filter((c) => c.parent_category === 'food'),
        services: contexts.filter((c) => c.parent_category === 'services'),
        goods: contexts.filter((c) => c.parent_category === 'goods'),
      }
    : null;

  const renderContextItem = (context: Context) => {
    const isSelected = selectedIds.includes(context.id);
    const categoryColor = getCategoryColor(context.parent_category);
    
    return (
      <Pressable
        key={context.id}
        onPress={() => handlePress(context.id)}
        style={styles.contextItem}
      >
        <View style={[styles.iconCircle, { backgroundColor: categoryColor }]}>
          <Text style={styles.iconText}>{context.emoji}</Text>
        </View>
        <Text style={styles.contextName}>{context.name}</Text>
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color={colors.primary} 
            style={styles.checkIcon} 
          />
        )}
      </Pressable>
    );
  };

  const renderCategory = (title: string, categoryContexts: Context[]) => {
    if (categoryContexts.length === 0) return null;

    return (
      <View key={title}>
        <Text style={styles.categoryTitle}>{title}</Text>
        {categoryContexts.map(renderContextItem)}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {grouped && groupedContexts ? (
        <>
          {renderCategory('Food & Drinks', groupedContexts.food)}
          {renderCategory('Services', groupedContexts.services)}
          {renderCategory('Goods & Products', groupedContexts.goods)}
        </>
      ) : (
        contexts.map(renderContextItem)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginLeft: spacing.md,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  contextName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});

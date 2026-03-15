import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Context } from '../types';
import { colors, spacing, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface ContextPickerProps {
  contexts: Context[];
  selectedIds: number[];
  onSelect: (contextId: number) => void;
  onDeselect: (contextId: number) => void;
  maxSelections?: number;
  grouped?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'food': return '#FF4D4D';
    case 'services': return '#465A73';
    case 'goods': return '#70FF00';
    default: return colors.primary;
  }
};

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🌟' },
  { id: 'food', name: 'Food', emoji: '🍔' },
  { id: 'services', name: 'Services', emoji: '🛠️' },
  { id: 'goods', name: 'Goods', emoji: '📦' },
];

export const ContextPicker: React.FC<ContextPickerProps> = ({
  contexts,
  selectedIds,
  onSelect,
  onDeselect,
  maxSelections = 15,
  grouped = true,
  disabled = false,
  isLoading = false,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isLoading]);

  const handlePress = (contextId: number) => {
    if (disabled) return;
    if (selectedIds.includes(contextId)) {
      onDeselect(contextId);
    } else if (selectedIds.length < maxSelections) {
      onSelect(contextId);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setActiveCategory('all');
    if (onRefresh) onRefresh();
  };

  const filteredContexts = contexts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.parent_category && c.parent_category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || c.parent_category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedContexts = (grouped && searchQuery === '' && activeCategory === 'all')
    ? {
        food: filteredContexts.filter((c) => c.parent_category === 'food'),
        services: filteredContexts.filter((c) => c.parent_category === 'services'),
        goods: filteredContexts.filter((c) => c.parent_category === 'goods'),
        others: filteredContexts.filter((c) => !['food', 'services', 'goods'].includes(c.parent_category)),
      }
    : null;

  const renderSkeletonItem = (index: number) => (
    <View key={`skeleton-${index}`} style={styles.contextItem}>
      <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
      <View style={styles.nameContainer}>
        <View style={{ width: '60%', height: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
        <View style={{ width: '30%', height: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, marginTop: 8 }} />
      </View>
    </View>
  );

  const renderContextItem = (context: Context) => {
    const isSelected = selectedIds.includes(context.id);
    const categoryColor = getCategoryColor(context.parent_category);
    
    return (
      <Pressable
        key={context.id}
        onPress={() => handlePress(context.id)}
        style={({ pressed }) => [
          styles.contextItem,
          isSelected && styles.contextItemActive,
          pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: categoryColor + '20', borderColor: categoryColor + '40', borderWidth: 1 }]}>
          <Text style={styles.iconText}>{context.emoji}</Text>
        </View>
        <View style={styles.nameContainer}>
           <Text style={styles.contextName}>{context.name}</Text>
           <Text style={styles.categoryName}>{context.parent_category?.toUpperCase()}</Text>
        </View>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={26} color={colors.primary} style={styles.checkIcon} />
        ) : (
          <View style={styles.checkPlaceholder} />
        )}
      </Pressable>
    );
  };

  const renderCategory = (title: string, categoryContexts: Context[]) => {
    if (categoryContexts.length === 0) return null;

    return (
      <View key={title} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
           <Text style={styles.categoryTitle}>{title}</Text>
           <View style={styles.badge}><Text style={styles.badgeText}>{categoryContexts.length}</Text></View>
        </View>
        {categoryContexts.map(renderContextItem)}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
        <TextInput
          placeholder="Search contexts..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
          </Pressable>
        )}
      </View>

      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[styles.categoryChip, activeCategory === cat.id && styles.activeChip]}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text style={[styles.chipText, activeCategory === cat.id && styles.activeChipText]}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {isLoading ? (
          <View>{[1, 2, 3, 4, 5, 6].map(renderSkeletonItem)}</View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {groupedContexts && (Object.values(groupedContexts).some(arr => arr.length > 0)) ? (
              <>
                {renderCategory('Food & Drinks', groupedContexts.food)}
                {renderCategory('Services', groupedContexts.services)}
                {renderCategory('Goods & Products', groupedContexts.goods)}
                {groupedContexts.others.length > 0 && renderCategory('Others', groupedContexts.others)}
              </>
            ) : (
              <View style={styles.flatList}>
                {filteredContexts.length > 0 ? (
                   filteredContexts.map(renderContextItem)
                ) : (
                  <View style={styles.emptyState}>
                     <Ionicons name="alert-circle-outline" size={60} color="rgba(255,255,255,0.1)" />
                     <Text style={styles.emptyText}>No Contexts Found</Text>
                     <Text style={styles.emptySubtitle}>We couldn't load the categories. Please check your connection.</Text>
                     <Pressable style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryButtonText}>Refresh List</Text>
                     </Pressable>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {selectedIds.length === 0 && !isLoading && !searchQuery && (
        <View style={styles.guidanceHint}>
           <Ionicons name="bulb-outline" size={16} color={colors.primary} />
           <Text style={styles.hintText}>Tip: Search for specific products or select a category above</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    height: 52,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  chipRow: {
    marginBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeChip: {
    backgroundColor: colors.primary + '1A',
    borderColor: colors.primary + '66',
  },
  chipEmoji: {
    marginRight: 6,
    fontSize: 14,
  },
  chipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeChipText: {
    color: colors.primary,
  },
  container: {
    flex: 1,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: spacing.xs,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  badge: {
     backgroundColor: 'rgba(255,255,255,0.08)',
     paddingHorizontal: 8,
     paddingVertical: 2,
     borderRadius: 10,
     marginLeft: 8,
  },
  badgeText: {
     fontSize: 10,
     color: 'rgba(255,255,255,0.5)',
     fontWeight: '900',
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  contextItemActive: {
    backgroundColor: colors.primary + '0D',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 24,
  },
  nameContainer: {
    flex: 1,
  },
  contextName: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
  },
  categoryName: {
     fontSize: 11,
     color: 'rgba(255,255,255,0.25)',
     fontWeight: 'bold',
     marginTop: 3,
     letterSpacing: 0.5,
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
  checkPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  flatList: {
    paddingTop: spacing.xs,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
     color: '#fff',
     fontSize: 18,
     fontWeight: 'bold',
     marginTop: 16,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  guidanceHint: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     backgroundColor: '#111',
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 14,
     borderTopWidth: 1,
     borderTopColor: 'rgba(255,255,255,0.05)',
  },
  hintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  }
});

export default ContextPicker;



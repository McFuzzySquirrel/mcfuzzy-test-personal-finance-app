import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '@/types';

const CATEGORY_ICONS: Record<string, string> = {
  books: '📚',
  entertainment: '🎉',
  food: '🍔',
  other: '🧾',
  rent: '🏠',
  subscriptions: '📱',
  transport: '🚌',
};

function getCategoryIcon(category: Category): string {
  if (category.icon && category.icon.trim().length > 0) {
    return category.icon;
  }

  return CATEGORY_ICONS[category.name.toLowerCase()] ?? category.name.charAt(0).toUpperCase();
}

export interface CategoryGridProps {
  categories: Category[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export default function CategoryGrid({ categories, onSelect, selectedId }: CategoryGridProps): React.JSX.Element {
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const isSelected = category.id === selectedId;

        return (
          <Pressable
            accessibilityRole="button"
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={[styles.tile, isSelected ? styles.tileSelected : undefined]}
            testID={`category-grid-item-${category.id}`}
          >
            <Text style={styles.icon}>{getCategoryIcon(category)}</Text>
            <Text numberOfLines={1} style={styles.label}>
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tile: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    margin: 6,
    minHeight: 88,
    minWidth: 88,
    paddingHorizontal: 10,
    paddingVertical: 12,
    width: '29%',
  },
  tileSelected: {
    borderWidth: 2,
  },
});
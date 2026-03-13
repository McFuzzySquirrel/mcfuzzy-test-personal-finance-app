import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BudgetProgressBar from '@/components/BudgetProgressBar';
import type { Budget, Category } from '@/types';
import { formatZAR } from '@/utils/currency';

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

export interface CategoryBudgetRowProps {
  budget: Budget | null;
  category: Category;
  spent: number;
}

export default function CategoryBudgetRow({ budget, category, spent }: CategoryBudgetRowProps): React.JSX.Element {
  return (
    <View style={styles.card} testID={`category-budget-row-${category.id}`}>
      <View style={styles.headerRow}>
        <View style={styles.categoryRow}>
          <Text style={styles.icon}>{getCategoryIcon(category)}</Text>
          <View>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.metaText}>{category.isCustom ? 'Custom category' : 'System category'}</Text>
          </View>
        </View>
      </View>

      {budget ? (
        <BudgetProgressBar label={category.name} limit={budget.limitAmount} spent={spent} />
      ) : (
        <View style={styles.noBudgetBlock}>
          <Text style={styles.noBudgetLabel}>No budget set</Text>
          <Text style={styles.noBudgetAmount}>{formatZAR(spent)} spent this month</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerRow: {
    marginBottom: 14,
  },
  icon: {
    fontSize: 22,
    marginRight: 10,
  },
  metaText: {
    fontSize: 12,
    marginTop: 2,
  },
  noBudgetAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  noBudgetBlock: {
    borderRadius: 14,
    paddingHorizontal: 2,
  },
  noBudgetLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
});
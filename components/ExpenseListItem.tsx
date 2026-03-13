import React from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Expense } from '@/types';
import { formatZAR } from '@/utils/currency';

const CATEGORY_ICONS: Record<string, string> = {
  Books: '📚',
  Entertainment: '🎉',
  Food: '🍔',
  Other: '🧾',
  Rent: '🏠',
  Subscriptions: '📱',
  Transport: '🚌',
};

function getCategoryIcon(categoryName: string): string {
  return CATEGORY_ICONS[categoryName] ?? categoryName.charAt(0).toUpperCase();
}

function formatBadgeLabel(expense: Expense): string | null {
  if (expense.type === 'expense') {
    return null;
  }

  return expense.type.charAt(0).toUpperCase() + expense.type.slice(1);
}

export interface ExpenseListItemProps {
  categoryName: string;
  expense: Expense;
  onPress: () => void;
}

export default function ExpenseListItem({ categoryName, expense, onPress }: ExpenseListItemProps): React.JSX.Element {
  const badgeLabel = formatBadgeLabel(expense);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}
      testID={`expense-list-item-${expense.id}`}
    >
      <View style={styles.leftColumn}>
        <View style={styles.rowHeader}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(categoryName)}</Text>
          <View style={styles.categoryBlock}>
            <Text numberOfLines={1} style={styles.categoryName}>
              {categoryName}
            </Text>
            <Text style={styles.dateText}>{dayjs(expense.date).format('D MMM YYYY')}</Text>
          </View>
        </View>
        {typeof expense.note === 'string' && expense.note.trim().length > 0 ? (
          <Text numberOfLines={2} style={styles.noteText}>
            {expense.note}
          </Text>
        ) : null}
        {badgeLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rightColumn}>
        <Text style={styles.amountText}>{formatZAR(expense.amount)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 14,
  },
  categoryBlock: {
    flex: 1,
  },
  categoryIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 13,
    marginTop: 2,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 12,
  },
  noteText: {
    fontSize: 14,
    marginTop: 10,
  },
  rightColumn: {
    justifyContent: 'center',
    minWidth: 96,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
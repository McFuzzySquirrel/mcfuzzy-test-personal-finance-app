import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCategories } from '@/hooks/useCategories';
import { useSplits } from '@/hooks/useSplits';
import type { Expense } from '@/types';
import { formatZAR } from '@/utils/currency';

function getOwedAmount(expense: Expense): number {
  return expense.splitAmount ?? expense.amount;
}

function SplitRow({
  categoryName,
  expense,
  onSettle,
}: {
  categoryName: string;
  expense: Expense;
  onSettle: (expenseId: string) => void;
}): React.JSX.Element {
  return (
    <View style={styles.row} testID={`splits-row-${expense.id}`}>
      <View style={styles.rowMain}>
        <Text style={styles.personText}>{expense.splitWith?.trim() || 'Unknown person'}</Text>
        <Text style={styles.metaText}>{dayjs(expense.date).format('D MMM YYYY')}</Text>
        {expense.type === 'split' ? <Text style={styles.metaText}>Category: {categoryName}</Text> : null}
      </View>
      <View style={styles.rowActions}>
        <Text style={styles.amountText}>{formatZAR(getOwedAmount(expense))}</Text>
        <Pressable
          onPress={() => onSettle(expense.id)}
          style={styles.settleButton}
          testID={`splits-mark-settled-${expense.id}`}
        >
          <Text style={styles.settleButtonText}>Mark settled</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SplitsScreen(): React.JSX.Element {
  const { categories } = useCategories();
  const { error, isLoading, markAsSettled, outstanding } = useSplits();

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name] as const)),
    [categories]
  );

  const theyOweYou = useMemo(
    () => outstanding.filter((expense) => expense.type === 'split' || expense.type === 'lent'),
    [outstanding]
  );
  const youOweThem = useMemo(
    () => outstanding.filter((expense) => expense.type === 'borrowed'),
    [outstanding]
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Outstanding splits</Text>
      <Text style={styles.subtitle}>Track unsettled split, lent, and borrowed entries.</Text>

      {isLoading ? <Text style={styles.statusText}>Loading outstanding entries...</Text> : null}
      {error ? <Text style={styles.statusText}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>They owe you</Text>
        {theyOweYou.length === 0 ? (
          <Text style={styles.statusText} testID="splits-they-owe-empty">
            No unsettled entries.
          </Text>
        ) : (
          theyOweYou.map((expense) => (
            <SplitRow
              categoryName={categoryNameById.get(expense.categoryId) ?? 'Uncategorized'}
              expense={expense}
              key={expense.id}
              onSettle={(expenseId) => {
                void markAsSettled(expenseId);
              }}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>You owe them</Text>
        {youOweThem.length === 0 ? (
          <Text style={styles.statusText} testID="splits-you-owe-empty">
            No unsettled entries.
          </Text>
        ) : (
          youOweThem.map((expense) => (
            <SplitRow
              categoryName={categoryNameById.get(expense.categoryId) ?? 'Uncategorized'}
              expense={expense}
              key={expense.id}
              onSettle={(expenseId) => {
                void markAsSettled(expenseId);
              }}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  metaText: {
    fontSize: 12,
    marginTop: 2,
  },
  personText: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 12,
  },
  rowActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  rowMain: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  settleButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settleButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 14,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
});

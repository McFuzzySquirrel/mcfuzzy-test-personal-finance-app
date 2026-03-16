import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ExportModal from '@/components/ExportModal';
import ExpenseListItem from '@/components/ExpenseListItem';
import type { RootStackParamList, RootTabParamList } from '@/app/navigation/types';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import type { Expense } from '@/types';
import { formatMonthLabel } from '@/utils/date';

type TransactionsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Transactions'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function TransactionsScreen({ navigation }: TransactionsScreenProps): React.JSX.Element {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isExportVisible, setIsExportVisible] = useState(false);
  const { categories } = useCategories();
  const { budgets } = useBudgets(month);
  const { error, expenses, isLoading } = useExpenses(month);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name] as const)),
    [categories]
  );

  const filteredExpenses = useMemo(
    () =>
      selectedCategoryId
        ? expenses.filter((expense) => expense.categoryId === selectedCategoryId)
        : expenses,
    [expenses, selectedCategoryId]
  );

  const renderExpense = ({ item }: { item: Expense }): React.JSX.Element => (
    <ExpenseListItem
      categoryName={categoryNameById.get(item.categoryId) ?? 'Uncategorized'}
      expense={item}
      onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          accessibilityHint="Double tap to view the previous month"
          onPress={() => setMonth(dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM'))}
          style={styles.monthButton}
          testID="transactions-prev-month"
        >
          <Text style={styles.monthButtonText}>Previous</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.monthLabel}>{formatMonthLabel(`${month}-01`)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityHint="Double tap to view the next month"
          onPress={() => setMonth(dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM'))}
          style={styles.monthButton}
          testID="transactions-next-month"
        >
          <Text style={styles.monthButtonText}>Next</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Export expenses"
        accessibilityHint="Double tap to open the export options"
        onPress={() => setIsExportVisible(true)}
        style={styles.exportButton}
        testID="transactions-open-export"
      >
        <Text style={styles.exportButtonText}>Export</Text>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show all categories"
          accessibilityState={{ selected: !selectedCategoryId }}
          onPress={() => setSelectedCategoryId(null)}
          style={[styles.filterChip, !selectedCategoryId ? styles.filterChipSelected : undefined]}
          testID="transactions-category-filter-all"
        >
          <Text style={styles.filterChipText}>All</Text>
        </Pressable>
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${category.name}`}
              accessibilityState={{ selected: isSelected }}
              key={category.id}
              onPress={() => setSelectedCategoryId(category.id)}
              style={[styles.filterChip, isSelected ? styles.filterChipSelected : undefined]}
              testID={`transactions-category-filter-${category.id}`}
            >
              <Text style={styles.filterChipText}>{category.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? <Text style={styles.statusText}>Loading expenses...</Text> : null}
      {error ? <Text style={styles.statusText}>{error}</Text> : null}
      {!isLoading && !error && filteredExpenses.length === 0 ? (
        <Text style={styles.statusText}>No expenses found for this filter.</Text>
      ) : null}

      <FlatList
        accessibilityRole="list"
        contentContainerStyle={styles.listContent}
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        showsVerticalScrollIndicator={false}
      />

      <ExportModal
        budgets={budgets}
        categories={categories}
        expenses={expenses}
        month={month}
        onClose={() => setIsExportVisible(false)}
        onMonthChange={setMonth}
        visible={isExportVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  exportButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipSelected: {
    borderWidth: 2,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtersRow: {
    flexGrow: 0,
    marginBottom: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  monthButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monthButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 14,
  },
});

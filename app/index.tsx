import React from 'react';
import { ScrollView } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CategoryBudgetRow from '@/components/CategoryBudgetRow';
import { WeeklySummary } from '@/components/WeeklySummary';
import type { RootStackParamList, RootTabParamList } from '@/app/navigation/types';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { formatZAR } from '@/utils/currency';
import { formatMonthKey, formatMonthLabel } from '@/utils/date';

type DashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

const COLORS = {
  fabBackground: '#111827',
  fabForeground: '#ffffff',
} as const;

export default function DashboardScreen({ navigation }: DashboardScreenProps): React.JSX.Element {
  const currentMonth = formatMonthKey();
  const { categoryRows, error, hasAnyBudget, hasMonthlyExpenses, isLoading, topCategory, totalRemaining, totalSpent } =
    useDashboardSummary(currentMonth);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Student Finance</Text>
        <Text style={styles.subtitle}>{formatMonthLabel(currentMonth)}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard} testID="dashboard-summary-spent-card">
            <Text style={styles.summaryLabel}>Spent this month</Text>
            <Text style={styles.summaryValue}>{isLoading ? 'Loading...' : formatZAR(totalSpent)}</Text>
            <Text style={styles.summaryMeta}>Current month total</Text>
          </View>

          <View style={styles.summaryCard} testID="dashboard-summary-remaining-card">
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValue}>
              {isLoading ? 'Loading...' : totalRemaining === null ? 'No budget set' : formatZAR(totalRemaining)}
            </Text>
            <Text style={styles.summaryMeta}>{hasAnyBudget ? 'Budget left this month' : 'Set limits to track this'}</Text>
          </View>

          <View style={styles.summaryCard} testID="dashboard-summary-top-category-card">
            <Text style={styles.summaryLabel}>Top category</Text>
            <Text numberOfLines={1} style={styles.summaryValue}>
              {isLoading ? 'Loading...' : topCategory ? topCategory.category.name : 'No spend yet'}
            </Text>
            <Text style={styles.summaryMeta}>
              {topCategory ? formatZAR(topCategory.spent) : 'Your biggest category will show here'}
            </Text>
          </View>
        </View>

        {!hasAnyBudget ? (
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'Budget' })}
            style={styles.banner}
            testID="dashboard-no-budget-banner"
          >
            <Text style={styles.bannerTitle}>Set your monthly budgets -&gt;</Text>
            <Text style={styles.bannerText}>Add category limits to see remaining budget and progress bars.</Text>
          </Pressable>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !hasMonthlyExpenses ? (
          <View style={styles.zeroState}>
            <Text style={styles.zeroIllustration}>🪙</Text>
            <Text style={styles.zeroTitle}>No expenses yet</Text>
            <Text style={styles.zeroText}>Start with your first quick entry and the dashboard will fill itself in.</Text>
            <Pressable
              onPress={() => navigation.navigate('AddExpense')}
              style={styles.zeroButton}
              testID="dashboard-zero-state-add-expense"
            >
              <Text style={styles.zeroButtonText}>Log your first expense -&gt;</Text>
            </Pressable>
          </View>
        ) : null}

        {categoryRows.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category budgets</Text>
            {categoryRows.map((row) => (
              <CategoryBudgetRow budget={row.budget} category={row.category} key={row.category.id} spent={row.spent} />
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly summary</Text>
          <WeeklySummary />
        </View>

        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'Transactions' })}
          style={styles.secondaryButton}
          testID="dashboard-view-transactions-button"
        >
          <Text style={styles.secondaryButtonText}>View Transactions</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Splits')}
          style={styles.secondaryButton}
          testID="dashboard-open-splits-button"
        >
          <Text style={styles.secondaryButtonText}>View Splits</Text>
        </Pressable>
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('AddExpense')}
        style={styles.fab}
        testID="dashboard-add-expense-button"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  bannerText: {
    fontSize: 14,
    marginTop: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: COLORS.fabBackground,
    borderRadius: 999,
    bottom: 24,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    width: 58,
  },
  fabText: {
    color: COLORS.fabForeground,
    fontSize: 30,
    lineHeight: 30,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 126,
    padding: 18,
    width: '100%',
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryMeta: {
    fontSize: 13,
    marginTop: 8,
  },
  summaryRow: {
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 6,
  },
  zeroButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  zeroButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  zeroIllustration: {
    fontSize: 38,
    marginBottom: 10,
  },
  zeroState: {
    alignItems: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    padding: 20,
  },
  zeroText: {
    fontSize: 14,
    marginTop: 8,
  },
  zeroTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
});

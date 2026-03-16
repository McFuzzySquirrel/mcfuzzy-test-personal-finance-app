import React, { useMemo, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { MonthlyBarChart } from '@/components/MonthlyBarChart';
import { SpendingPieChart } from '@/components/SpendingPieChart';
import { useCategoryTotals, useMonthlyTrend } from '@/hooks/useInsights';
import { formatZAR } from '@/utils/currency';
import { formatMonthKey, formatMonthLabel, getLastNMonthKeys } from '@/utils/date';

type InsightsView = 'this-month' | 'trends';

const CATEGORY_ICONS: Record<string, string> = {
  books: '📚',
  entertainment: '🎉',
  food: '🍔',
  other: '🧾',
  rent: '🏠',
  subscriptions: '📱',
  transport: '🚌',
};

const COLORS = {
  accent: '#0f766e',
  border: '#d6d3d1',
  muted: '#57534e',
  selectedText: '#fafaf9',
  surface: '#fffdf8',
  surfaceAlt: '#f5f5f4',
  text: '#1c1917',
} as const;

function getCategoryIcon(categoryName: string, icon?: string): string {
  if (icon && icon.trim().length > 0) {
    return icon;
  }

  return CATEGORY_ICONS[categoryName.toLowerCase()] ?? categoryName.charAt(0).toUpperCase();
}

function LoadingPanel({ label }: { label: string }): React.JSX.Element {
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.loadingPanel}>
      <View style={styles.loadingBlockLarge} />
      <View style={styles.loadingBlockMedium} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

export default function InsightsScreen(): React.JSX.Element {
  const currentMonth = formatMonthKey();
  const months = useMemo(() => getLastNMonthKeys(6), []);
  const [selectedView, setSelectedView] = useState<InsightsView>('this-month');

  const {
    data: categoryTotals,
    error: categoryError,
    isLoading: categoryLoading,
    total: monthTotal,
  } = useCategoryTotals(currentMonth);
  const { data: monthlyTrend, error: trendError, isLoading: trendLoading } = useMonthlyTrend(months);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container} testID="insights-screen">
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>{formatMonthLabel(currentMonth)}</Text>

      <View style={styles.toggleRow}>
        <Pressable
          accessibilityLabel="Show this month spending"
          accessibilityRole="button"
          accessibilityState={{ selected: selectedView === 'this-month' }}
          onPress={() => setSelectedView('this-month')}
          style={[styles.toggleButton, selectedView === 'this-month' ? styles.toggleButtonSelected : null]}
          testID="insights-toggle-this-month"
        >
          <Text style={[styles.toggleText, selectedView === 'this-month' ? styles.toggleTextSelected : null]}>
            This Month
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Show spending trends"
          accessibilityRole="button"
          accessibilityState={{ selected: selectedView === 'trends' }}
          onPress={() => setSelectedView('trends')}
          style={[styles.toggleButton, selectedView === 'trends' ? styles.toggleButtonSelected : null]}
          testID="insights-toggle-trends"
        >
          <Text style={[styles.toggleText, selectedView === 'trends' ? styles.toggleTextSelected : null]}>Trends</Text>
        </Pressable>
      </View>

      {selectedView === 'this-month' ? (
        <View>
          <View
            accessible
            accessibilityLabel={
              categoryLoading
                ? 'This month total: loading'
                : `This month total: ${formatZAR(monthTotal)}`
            }
            accessibilityRole="summary"
            style={styles.summaryCard}
          >
            <Text style={styles.summaryLabel}>This month total</Text>
            <Text style={styles.summaryValue}>{categoryLoading ? 'Loading...' : formatZAR(monthTotal)}</Text>
            <Text style={styles.summaryMeta}>Spending grouped by category with labels and exact-value callouts.</Text>
          </View>

          {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}

          {categoryLoading ? <LoadingPanel label="Loading this month" /> : <SpendingPieChart data={categoryTotals} />}

          <View accessibilityRole="list" style={styles.legendSection}>
            <Text style={styles.sectionTitle}>Category legend</Text>

            {categoryTotals.length === 0 && !categoryLoading ? (
              <View
                accessibilityLabel="No categories to show for this month yet"
                style={styles.legendEmptyState}
              >
                <Text style={styles.legendEmptyText}>No categories to show for this month yet.</Text>
              </View>
            ) : null}

            {categoryTotals.map((item) => {
              const percentage = monthTotal > 0 ? Math.round((item.total / monthTotal) * 100) : 0;

              return (
                <View
                  accessible
                  accessibilityLabel={`${item.categoryName}, ${formatZAR(item.total)}, ${percentage}% of monthly spend`}
                  accessibilityRole="text"
                  key={item.categoryId}
                  style={styles.legendRow}
                >
                  <View style={styles.legendIdentity}>
                    <Text style={styles.legendIcon}>{getCategoryIcon(item.categoryName, item.icon)}</Text>
                    <View>
                      <Text style={styles.legendName}>{item.categoryName}</Text>
                      <Text style={styles.legendMeta}>{percentage}% of monthly spend</Text>
                    </View>
                  </View>
                  <Text style={styles.legendAmount}>{formatZAR(item.total)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View>
          <View
            accessible
            accessibilityLabel={
              trendLoading
                ? 'Six-month trend: loading'
                : `Six-month trend: ${monthlyTrend.length} months`
            }
            accessibilityRole="summary"
            style={styles.summaryCard}
          >
            <Text style={styles.summaryLabel}>Six-month trend</Text>
            <Text style={styles.summaryValue}>{trendLoading ? 'Loading...' : `${monthlyTrend.length} months`}</Text>
            <Text style={styles.summaryMeta}>Current month is highlighted to make direction changes easier to spot.</Text>
          </View>

          {trendError ? <Text style={styles.errorText}>{trendError}</Text> : null}

          {trendLoading ? <LoadingPanel label="Loading trends" /> : <MonthlyBarChart data={monthlyTrend} />}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  errorText: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 14,
  },
  legendAmount: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  legendEmptyState: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  legendEmptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  legendIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  legendIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  legendMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  legendName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  legendRow: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  legendSection: {
    marginTop: 18,
  },
  loadingBlockLarge: {
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 999,
    height: 180,
    marginBottom: 18,
    width: 180,
  },
  loadingBlockMedium: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    height: 56,
    marginBottom: 12,
    width: '100%',
  },
  loadingLabel: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingPanel: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 320,
    padding: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 18,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 8,
  },
  summaryMeta: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 6,
  },
  toggleButton: {
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  toggleButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  toggleRow: {
    columnGap: 10,
    flexDirection: 'row',
    marginBottom: 18,
  },
  toggleText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  toggleTextSelected: {
    color: COLORS.selectedText,
  },
});

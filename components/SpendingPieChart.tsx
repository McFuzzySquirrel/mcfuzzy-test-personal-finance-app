import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import type { pieDataItem } from 'react-native-gifted-charts';

import type { CategoryTotalDatum } from '@/hooks/useInsights';
import { formatZAR } from '@/utils/currency';

const CHART_COLORS = ['#0f766e', '#f59e0b', '#2563eb', '#dc2626', '#7c3aed', '#059669', '#ea580c', '#475569'];
const SURFACE_COLORS = {
  border: '#d6d3d1',
  card: '#fffdf8',
  emptyAccent: '#0f766e',
  muted: '#57534e',
  text: '#1c1917',
  tooltip: '#292524',
  tooltipText: '#fafaf9',
} as const;

export interface SpendingPieChartProps {
  data: CategoryTotalDatum[];
}

function buildTooltip(item: CategoryTotalDatum, percentage: number): React.JSX.Element {
  return (
    <View style={styles.tooltipCard}>
      <Text style={styles.tooltipTitle}>{item.categoryName}</Text>
      <Text style={styles.tooltipValue}>{formatZAR(item.total)}</Text>
      <Text style={styles.tooltipMeta}>{percentage}% of this month</Text>
    </View>
  );
}

export function SpendingPieChart({ data }: SpendingPieChartProps): React.JSX.Element {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.total, 0), [data]);

  const chartData = useMemo<pieDataItem[]>(() => {
    if (total === 0) {
      return [];
    }

    return data.map((item, index) => {
      const percentage = Math.max(1, Math.round((item.total / total) * 100));

      return {
        color: CHART_COLORS[index % CHART_COLORS.length],
        text: `${item.categoryName} ${percentage}%`,
        textColor: SURFACE_COLORS.text,
        textSize: 11,
        tooltipComponent: () => buildTooltip(item, percentage),
        value: item.total,
      };
    });
  }, [data, total]);

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyState} testID="spending-pie-chart">
        <Text style={styles.emptyIllustration}>◔</Text>
        <Text style={styles.emptyTitle}>No expenses this month</Text>
        <Text style={styles.emptyText}>Log spending to see where your money is going by category.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="spending-pie-chart">
      <PieChart
        centerLabelComponent={() => (
          <View style={styles.centerLabel}>
            <Text style={styles.centerLabelCaption}>Monthly total</Text>
            <Text style={styles.centerLabelValue}>{formatZAR(total)}</Text>
          </View>
        )}
        data={chartData}
        donut
        focusOnPress
        innerRadius={78}
        labelsPosition="outward"
        persistTooltip
        radius={118}
        showText
        showTooltip
        strokeColor={SURFACE_COLORS.card}
        strokeWidth={2}
        textColor={SURFACE_COLORS.text}
        textSize={11}
        tooltipHorizontalShift={-12}
        tooltipVerticalShift={12}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: SURFACE_COLORS.card,
    borderColor: SURFACE_COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 320,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  centerLabel: {
    alignItems: 'center',
    maxWidth: 110,
  },
  centerLabelCaption: {
    color: SURFACE_COLORS.muted,
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  centerLabelValue: {
    color: SURFACE_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyIllustration: {
    color: SURFACE_COLORS.emptyAccent,
    fontSize: 54,
    lineHeight: 56,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: SURFACE_COLORS.card,
    borderColor: SURFACE_COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 320,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyText: {
    color: SURFACE_COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyTitle: {
    color: SURFACE_COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipCard: {
    backgroundColor: SURFACE_COLORS.tooltip,
    borderRadius: 16,
    maxWidth: 180,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tooltipMeta: {
    color: SURFACE_COLORS.tooltipText,
    fontSize: 12,
    marginTop: 4,
  },
  tooltipTitle: {
    color: SURFACE_COLORS.tooltipText,
    fontSize: 13,
    fontWeight: '700',
  },
  tooltipValue: {
    color: SURFACE_COLORS.tooltipText,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import type { barDataItem } from 'react-native-gifted-charts';
import dayjs from 'dayjs';

import type { MonthlyTrendDatum } from '@/hooks/useInsights';
import { formatZAR } from '@/utils/currency';

const CHART_COLORS = {
  currentMonth: '#0f766e',
  defaultBar: '#94a3b8',
  grid: '#d6d3d1',
  surface: '#fffdf8',
  text: '#1c1917',
  yAxis: '#57534e',
} as const;

export interface MonthlyBarChartProps {
  data: MonthlyTrendDatum[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps): React.JSX.Element {
  const currentMonth = dayjs().format('YYYY-MM');

  const chartData = useMemo<barDataItem[]>(() => {
    return data.map((item) => ({
      frontColor: item.month === currentMonth ? CHART_COLORS.currentMonth : CHART_COLORS.defaultBar,
      label: dayjs(`${item.month}-01`).format('MMM'),
      value: item.total,
    }));
  }, [currentMonth, data]);

  const maxValue = useMemo(() => {
    const highest = data.reduce((max, item) => Math.max(max, item.total), 0);
    return highest > 0 ? highest : 100;
  }, [data]);

  const chartAccessibilityLabel = useMemo(() => {
    if (chartData.length === 0 || data.every((item) => item.total === 0)) {
      return 'No spending trend data available';
    }

    const breakdown = data
      .map((item) => {
        const label = dayjs(`${item.month}-01`).format('MMM');
        return `${label} ${formatZAR(item.total)}`;
      })
      .join(', ');

    return `Monthly spending trend: ${breakdown}`;
  }, [chartData.length, data]);

  if (chartData.length === 0 || data.every((item) => item.total === 0)) {
    return (
      <View
        accessibilityLabel="No spending trend data available"
        style={styles.emptyState}
        testID="monthly-bar-chart"
      >
        <Text style={styles.emptyTitle}>No spending trend yet</Text>
        <Text style={styles.emptyText}>Your last six months will appear here once you start logging expenses.</Text>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={chartAccessibilityLabel}
      accessibilityRole="image"
      style={styles.card}
      testID="monthly-bar-chart"
    >
      <BarChart
        adjustToWidth
        barBorderRadius={10}
        barWidth={28}
        data={chartData}
        disableScroll
        formatYLabel={(label) => formatZAR(Math.round(Number.parseFloat(label)))}
        frontColor={CHART_COLORS.defaultBar}
        height={220}
        hideOrigin
        initialSpacing={10}
        maxValue={maxValue}
        noOfSections={4}
        roundedTop
        rulesColor={CHART_COLORS.grid}
        spacing={18}
        xAxisColor={CHART_COLORS.grid}
        xAxisLabelTextStyle={styles.xAxisLabel}
        yAxisColor={CHART_COLORS.grid}
        yAxisLabelWidth={76}
        yAxisTextStyle={styles.yAxisLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CHART_COLORS.surface,
    borderColor: CHART_COLORS.grid,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 320,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: CHART_COLORS.surface,
    borderColor: CHART_COLORS.grid,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 320,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyText: {
    color: CHART_COLORS.yAxis,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: CHART_COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  xAxisLabel: {
    color: CHART_COLORS.text,
    fontSize: 12,
    marginTop: 8,
  },
  yAxisLabel: {
    color: CHART_COLORS.yAxis,
    fontSize: 11,
  },
});
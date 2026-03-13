import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { useWeeklySummary } from '@/hooks/useInsights';
import { formatZAR } from '@/utils/currency';
import { getWeekRange } from '@/utils/date';

const WIDGET_COLORS = {
  accent: '#0f766e',
  barTrack: '#e7e5e4',
  border: '#d6d3d1',
  muted: '#57534e',
  surface: '#fffdf8',
  text: '#1c1917',
} as const;

export function WeeklySummary(): React.JSX.Element {
  const weekStart = getWeekRange().start;
  const { data, error, isLoading, total } = useWeeklySummary(weekStart);

  const highestTotal = useMemo(() => data.reduce((max, item) => Math.max(max, item.total), 0), [data]);

  return (
    <View style={styles.card} testID="weekly-summary-widget">
      <View style={styles.headerRow}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.total}>{isLoading ? 'Loading...' : formatZAR(total)}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <View style={styles.loadingLine} />
          <View style={styles.loadingLine} />
          <View style={styles.loadingLine} />
        </View>
      ) : (
        <View style={styles.list}>
          {data.map((item) => {
            const width: DimensionValue = highestTotal > 0 ? `${Math.max(8, (item.total / highestTotal) * 100)}%` : '8%';

            return (
              <View key={item.date} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{item.dayLabel}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width }]} />
                </View>
                <Text style={styles.dayAmount}>{formatZAR(item.total)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barFill: {
    backgroundColor: WIDGET_COLORS.accent,
    borderRadius: 999,
    height: 10,
  },
  barTrack: {
    backgroundColor: WIDGET_COLORS.barTrack,
    borderRadius: 999,
    flex: 1,
    height: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: WIDGET_COLORS.surface,
    borderColor: WIDGET_COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  dayAmount: {
    color: WIDGET_COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 72,
    textAlign: 'right',
  },
  dayLabel: {
    color: WIDGET_COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 34,
  },
  dayRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  errorText: {
    color: WIDGET_COLORS.muted,
    fontSize: 13,
    marginBottom: 10,
  },
  headerRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  list: {
    marginTop: 2,
  },
  loadingBlock: {
    marginTop: 2,
  },
  loadingLine: {
    backgroundColor: WIDGET_COLORS.barTrack,
    borderRadius: 999,
    height: 12,
    marginBottom: 10,
    width: '100%',
  },
  title: {
    color: WIDGET_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  total: {
    color: WIDGET_COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
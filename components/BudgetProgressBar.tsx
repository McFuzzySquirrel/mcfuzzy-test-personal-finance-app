import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatZAR } from '@/utils/currency';

export interface BudgetProgressBarProps {
  label: string;
  limit: number;
  spent: number;
}

const COLORS = {
  ok: '#2f855a',
  over: '#c53030',
  warning: '#b7791f',
  track: '#e2e8f0',
  textOnColor: '#ffffff',
} as const;

type BudgetStatus = 'ok' | 'warning' | 'over';

function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) {
    return 'ok';
  }

  const ratio = spent / limit;
  if (ratio >= 1) {
    return 'over';
  }

  if (ratio >= 0.8) {
    return 'warning';
  }

  return 'ok';
}

function getStatusIcon(status: BudgetStatus): string {
  switch (status) {
    case 'warning':
      return '!';
    case 'over':
      return '▲';
    default:
      return '○';
  }
}

export default function BudgetProgressBar({ label, limit, spent }: BudgetProgressBarProps): React.JSX.Element {
  const status = getBudgetStatus(spent, limit);
  const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  const statusStyles = useMemo(() => {
    switch (status) {
      case 'warning':
        return {
          badge: styles.statusWarning,
          fill: styles.fillWarning,
          label: 'Warning',
        };
      case 'over':
        return {
          badge: styles.statusOver,
          fill: styles.fillOver,
          label: 'Over budget',
        };
      default:
        return {
          badge: styles.statusOk,
          fill: styles.fillOk,
          label: 'On track',
        };
    }
  }, [status]);

  return (
    <View
      accessible={true}
      accessibilityLabel={`${label}: ${statusStyles.label}, ${formatZAR(spent)} of ${formatZAR(limit)}, ${Math.round(progress)} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        <View
          accessibilityLabel={statusStyles.label}
          style={[styles.statusBadge, statusStyles.badge]}
        >
          <Text importantForAccessibility="no" style={styles.statusIcon}>{getStatusIcon(status)}</Text>
        </View>
      </View>

      <View importantForAccessibility="no" style={styles.track}>
        <View style={[styles.fillBase, statusStyles.fill, { width: `${progress}%` }]} />
      </View>

      <Text importantForAccessibility="no" style={styles.amountText}>{`${formatZAR(spent)} / ${formatZAR(limit)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amountText: {
    fontSize: 13,
    marginTop: 8,
  },
  container: {
    width: '100%',
  },
  fillBase: {
    borderRadius: 999,
    height: '100%',
  },
  fillOk: {
    backgroundColor: COLORS.ok,
  },
  fillOver: {
    backgroundColor: COLORS.over,
  },
  fillWarning: {
    backgroundColor: COLORS.warning,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingRight: 12,
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  statusIcon: {
    color: COLORS.textOnColor,
    fontSize: 12,
    fontWeight: '700',
  },
  statusOk: {
    backgroundColor: COLORS.ok,
  },
  statusOver: {
    backgroundColor: COLORS.over,
  },
  statusWarning: {
    backgroundColor: COLORS.warning,
  },
  track: {
    backgroundColor: COLORS.track,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
});
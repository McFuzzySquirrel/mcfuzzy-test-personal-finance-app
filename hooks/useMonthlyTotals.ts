import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getMonthlyTotalByCategory } from '@/db/expenses';
import { useDatabase } from '@/store/DatabaseProvider';

export interface UseMonthlyTotalsResult {
  error: string | null;
  isLoading: boolean;
  refreshTotals: () => Promise<void>;
  totalsByCategoryId: Record<string, number>;
}

export function useMonthlyTotals(month: string): UseMonthlyTotalsResult {
  const db = useDatabase();
  const [totalsByCategoryId, setTotalsByCategoryId] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTotals = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const rows = await getMonthlyTotalByCategory(db, month);
      const nextTotals = rows.reduce<Record<string, number>>((accumulator, row) => {
        accumulator[row.categoryId] = row.total;
        return accumulator;
      }, {});

      setTotalsByCategoryId(nextTotals);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load monthly totals.');
    } finally {
      setIsLoading(false);
    }
  }, [db, month]);

  useEffect(() => {
    void refreshTotals();
  }, [refreshTotals]);

  useFocusEffect(
    useCallback(() => {
      void refreshTotals();
      return undefined;
    }, [refreshTotals])
  );

  return useMemo(
    () => ({
      error,
      isLoading,
      refreshTotals,
      totalsByCategoryId,
    }),
    [error, isLoading, refreshTotals, totalsByCategoryId]
  );
}
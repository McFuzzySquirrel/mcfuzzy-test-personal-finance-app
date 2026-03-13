import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getOutstandingSplits, markSplitSettled } from '@/db/expenses';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Expense } from '@/types';

export interface UseSplitsResult {
  error: string | null;
  isLoading: boolean;
  outstanding: Expense[];
  markAsSettled: (expenseId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSplits(): UseSplitsResult {
  const db = useDatabase();
  const [outstanding, setOutstanding] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const rows = await getOutstandingSplits(db);
      setOutstanding(rows);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load outstanding splits.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  const markAsSettled = useCallback(
    async (expenseId: string): Promise<void> => {
      await markSplitSettled(db, expenseId);
      await refresh();
    },
    [db, refresh]
  );

  return useMemo(
    () => ({
      error,
      isLoading,
      markAsSettled,
      outstanding,
      refresh,
    }),
    [error, isLoading, markAsSettled, outstanding, refresh]
  );
}

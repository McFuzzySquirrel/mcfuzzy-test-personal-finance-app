import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import { insertExpense } from '@/db/expenses';
import { createRecurringInstance, getDueRecurringExpenses, getRecurringTemplates } from '@/db/recurring';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Expense } from '@/types';
import { formatISODate, formatMonthKey } from '@/utils/date';

function buildRecurringDate(dayOfMonth: number): string {
  return `${formatMonthKey()}-${String(dayOfMonth).padStart(2, '0')}`;
}

export interface UseRecurringResult {
  error: string | null;
  isLoading: boolean;
  recurringList: Expense[];
  addRecurringTemplate: (draft: { amount: number; categoryId: string; dayOfMonth: number; note?: string }) => Promise<void>;
  autoCreateDue: (asOf?: string) => Promise<number>;
  refreshRecurring: () => Promise<void>;
}

export function useRecurring(): UseRecurringResult {
  const db = useDatabase();
  const [recurringList, setRecurringList] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRecurring = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const templates = await getRecurringTemplates(db);
      setRecurringList(templates);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load recurring expenses.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void refreshRecurring();
  }, [refreshRecurring]);

  const addRecurringTemplate = useCallback(
    async (draft: { amount: number; categoryId: string; dayOfMonth: number; note?: string }): Promise<void> => {
      const day = Math.min(28, Math.max(1, draft.dayOfMonth));

      await insertExpense(db, {
        amount: draft.amount,
        categoryId: draft.categoryId,
        date: buildRecurringDate(day),
        isRecurring: true,
        note: draft.note,
        recurringInterval: 'monthly',
        settled: false,
        type: 'expense',
      });

      await refreshRecurring();
    },
    [db, refreshRecurring]
  );

  const autoCreateDue = useCallback(
    async (asOf = formatISODate()): Promise<number> => {
      const dueTemplates = await getDueRecurringExpenses(db, asOf);
      let createdCount = 0;
      const asOfDate = dayjs(asOf);

      for (const template of dueTemplates) {
        const dayOfMonth = template.date.slice(8, 10);
        const instanceDate = `${asOfDate.format('YYYY-MM')}-${dayOfMonth}`;

        try {
          await createRecurringInstance(db, template.id, instanceDate);
          createdCount += 1;
        } catch {
          // Ignore already-created rows or race-like retries while keeping app-open startup resilient.
        }
      }

      return createdCount;
    },
    [db]
  );

  return useMemo(
    () => ({
      addRecurringTemplate,
      autoCreateDue,
      error,
      isLoading,
      recurringList,
      refreshRecurring,
    }),
    [addRecurringTemplate, autoCreateDue, error, isLoading, recurringList, refreshRecurring]
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  LAST_ACTIVE_MONTH_KEY,
  getAppStateValue,
  setAppStateValue,
} from '@/db/appState';
import { deleteBudget, getBudgetsByMonth, rolloverBudgets, upsertBudget } from '@/db/budgets';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Budget } from '@/types';

export interface UseBudgetsResult {
  budgetByCategoryId: Map<string, Budget>;
  budgets: Budget[];
  copyBudgetsFromMonth: (fromMonth: string) => Promise<void>;
  deleteBudgetForCategory: (categoryId: string) => Promise<void>;
  error: string | null;
  hasAnyBudget: boolean;
  isLoading: boolean;
  refreshBudgets: () => Promise<void>;
  saveBudget: (budget: Budget) => Promise<Budget>;
}

export function useBudgets(month: string): UseBudgetsResult {
  const db = useDatabase();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBudgets = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const lastActiveMonth = await getAppStateValue(db, LAST_ACTIVE_MONTH_KEY);

      if (lastActiveMonth && lastActiveMonth !== month) {
        await rolloverBudgets(db, lastActiveMonth, month);
      }

      await setAppStateValue(db, LAST_ACTIVE_MONTH_KEY, month);

      const nextBudgets = await getBudgetsByMonth(db, month);
      setBudgets(nextBudgets);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load budgets.');
    } finally {
      setIsLoading(false);
    }
  }, [db, month]);

  useEffect(() => {
    void refreshBudgets();
  }, [refreshBudgets]);

  useFocusEffect(
    useCallback(() => {
      void refreshBudgets();
      return undefined;
    }, [refreshBudgets])
  );

  const saveBudget = useCallback(
    async (budget: Budget): Promise<Budget> => {
      const savedBudget = await upsertBudget(db, budget);
      await refreshBudgets();
      return savedBudget;
    },
    [db, refreshBudgets]
  );

  const deleteBudgetForCategory = useCallback(
    async (categoryId: string): Promise<void> => {
      await deleteBudget(db, categoryId, month);
      await refreshBudgets();
    },
    [db, month, refreshBudgets]
  );

  const copyBudgetsFromMonth = useCallback(
    async (fromMonth: string): Promise<void> => {
      await rolloverBudgets(db, fromMonth, month);
      await refreshBudgets();
    },
    [db, month, refreshBudgets]
  );

  const budgetByCategoryId = useMemo(
    () => new Map(budgets.map((budget) => [budget.categoryId, budget] as const)),
    [budgets]
  );

  return {
    budgetByCategoryId,
    budgets,
    copyBudgetsFromMonth,
    deleteBudgetForCategory,
    error,
    hasAnyBudget: budgets.length > 0,
    isLoading,
    refreshBudgets,
    saveBudget,
  };
}
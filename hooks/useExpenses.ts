import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { deleteExpense, getExpenseById, getExpensesByMonth, insertExpense, updateExpense } from '@/db/expenses';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Expense } from '@/types';

export interface UseExpensesResult {
  expenses: Expense[];
  error: string | null;
  isLoading: boolean;
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense>;
  getExpense: (expenseId: string) => Promise<Expense | null>;
  refreshExpenses: () => Promise<void>;
  removeExpense: (expenseId: string) => Promise<void>;
  saveExpense: (expenseId: string, fields: Partial<Expense>) => Promise<Expense>;
}

export function useExpenses(month?: string): UseExpensesResult {
  const db = useDatabase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(month));

  const refreshExpenses = useCallback(async (): Promise<void> => {
    if (!month) {
      setExpenses([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    try {
      const nextExpenses = await getExpensesByMonth(db, month);
      setExpenses(nextExpenses);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load expenses.');
    } finally {
      setIsLoading(false);
    }
  }, [db, month]);

  useEffect(() => {
    if (month) {
      void refreshExpenses();
      return;
    }

    setIsLoading(false);
  }, [month, refreshExpenses]);

  useFocusEffect(
    useCallback(() => {
      if (month) {
        void refreshExpenses();
      }

      return undefined;
    }, [month, refreshExpenses])
  );

  const createExpense = useCallback(
    async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
      const created = await insertExpense(db, expense);

      if (month && created.date.startsWith(month)) {
        await refreshExpenses();
      }

      return created;
    },
    [db, month, refreshExpenses]
  );

  const getExpense = useCallback(async (expenseId: string): Promise<Expense | null> => getExpenseById(db, expenseId), [db]);

  const saveExpense = useCallback(
    async (expenseId: string, fields: Partial<Expense>): Promise<Expense> => {
      const updated = await updateExpense(db, expenseId, fields);

      if (month) {
        await refreshExpenses();
      }

      return updated;
    },
    [db, month, refreshExpenses]
  );

  const removeExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      await deleteExpense(db, expenseId);

      if (month) {
        await refreshExpenses();
      }
    },
    [db, month, refreshExpenses]
  );

  return {
    expenses,
    error,
    isLoading,
    createExpense,
    getExpense,
    refreshExpenses,
    removeExpense,
    saveExpense,
  };
}
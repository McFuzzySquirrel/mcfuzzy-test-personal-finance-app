import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import { getMonthlyTotalByCategory, getMonthlyTotals, getWeeklyTotalsByDay } from '@/db/expenses';
import { useCategories } from '@/hooks/useCategories';
import { useDatabase } from '@/store/DatabaseProvider';

export interface CategoryTotalDatum {
  categoryId: string;
  categoryName: string;
  icon?: string;
  total: number;
}

export interface MonthlyTrendDatum {
  month: string;
  total: number;
}

export interface WeeklySummaryDatum {
  date: string;
  dayLabel: string;
  total: number;
}

interface BaseInsightsResult {
  error: string | null;
  isLoading: boolean;
}

export interface UseCategoryTotalsResult extends BaseInsightsResult {
  data: CategoryTotalDatum[];
  refreshCategoryTotals: () => Promise<void>;
  total: number;
}

export interface UseMonthlyTrendResult extends BaseInsightsResult {
  data: MonthlyTrendDatum[];
  refreshMonthlyTrend: () => Promise<void>;
}

export interface UseWeeklySummaryResult extends BaseInsightsResult {
  data: WeeklySummaryDatum[];
  refreshWeeklySummary: () => Promise<void>;
  total: number;
}

export function useCategoryTotals(month: string): UseCategoryTotalsResult {
  const db = useDatabase();
  const { categories, error: categoriesError, isLoading: categoriesLoading } = useCategories();
  const [rows, setRows] = useState<Array<{ categoryId: string; total: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCategoryTotals = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const nextRows = await getMonthlyTotalByCategory(db, month);
      setRows(nextRows);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load category totals.');
    } finally {
      setIsLoading(false);
    }
  }, [db, month]);

  useEffect(() => {
    void refreshCategoryTotals();
  }, [refreshCategoryTotals]);

  useFocusEffect(
    useCallback(() => {
      void refreshCategoryTotals();
      return undefined;
    }, [refreshCategoryTotals])
  );

  const data = useMemo(() => {
    const categoriesById = new Map(categories.map((category) => [category.id, category]));

    return rows
      .map((row) => {
        const category = categoriesById.get(row.categoryId);

        return {
          categoryId: row.categoryId,
          categoryName: category?.name ?? 'Unknown category',
          icon: category?.icon,
          total: row.total,
        };
      })
      .filter((row) => row.total > 0)
      .sort((left, right) => {
        if (right.total !== left.total) {
          return right.total - left.total;
        }

        return left.categoryName.localeCompare(right.categoryName);
      });
  }, [categories, rows]);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.total, 0), [data]);

  return useMemo(
    () => ({
      data,
      error: categoriesError ?? error,
      isLoading: categoriesLoading || isLoading,
      refreshCategoryTotals,
      total,
    }),
    [categoriesError, categoriesLoading, data, error, isLoading, refreshCategoryTotals, total]
  );
}

export function useMonthlyTrend(months: string[]): UseMonthlyTrendResult {
  const db = useDatabase();
  const [data, setData] = useState<MonthlyTrendDatum[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const monthsKey = useMemo(() => months.join('|'), [months]);

  const refreshMonthlyTrend = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const nextRows = await getMonthlyTotals(db, months);
      setData(nextRows);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load monthly trend.');
    } finally {
      setIsLoading(false);
    }
  }, [db, months]);

  useEffect(() => {
    void refreshMonthlyTrend();
  }, [refreshMonthlyTrend, monthsKey]);

  useFocusEffect(
    useCallback(() => {
      void refreshMonthlyTrend();
      return undefined;
    }, [refreshMonthlyTrend])
  );

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      refreshMonthlyTrend,
    }),
    [data, error, isLoading, refreshMonthlyTrend]
  );
}

export function useWeeklySummary(weekStart: string): UseWeeklySummaryResult {
  const db = useDatabase();
  const [rows, setRows] = useState<Array<{ date: string; total: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWeeklySummary = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const nextRows = await getWeeklyTotalsByDay(db, weekStart);
      setRows(nextRows);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load weekly summary.');
    } finally {
      setIsLoading(false);
    }
  }, [db, weekStart]);

  useEffect(() => {
    void refreshWeeklySummary();
  }, [refreshWeeklySummary]);

  useFocusEffect(
    useCallback(() => {
      void refreshWeeklySummary();
      return undefined;
    }, [refreshWeeklySummary])
  );

  const data = useMemo(
    () =>
      rows.map((row) => ({
        date: row.date,
        dayLabel: dayjs(row.date).format('ddd'),
        total: row.total,
      })),
    [rows]
  );

  const total = useMemo(() => data.reduce((sum, item) => sum + item.total, 0), [data]);

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      refreshWeeklySummary,
      total,
    }),
    [data, error, isLoading, refreshWeeklySummary, total]
  );
}
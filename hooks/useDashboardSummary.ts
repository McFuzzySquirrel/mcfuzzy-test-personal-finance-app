import { useMemo } from 'react';

import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useMonthlyTotals } from '@/hooks/useMonthlyTotals';
import type { Budget, Category } from '@/types';

export type DashboardCategoryRow = {
  budget: Budget | null;
  category: Category;
  spent: number;
};

export type DashboardTopCategory = {
  category: Category;
  spent: number;
};

export interface UseDashboardSummaryResult {
  categoryRows: DashboardCategoryRow[];
  error: string | null;
  hasAnyBudget: boolean;
  hasMonthlyExpenses: boolean;
  isLoading: boolean;
  topCategory: DashboardTopCategory | null;
  totalRemaining: number | null;
  totalSpent: number;
}

export function useDashboardSummary(month: string): UseDashboardSummaryResult {
  const { categories, error: categoriesError, isLoading: categoriesLoading } = useCategories();
  const {
    budgetByCategoryId,
    budgets,
    error: budgetsError,
    hasAnyBudget,
    isLoading: budgetsLoading,
  } = useBudgets(month);
  const { error: totalsError, isLoading: totalsLoading, totalsByCategoryId } = useMonthlyTotals(month);

  return useMemo(() => {
    const totalSpent = Object.values(totalsByCategoryId).reduce((sum, total) => sum + total, 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.limitAmount, 0);

    const categoryRows = categories
      .filter((category) => {
        const spent = totalsByCategoryId[category.id] ?? 0;
        return spent > 0 || budgetByCategoryId.has(category.id);
      })
      .map((category) => ({
        budget: budgetByCategoryId.get(category.id) ?? null,
        category,
        spent: totalsByCategoryId[category.id] ?? 0,
      }))
      .sort((left, right) => {
        if (right.spent !== left.spent) {
          return right.spent - left.spent;
        }

        const leftLimit = left.budget?.limitAmount ?? 0;
        const rightLimit = right.budget?.limitAmount ?? 0;
        if (rightLimit !== leftLimit) {
          return rightLimit - leftLimit;
        }

        return left.category.name.localeCompare(right.category.name);
      });

    const topCategoryRow = categoryRows.find((row) => row.spent > 0) ?? null;

    return {
      categoryRows,
      error: categoriesError ?? budgetsError ?? totalsError,
      hasAnyBudget,
      hasMonthlyExpenses: Object.keys(totalsByCategoryId).length > 0,
      isLoading: categoriesLoading || budgetsLoading || totalsLoading,
      topCategory: topCategoryRow
        ? {
            category: topCategoryRow.category,
            spent: topCategoryRow.spent,
          }
        : null,
      totalRemaining: hasAnyBudget ? totalBudget - totalSpent : null,
      totalSpent,
    };
  }, [
    budgetByCategoryId,
    budgets,
    budgetsError,
    budgetsLoading,
    categories,
    categoriesError,
    categoriesLoading,
    hasAnyBudget,
    totalsByCategoryId,
    totalsError,
    totalsLoading,
  ]);
}
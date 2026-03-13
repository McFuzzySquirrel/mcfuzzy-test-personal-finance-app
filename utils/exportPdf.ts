import dayjs from 'dayjs';

import type { Category, Expense } from '@/types';
import { formatMonthLabel } from '@/utils/date';

interface PrintModule {
  printToFileAsync: (options: { html: string }) => Promise<{ uri: string }>;
}

type CategoryWithOptionalBudget = Category & {
  budgetLimit?: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(cents: number): string {
  return `R ${(cents / 100).toFixed(2)}`;
}

function getBudgetLimitForCategory(category: Category): number {
  const enriched = category as CategoryWithOptionalBudget;
  return typeof enriched.budgetLimit === 'number' ? enriched.budgetLimit : 0;
}

function toBreakdownRows(
  expenses: Expense[],
  categories: Category[]
): Array<{ categoryName: string; spent: number; budgetLimit: number; percentUsed: string }> {
  const spendByCategory = new Map<string, number>();

  expenses.forEach((expense) => {
    if (expense.type === 'expense' || expense.type === 'split') {
      spendByCategory.set(expense.categoryId, (spendByCategory.get(expense.categoryId) ?? 0) + expense.amount);
    }
  });

  return categories
    .map((category) => {
      const spent = spendByCategory.get(category.id) ?? 0;
      const budgetLimit = getBudgetLimitForCategory(category);
      const percentUsed = budgetLimit > 0 ? `${((spent / budgetLimit) * 100).toFixed(1)}%` : 'N/A';

      return {
        categoryName: category.name,
        spent,
        budgetLimit,
        percentUsed,
      };
    })
    .filter((row) => row.spent > 0 || row.budgetLimit > 0)
    .sort((left, right) => right.spent - left.spent);
}

async function loadPrintModule(): Promise<PrintModule | null> {
  try {
    const moduleName = 'expo-print';
    const loaded = (await import(moduleName)) as unknown as PrintModule;
    return typeof loaded.printToFileAsync === 'function' ? loaded : null;
  } catch {
    return null;
  }
}

export function generatePdfHtml(expenses: Expense[], categories: Category[], month: string): string {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name] as const));
  const breakdownRows = toBreakdownRows(expenses, categories);

  const totalSpent = expenses
    .filter((expense) => expense.type === 'expense' || expense.type === 'split')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalBudgeted = categories.reduce((sum, category) => sum + getBudgetLimitForCategory(category), 0);
  const variance = totalBudgeted - totalSpent;

  const breakdownTableRows =
    breakdownRows.length === 0
      ? '<tr><td colspan="4">No budget or spending data for this month.</td></tr>'
      : breakdownRows
          .map(
            (row) =>
              `<tr><td>${escapeHtml(row.categoryName)}</td><td>${formatAmount(row.spent)}</td><td>${formatAmount(
                row.budgetLimit
              )}</td><td>${escapeHtml(row.percentUsed)}</td></tr>`
          )
          .join('');

  const transactionRows =
    expenses.length === 0
      ? '<tr><td colspan="4">No transactions in this month.</td></tr>'
      : expenses
          .map((expense) => {
            const categoryName = categoryNameById.get(expense.categoryId) ?? 'Uncategorized';
            return `<tr><td>${escapeHtml(dayjs(expense.date).format('DD MMM YYYY'))}</td><td>${escapeHtml(
              categoryName
            )}</td><td>${escapeHtml(expense.note?.trim() ?? '-')}</td><td>${formatAmount(expense.amount)}</td></tr>`;
          })
          .join('');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Student Finance Monthly Report</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #1f2937; margin: 24px;">
    <h1 style="margin: 0 0 8px; font-size: 24px;">Student Finance - Monthly Report</h1>
    <p style="margin: 0; font-size: 14px;"><strong>Month:</strong> ${escapeHtml(formatMonthLabel(`${month}-01`))}</p>
    <p style="margin: 4px 0 20px; font-size: 14px;"><strong>Generated:</strong> ${escapeHtml(
      dayjs().format('DD MMM YYYY HH:mm')
    )}</p>

    <h2 style="margin: 0 0 8px; font-size: 18px;">Summary</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Total spent</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Total budgeted</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Variance</th>
      </tr>
      <tr>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${formatAmount(totalSpent)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${formatAmount(totalBudgeted)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${formatAmount(variance)}</td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px; font-size: 18px;">Category breakdown</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Category</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Amount spent</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Budget limit</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">% used</th>
      </tr>
      ${breakdownTableRows}
    </table>

    <h2 style="margin: 0 0 8px; font-size: 18px;">Transactions</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Date</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Category</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Note</th>
        <th style="text-align: left; border: 1px solid #d1d5db; padding: 8px;">Amount</th>
      </tr>
      ${transactionRows}
    </table>
  </body>
</html>
`.trim();
}

export async function printToPdf(html: string): Promise<string> {
  const printModule = await loadPrintModule();

  if (!printModule) {
    throw new Error('PDF export is unavailable on this device.');
  }

  const result = await printModule.printToFileAsync({ html });
  return result.uri;
}


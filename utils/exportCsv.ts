import type { Category, Expense, ExpenseType } from '@/types';

const CSV_HEADER = ['Date', 'Amount (ZAR)', 'Category', 'Note', 'Type'] as const;

const TYPE_LABEL: Record<ExpenseType, string> = {
  expense: 'Expense',
  split: 'Split',
  lent: 'Lent',
  borrowed: 'Borrowed',
};

function toDecimalAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

function escapeCsvField(value: string): string {
  const mustQuote = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

export function generateCsv(expenses: Expense[], categories: Category[]): string {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name] as const));

  const rows = expenses.map((expense) => {
    const fields = [
      expense.date,
      toDecimalAmount(expense.amount),
      categoryNameById.get(expense.categoryId) ?? 'Uncategorized',
      expense.note?.trim() ?? '',
      TYPE_LABEL[expense.type],
    ];

    return fields.map((field) => escapeCsvField(field)).join(',');
  });

  return [CSV_HEADER.join(','), ...rows].join('\r\n');
}

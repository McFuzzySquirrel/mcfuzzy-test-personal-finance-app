import { generatePdfHtml } from '@/utils/exportPdf';
import type { Category, Expense } from '@/types';

describe('generatePdfHtml', () => {
  const categories: Category[] = [
    { id: 'food', name: 'Food', isCustom: false },
    { id: 'transport', name: 'Transport', isCustom: false },
  ];

  const expenses: Expense[] = [
    {
      id: '1',
      amount: 4500,
      categoryId: 'food',
      date: '2026-03-14',
      note: 'Coffee & bagel <special>',
      type: 'expense',
      settled: false,
      isRecurring: false,
    },
  ];

  it('renders report sections and escapes html in notes', () => {
    const html = generatePdfHtml(expenses, categories, '2026-03');

    expect(html).toContain('Student Finance - Monthly Report');
    expect(html).toContain('Category breakdown');
    expect(html).toContain('Transactions');
    expect(html).toContain('Coffee &amp; bagel &lt;special&gt;');
  });

  it('renders empty-state rows when there is no data', () => {
    const html = generatePdfHtml([], categories, '2026-03');

    expect(html).toContain('No transactions in this month.');
    expect(html).toContain('No budget or spending data for this month.');
  });
});

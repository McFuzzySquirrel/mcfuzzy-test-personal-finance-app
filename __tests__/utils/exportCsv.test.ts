import { generateCsv } from '@/utils/exportCsv';
import type { Category, Expense } from '@/types';

describe('generateCsv', () => {
  const categories: Category[] = [
    { id: 'food', isCustom: false, name: 'Food & Snacks' },
    { id: 'rent', isCustom: false, name: 'Rent "Main"' },
  ];

  it('includes expected header and human-readable type labels', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        amount: 4500,
        categoryId: 'food',
        date: '2026-03-14',
        type: 'expense',
      },
      {
        id: '2',
        amount: 1200,
        categoryId: 'food',
        date: '2026-03-15',
        type: 'split',
      },
      {
        id: '3',
        amount: 3500,
        categoryId: 'rent',
        date: '2026-03-16',
        type: 'lent',
      },
      {
        id: '4',
        amount: 2000,
        categoryId: 'rent',
        date: '2026-03-17',
        type: 'borrowed',
      },
    ];

    const csv = generateCsv(expenses, categories);

    expect(csv).toContain('Date,Amount (ZAR),Category,Note,Type');
    expect(csv).toContain('2026-03-14,45.00,Food & Snacks,,Expense');
    expect(csv).toContain('2026-03-15,12.00,Food & Snacks,,Split');
    expect(csv).toContain('2026-03-16,35.00,"Rent ""Main""",,Lent');
    expect(csv).toContain('2026-03-17,20.00,"Rent ""Main""",,Borrowed');
  });

  it('escapes RFC 4180-sensitive values and uses CRLF row delimiters', () => {
    const expenses: Expense[] = [
      {
        id: 'note-1',
        amount: 999,
        categoryId: 'food',
        date: '2026-03-20',
        note: 'Milk, eggs, and "bread"',
        type: 'expense',
      },
    ];

    const csv = generateCsv(expenses, categories);

    expect(csv).toContain('"Milk, eggs, and ""bread"""');
    expect(csv).toContain('\r\n2026-03-20,9.99,Food & Snacks,"Milk, eggs, and ""bread""",Expense');
  });
});

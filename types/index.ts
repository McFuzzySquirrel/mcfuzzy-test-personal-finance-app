export type ExpenseType = 'expense' | 'split' | 'lent' | 'borrowed';
export type RecurringInterval = 'monthly';

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
  type: ExpenseType;
  splitWith?: string;
  splitAmount?: number;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  settled?: boolean;
  recurringTemplateId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  isCustom: boolean;
}

export interface Budget {
  categoryId: string;
  limitAmount: number;
  month: string;
}

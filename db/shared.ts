import { DatabaseError } from '@/db/errors';

/** Generate a UUID v4 string compatible with Hermes (no crypto.randomUUID). */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function assertIntegerAmount(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new DatabaseError(`${fieldName} must be an integer amount in cents`, 'INVALID_INPUT');
  }
}

export function assertMonthFormat(month: string): void {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new DatabaseError('month must be in YYYY-MM format', 'INVALID_INPUT');
  }
}

export function assertDateFormat(date: string, fieldName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
    throw new DatabaseError(`${fieldName} must start with YYYY-MM-DD`, 'INVALID_INPUT');
  }
}

export function getMonthBounds(month: string): { start: string; end: string } {
  assertMonthFormat(month);
  const [yearRaw, monthRaw] = month.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const startDate = new Date(Date.UTC(year, monthIndex, 1));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 1));

  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
}

export function getWeekBounds(weekStart: string): { start: string; endExclusive: string; dates: string[] } {
  assertDateFormat(weekStart, 'weekStart');
  const baseDate = new Date(`${weekStart}T00:00:00.000Z`);

  if (Number.isNaN(baseDate.getTime())) {
    throw new DatabaseError('weekStart must be a valid date', 'INVALID_INPUT');
  }

  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(baseDate);
    date.setUTCDate(baseDate.getUTCDate() + i);
    dates.push(date.toISOString().slice(0, 10));
  }

  const endExclusiveDate = new Date(baseDate);
  endExclusiveDate.setUTCDate(baseDate.getUTCDate() + 7);

  return {
    start: baseDate.toISOString().slice(0, 10),
    endExclusive: endExclusiveDate.toISOString().slice(0, 10),
    dates,
  };
}

export function normalizeOptionalText(value: string | undefined): string | null {
  if (typeof value === 'undefined') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toDbBoolean(value: boolean | undefined): number {
  return value ? 1 : 0;
}

export function fromDbBoolean(value: number | null | undefined): boolean {
  return value === 1;
}

export function createPlaceholders(length: number): string {
  if (length <= 0) {
    throw new DatabaseError('At least one placeholder is required', 'INVALID_INPUT');
  }

  return new Array(length).fill('?').join(', ');
}

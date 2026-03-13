import { formatISODate, formatMonthKey, formatMonthLabel, getLastNMonthKeys, getWeekRange } from '@/utils/date';

describe('date utils', () => {
  it('formats ISO date and month key', () => {
    expect(formatISODate('2026-03-14')).toBe('2026-03-14');
    expect(formatMonthKey('2026-03-14')).toBe('2026-03');
  });

  it('formats month label', () => {
    expect(formatMonthLabel('2026-03-14')).toBe('March 2026');
  });

  it('computes ISO week range (monday to sunday)', () => {
    const range = getWeekRange('2026-03-14');

    expect(range.start).toBe('2026-03-09');
    expect(range.end).toBe('2026-03-15');
  });

  it('returns last N month keys in ascending order', () => {
    expect(getLastNMonthKeys(3, '2026-03-14')).toEqual(['2026-01', '2026-02', '2026-03']);
  });
});

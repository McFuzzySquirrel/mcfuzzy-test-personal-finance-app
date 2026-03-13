import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export function formatISODate(input: Dayjs | Date | string = dayjs()): string {
  return dayjs(input).format('YYYY-MM-DD');
}

export function formatMonthKey(input: Dayjs | Date | string = dayjs()): string {
  return dayjs(input).format('YYYY-MM');
}

export function formatMonthLabel(input: Dayjs | Date | string = dayjs()): string {
  return dayjs(input).format('MMMM YYYY');
}

export function getWeekRange(input: Dayjs | Date | string = dayjs()): {
  start: string;
  end: string;
} {
  const date = dayjs(input);
  return {
    start: date.startOf('isoWeek').format('YYYY-MM-DD'),
    end: date.endOf('isoWeek').format('YYYY-MM-DD'),
  };
}

export function getLastNMonthKeys(monthCount: number, from: Dayjs | Date | string = dayjs()): string[] {
  const current = dayjs(from);
  return Array.from({ length: monthCount }, (_, index) =>
    current.subtract(monthCount - index - 1, 'month').format('YYYY-MM')
  );
}

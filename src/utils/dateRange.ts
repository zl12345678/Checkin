import type { DateRange } from '@/types/domain';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthRange(year: number, monthIndex: number): DateRange {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

export function getMonthRange(date: Date): DateRange {
  return monthRange(date.getFullYear(), date.getMonth());
}

export function getPreviousMonthRange(date: Date): DateRange {
  return monthRange(date.getFullYear(), date.getMonth() - 1);
}

export function isDateInRange(isoDateTime: string, range: DateRange): boolean {
  const day = isoDateTime.slice(0, 10);
  return day >= range.start && day <= range.end;
}

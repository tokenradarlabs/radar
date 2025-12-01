import { GetDetailedUsageAnalyticsRequest } from '../lib/api/getUsageAnalytics/getUsageAnalytics.schema';

// This file will contain date formatting and manipulation utilities.

export function getDateFormatOptions(interval: GetDetailedUsageAnalyticsRequest['interval']): Intl.DateTimeFormatOptions {
  switch (interval) {
    case 'daily':
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
    case 'weekly':
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
    case 'monthly':
      return { year: 'numeric', month: '2-digit' };
    default:
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
  }
}

export function getFirstDayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(date.getDate() - date.getDay());
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(date.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(date.getMonth() + months);
  return d;
}

export function formatDateToYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}
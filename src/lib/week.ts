/** Week arithmetic. Weeks run Monday to Sunday throughout the app. */

import { DAYS } from '../types';

/** Index into DAYS for a date — Monday is 0, Sunday is 6. */
export function weekdayIndex(date: Date): number {
  // getDay() puts Sunday at 0, so shift by 6 to put Monday first.
  return (date.getDay() + 6) % 7;
}

export function dayNameOf(date: Date): string {
  return DAYS[weekdayIndex(date)];
}

/** Monday of the week containing `date`, at local midnight. */
export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setDate(start.getDate() - weekdayIndex(start));
  start.setHours(0, 0, 0, 0);
  return start;
}

/** The same weekday `n` weeks away. Negative goes back. */
export function addWeeks(date: Date, n: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + n * 7);
  return shifted;
}

/** Mon–Sun of the week containing `date`. */
export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

/**
 * The id of the week document, e.g. '2026-08-17'.
 *
 * The Monday's date rather than an ISO week number: it sorts correctly as a
 * string, never disagrees with itself across a year boundary, and you can read
 * which week a document is just by looking at it.
 */
export function getWeekId(date: Date): string {
  const monday = getWeekStart(date);
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${month}-${day}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** `Mon 27 Jul` — the Plan header's kicker format. */
export function formatDayAndMonth(date: Date): string {
  return `${dayNameOf(date).slice(0, 3)} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** `Mon Jul 27` — the Week screen's per-day header. */
export function formatWeekDayLabel(date: Date): string {
  return `${dayNameOf(date).slice(0, 3)} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** `Mon 27 Jul – Sun 2 Aug`. */
export function formatWeekRange(dates: Date[]): string {
  return `${formatDayAndMonth(dates[0])} – ${formatDayAndMonth(dates[dates.length - 1])}`;
}

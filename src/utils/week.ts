/**
 * Week arithmetic. Pure and Firestore-free, so screens can import the date
 * helpers without pulling in the whole Firestore SDK.
 *
 * Weeks run Monday to Sunday throughout the app.
 */
import { DAYS_OF_WEEK } from '../types/meal';

/** Index into DAYS_OF_WEEK for a Date — Monday is 0, Sunday is 6. */
export function weekdayIndex(date: Date): number {
  // getDay(): 0 = Sunday, so shift by 6 to put Monday first.
  return (date.getDay() + 6) % 7;
}

/** The day name for a Date, matching what is stored on a meal. */
export function dayNameOf(date: Date): string {
  return DAYS_OF_WEEK[weekdayIndex(date)];
}

/** The Monday of the week containing `date`, at local midnight. */
export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setDate(start.getDate() - weekdayIndex(start));
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Calendar dates for Mon–Sun of the week containing `date`. */
export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

/** The ISO-ish week string that scopes meals to a week, e.g. '2025-W30'. */
export function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNumber = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** `Mon 27 Jul` — the Plan tab's header kicker format. */
export function formatDayAndMonth(date: Date): string {
  return `${dayNameOf(date).slice(0, 3)} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** `Mon Jul 27` — the Week tab's per-day header format. */
export function formatWeekDayLabel(date: Date): string {
  return `${dayNameOf(date).slice(0, 3)} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** `Mon 27 Jul – Sun 2 Aug` for a full week. */
export function formatWeekRange(dates: Date[]): string {
  return `${formatDayAndMonth(dates[0])} – ${formatDayAndMonth(dates[dates.length - 1])}`;
}

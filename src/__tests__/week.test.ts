import { describe, expect, it } from 'vitest';
import {
  dayNameOf,
  formatWeekRange,
  getWeekDates,
  getWeekId,
  getWeekStart,
  weekdayIndex,
} from '../lib/week';
import { dayOfSlot, slotKey } from '../types';

// Sunday 23 Aug 2026 sits at the *end* of the week beginning Monday 17 Aug —
// the case a Sunday-first week gets wrong.
const SUNDAY = new Date(2026, 7, 23);
const WEDNESDAY = new Date(2026, 7, 19);

describe('weekdayIndex', () => {
  it('puts Monday first and Sunday last', () => {
    expect(weekdayIndex(new Date(2026, 7, 17))).toBe(0);
    expect(weekdayIndex(SUNDAY)).toBe(6);
  });
});

describe('dayNameOf', () => {
  it('names the day a meal would be stored under', () => {
    expect(dayNameOf(WEDNESDAY)).toBe('Wednesday');
    expect(dayNameOf(SUNDAY)).toBe('Sunday');
  });
});

describe('getWeekStart', () => {
  it('walks back to Monday at local midnight', () => {
    const start = getWeekStart(WEDNESDAY);

    expect(start.getDate()).toBe(17);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it('treats Sunday as the end of its week, not the start of the next', () => {
    expect(getWeekStart(SUNDAY).getDate()).toBe(17);
  });

  it('is already Monday when given a Monday', () => {
    const monday = new Date(2026, 7, 17);
    expect(getWeekStart(monday).getDate()).toBe(17);
  });
});

describe('getWeekId', () => {
  it('is the Monday of the week, so every day in it agrees', () => {
    expect(getWeekId(WEDNESDAY)).toBe('2026-08-17');
    expect(getWeekId(SUNDAY)).toBe('2026-08-17');
  });

  it('changes on the following Monday', () => {
    expect(getWeekId(new Date(2026, 7, 24))).toBe('2026-08-24');
  });

  it('pads month and day so ids sort chronologically as strings', () => {
    const ids = [
      getWeekId(new Date(2026, 0, 8)),
      getWeekId(new Date(2026, 10, 12)),
    ];

    expect(ids[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect([...ids].sort()).toEqual(ids);
  });

  it('does not disagree with itself across a year boundary', () => {
    // Thu 31 Dec 2026 and Fri 1 Jan 2027 are the same week.
    expect(getWeekId(new Date(2026, 11, 31))).toBe(getWeekId(new Date(2027, 0, 1)));
  });
});

describe('getWeekDates', () => {
  it('returns Monday through Sunday', () => {
    const dates = getWeekDates(SUNDAY);

    expect(dates).toHaveLength(7);
    expect(dates.map((d) => d.getDate())).toEqual([17, 18, 19, 20, 21, 22, 23]);
  });

  it('spans a month boundary cleanly', () => {
    const dates = getWeekDates(new Date(2026, 7, 31));
    expect(dates.map((d) => d.getDate())).toEqual([31, 1, 2, 3, 4, 5, 6]);
  });
});

describe('formatWeekRange', () => {
  it('reads first day to last', () => {
    expect(formatWeekRange(getWeekDates(SUNDAY))).toBe('Mon 17 Aug – Sun 23 Aug');
  });
});

describe('slot keys', () => {
  it('round-trips the day', () => {
    expect(dayOfSlot(slotKey('Wednesday', 'breakfast'))).toBe('Wednesday');
  });

  it('is distinct per meal type', () => {
    expect(slotKey('Monday', 'lunch')).not.toBe(slotKey('Monday', 'dinner'));
  });

  it('uses no character that needs quoting in a Firestore field path', () => {
    expect(slotKey('Monday', 'dinner')).toBe('Monday_dinner');
    expect(slotKey('Monday', 'dinner')).not.toContain('-');
    expect(slotKey('Monday', 'dinner')).not.toContain('.');
  });
});

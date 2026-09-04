/**
 * Week helpers for the Algerian working week: Saturday → Thursday, Friday off.
 * Dates are handled as plain `YYYY-MM-DD` strings to match Postgres `date` and
 * to stay clear of timezone shifts — a slot on the 12th must not become the
 * 11th because the browser sits west of UTC.
 */

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` in local time, not UTC. */
export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The Saturday on or before `date`. */
export function startOfWeek(date: Date): Date {
  // JS getDay(): 0 = Sunday … 6 = Saturday. Saturday is 0 days back, Sunday 1.
  const daysBack = (date.getDay() + 1) % 7;
  return addDays(date, -daysBack);
}

/** The six working days of the week starting at `weekStart`, Sat → Thu. */
export function workWeekDates(weekStart: string): string[] {
  const start = fromISODate(weekStart);
  return Array.from({ length: 6 }, (_, index) => toISODate(addDays(start, index)));
}

/**
 * The next `count` dates falling on `dow` (Postgres convention, 0 = Sunday),
 * starting from tomorrow — an exam is never scheduled for today.
 */
export function nextDatesForDow(dow: number, count = 4, from = new Date()): string[] {
  const dates: string[] = [];
  let cursor = addDays(from, 1);
  while (dates.length < count) {
    if (cursor.getDay() === dow) dates.push(toISODate(cursor));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

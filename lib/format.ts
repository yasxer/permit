import type { Locale } from "@/i18n/config";

/** App locale → BCP 47 tag with Algerian conventions where they exist. */
const INTL_LOCALE: Record<Locale, string> = {
  fr: "fr-DZ",
  ar: "ar-DZ",
  en: "en-GB",
};

function tagFor(locale: string): string {
  return INTL_LOCALE[locale as Locale] ?? "fr-DZ";
}

/** Amounts in dinars. Cents are never shown — Algerian pricing is whole DA. */
export function formatCurrency(amount: number | null | undefined, locale: string) {
  const value = amount ?? 0;
  return new Intl.NumberFormat(tagFor(locale), {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, locale: string) {
  return new Intl.NumberFormat(tagFor(locale)).format(value ?? 0);
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(tagFor(locale), options).format(date);
}

/** "08:30" from a Postgres `time` value like "08:30:00". */
export function formatTime(value: string): string {
  return value.slice(0, 5);
}

/** Short month label for chart axes, e.g. "janv." / "Jan" / "يناير". */
export function formatMonthLabel(isoMonth: string, locale: string): string {
  const [year, month] = isoMonth.split("-").map(Number);
  return new Intl.DateTimeFormat(tagFor(locale), { month: "short" }).format(
    new Date(year, (month ?? 1) - 1, 1),
  );
}

/** Postgres `dow` (0 = Sunday) → key in the `days` message namespace. */
export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/** Algerian working week for the planning grid: Saturday → Thursday. */
export const WORK_WEEK_DOW = [6, 0, 1, 2, 3, 4] as const;

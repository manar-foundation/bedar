/* ================================================================
   Formatting helpers.

   HARD BRAND RULE: numerals are Western (0-9) everywhere, including
   inside Arabic prose. Never Arabic-Indic (٠-٩). That means every
   Intl call must pass `-u-nu-latn`, because `ar` alone defaults to
   arab digits in most runtimes.
   ================================================================ */

const AR_LATN = 'ar-u-nu-latn';

const dateFormatter = new Intl.DateTimeFormat(AR_LATN, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  calendar: 'gregory',
});

const dateTimeFormatter = new Intl.DateTimeFormat(AR_LATN, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  calendar: 'gregory',
});

const numberFormatter = new Intl.NumberFormat(AR_LATN);

/** "15 يناير 2026" — Gregorian, Western digits. */
export function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter.format(date);
}

/**
 * "15 ينا 2026، 14:30" — date AND time, Western digits.
 *
 * Used where the ordering within a day matters: a form submission
 * inbox is read newest-first and two enquiries on the same morning
 * are indistinguishable without the clock.
 */
export function formatDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateTimeFormatter.format(date);
}

/** ISO date for <time datetime> and schema.org. */
export function toISODate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** "1,250" — Western digits, Arabic grouping. */
export function formatNumber(value) {
  if (value == null || value === '') return '';
  return numberFormatter.format(value);
}

/**
 * Arabic-aware slug. Keeps Arabic letters (they are valid, readable
 * URL characters once percent-encoded) and collapses everything else
 * to single hyphens.
 */
export function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[ً-ْ]/g, '') // strip Arabic diacritics
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** Truncate on a word boundary, for meta descriptions and cards. */
export function truncate(text, max = 160) {
  const value = String(text ?? '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, value.lastIndexOf(' ', max)).trim()}…`;
}

/** Rough Arabic reading time. ~180 wpm is a common figure for MSA. */
export function readingTime(text) {
  const words = String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

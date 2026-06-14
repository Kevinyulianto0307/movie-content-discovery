import { z } from 'zod';

// Coerces a possibly-empty CSV string to a finite number or null. Empty strings
// and non-numeric junk (NaN/Infinity) become null rather than 0/NaN.
export const nullableNumber = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

export function emptyToNull(s: string | undefined): string | null {
  return s === undefined || s === '' ? null : s;
}

// Extracts a 4-digit year from an ISO release_date. Returns null when missing or
// malformed (many rows have empty/garbled dates — a documented dataset gotcha).
export function parseYear(date: string | undefined): number | null {
  if (!date) return null;
  const m = /^(\d{4})-\d{2}-\d{2}$/.exec(date);
  return m ? Number(m[1]) : null;
}

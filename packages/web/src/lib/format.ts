// Display formatters used across the UI. These exist so the em-dash
// fallback for missing values lives in one place.

const EM_DASH = '—';

export function formatRating(rating: number | null | undefined): string {
  return rating == null ? EM_DASH : rating.toFixed(1);
}

export function formatYear(year: number | null | undefined): string {
  return year == null ? EM_DASH : String(year);
}

export function formatCount(value: number | null | undefined): string {
  return value == null ? EM_DASH : value.toLocaleString();
}

export function formatRevenue(value: number | null | undefined): string {
  return value != null && value > 0 ? `$${value.toLocaleString()}` : EM_DASH;
}

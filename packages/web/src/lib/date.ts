// Formats an ISO date string (YYYY-MM-DD, as stored) to en-GB dd-mm-YYYY.
// Returns an em dash for missing dates and passes through anything that isn't a
// recognizable ISO date (the dataset has a few malformed values).
export function formatReleaseDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

import { describe, it, expect } from 'vitest';
import { formatReleaseDate } from '../../src/lib/date';

describe('formatReleaseDate', () => {
  describe('valid ISO dates', () => {
    it('formats ISO date to dd-mm-yyyy', () => {
      expect(formatReleaseDate('2023-12-25')).toBe('25-12-2023');
      expect(formatReleaseDate('1999-01-01')).toBe('01-01-1999');
    });

    it('preserves leading zeros', () => {
      expect(formatReleaseDate('2023-01-01')).toBe('01-01-2023');
      expect(formatReleaseDate('2023-09-09')).toBe('09-09-2023');
    });

    it('handles dates at year boundaries', () => {
      expect(formatReleaseDate('1999-12-31')).toBe('31-12-1999');
      expect(formatReleaseDate('2000-01-01')).toBe('01-01-2000');
    });

    it('handles ISO date with time suffix', () => {
      expect(formatReleaseDate('1995-11-22T00:00:00')).toBe('22-11-1995');
    });
  });

  describe('null/undefined handling', () => {
    it('returns em-dash for null', () => {
      expect(formatReleaseDate(null)).toBe('—');
    });

    it('returns em-dash for undefined', () => {
      expect(formatReleaseDate(undefined)).toBe('—');
    });

    it('returns em-dash for empty string', () => {
      expect(formatReleaseDate('')).toBe('—');
    });
  });

  describe('malformed date passthrough', () => {
    it('passes through malformed dates unchanged', () => {
      expect(formatReleaseDate('not-a-date')).toBe('not-a-date');
      expect(formatReleaseDate('12/25/2023')).toBe('12/25/2023');
    });

    it('passes through partial dates unchanged', () => {
      expect(formatReleaseDate('1995')).toBe('1995');
      expect(formatReleaseDate('1995-11')).toBe('1995-11');
    });

    it('passes through reversed format unchanged', () => {
      expect(formatReleaseDate('25-12-2023')).toBe('25-12-2023');
    });
  });
});

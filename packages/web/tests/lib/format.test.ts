import { describe, it, expect } from 'vitest';
import { formatRating, formatYear, formatCount, formatRevenue } from '../../src/lib/format';

describe('formatRating', () => {
  describe('valid numbers', () => {
    it('formats a number to one decimal place', () => {
      expect(formatRating(7.5)).toBe('7.5');
      expect(formatRating(8)).toBe('8.0');
      expect(formatRating(9.99)).toBe('10.0');
    });

    it('handles zero', () => {
      expect(formatRating(0)).toBe('0.0');
    });

    it('handles small decimals', () => {
      expect(formatRating(0.1)).toBe('0.1');
      expect(formatRating(0.05)).toBe('0.1');
    });

    it('rounds using toFixed', () => {
      expect(formatRating(7.54)).toBe('7.5');
      expect(formatRating(7.56)).toBe('7.6');
      expect(formatRating(7.65)).toBe('7.7');
    });
  });

  describe('null/undefined handling', () => {
    it('returns em-dash for null', () => {
      expect(formatRating(null)).toBe('—');
    });

    it('returns em-dash for undefined', () => {
      expect(formatRating(undefined)).toBe('—');
    });
  });

  describe('edge cases', () => {
    it('handles negative numbers', () => {
      expect(formatRating(-1)).toBe('-1.0');
    });

    it('handles large numbers', () => {
      expect(formatRating(100)).toBe('100.0');
    });
  });
});

describe('formatYear', () => {
  describe('valid years', () => {
    it('returns year as string', () => {
      expect(formatYear(2023)).toBe('2023');
      expect(formatYear(1999)).toBe('1999');
    });

    it('handles old years', () => {
      expect(formatYear(1900)).toBe('1900');
    });

    it('handles future years', () => {
      expect(formatYear(2050)).toBe('2050');
    });
  });

  describe('null/undefined handling', () => {
    it('returns em-dash for null', () => {
      expect(formatYear(null)).toBe('—');
    });

    it('returns em-dash for undefined', () => {
      expect(formatYear(undefined)).toBe('—');
    });
  });

  describe('edge cases', () => {
    it('handles zero (unlikely but possible)', () => {
      expect(formatYear(0)).toBe('0');
    });

    it('handles negative years (BC)', () => {
      expect(formatYear(-500)).toBe('-500');
    });
  });
});

describe('formatCount', () => {
  describe('valid numbers', () => {
    it('formats numbers with locale separators', () => {
      expect(formatCount(1000)).toBe('1,000');
      expect(formatCount(1234567)).toBe('1,234,567');
    });

    it('handles small numbers without separators', () => {
      expect(formatCount(1)).toBe('1');
      expect(formatCount(999)).toBe('999');
    });

    it('handles zero', () => {
      expect(formatCount(0)).toBe('0');
    });
  });

  describe('null/undefined handling', () => {
    it('returns em-dash for null', () => {
      expect(formatCount(null)).toBe('—');
    });

    it('returns em-dash for undefined', () => {
      expect(formatCount(undefined)).toBe('—');
    });
  });

  describe('edge cases', () => {
    it('handles negative numbers', () => {
      expect(formatCount(-1000)).toBe('-1,000');
    });

    it('handles very large numbers', () => {
      expect(formatCount(1000000000)).toBe('1,000,000,000');
    });
  });
});

describe('formatRevenue', () => {
  describe('valid positive numbers', () => {
    it('formats positive numbers with dollar sign and separators', () => {
      expect(formatRevenue(1000000)).toBe('$1,000,000');
      expect(formatRevenue(500)).toBe('$500');
    });

    it('handles small positive values', () => {
      expect(formatRevenue(1)).toBe('$1');
    });

    it('handles large values', () => {
      expect(formatRevenue(1000000000)).toBe('$1,000,000,000');
    });
  });

  describe('null/undefined handling', () => {
    it('returns em-dash for null', () => {
      expect(formatRevenue(null)).toBe('—');
    });

    it('returns em-dash for undefined', () => {
      expect(formatRevenue(undefined)).toBe('—');
    });
  });

  describe('zero and negative handling', () => {
    it('returns em-dash for zero', () => {
      expect(formatRevenue(0)).toBe('—');
    });

    it('returns em-dash for negative values', () => {
      expect(formatRevenue(-100)).toBe('—');
      expect(formatRevenue(-1)).toBe('—');
    });
  });
});

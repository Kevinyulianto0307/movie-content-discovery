import { describe, it, expect } from 'vitest';
import { nullableNumber, emptyToNull, parseYear } from '../../src/validators/rows/shared';

describe('nullableNumber', () => {
  describe('valid numeric inputs', () => {
    it('parses string numbers', () => {
      expect(nullableNumber.parse('42')).toBe(42);
      expect(nullableNumber.parse('3.14')).toBe(3.14);
    });

    it('parses actual numbers', () => {
      expect(nullableNumber.parse(42)).toBe(42);
      expect(nullableNumber.parse(0)).toBe(0);
    });

    it('parses negative numbers', () => {
      expect(nullableNumber.parse(-10)).toBe(-10);
      expect(nullableNumber.parse('-5.5')).toBe(-5.5);
    });
  });

  describe('null conversion', () => {
    it('converts empty string to null', () => {
      expect(nullableNumber.parse('')).toBeNull();
    });

    it('converts null to null', () => {
      expect(nullableNumber.parse(null)).toBeNull();
    });

    it('converts undefined to null', () => {
      expect(nullableNumber.parse(undefined)).toBeNull();
    });

    it('converts NaN string to null', () => {
      expect(nullableNumber.parse('abc')).toBeNull();
      expect(nullableNumber.parse('not-a-number')).toBeNull();
    });

    it('converts Infinity to null', () => {
      expect(nullableNumber.parse(Infinity)).toBeNull();
      expect(nullableNumber.parse(-Infinity)).toBeNull();
    });

    it('converts NaN to null', () => {
      expect(nullableNumber.parse(NaN)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles string with leading zeros', () => {
      expect(nullableNumber.parse('007')).toBe(7);
    });

    it('handles scientific notation', () => {
      expect(nullableNumber.parse('1e5')).toBe(100000);
      expect(nullableNumber.parse('1.5e-3')).toBe(0.0015);
    });

    it('handles whitespace-only string as 0 (Number coercion)', () => {
      expect(nullableNumber.parse('   ')).toBe(0);
    });
  });
});

describe('emptyToNull', () => {
  it('returns null for undefined', () => {
    expect(emptyToNull(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(emptyToNull('')).toBeNull();
  });

  it('returns the string for non-empty values', () => {
    expect(emptyToNull('hello')).toBe('hello');
    expect(emptyToNull('0')).toBe('0');
    expect(emptyToNull(' ')).toBe(' ');
  });

  it('preserves whitespace-only strings', () => {
    expect(emptyToNull('  ')).toBe('  ');
    expect(emptyToNull('\t')).toBe('\t');
  });

  it('preserves special characters', () => {
    expect(emptyToNull('null')).toBe('null');
    expect(emptyToNull('undefined')).toBe('undefined');
  });
});

describe('parseYear', () => {
  describe('valid ISO dates', () => {
    it('extracts year from valid ISO date', () => {
      expect(parseYear('1995-11-22')).toBe(1995);
      expect(parseYear('2023-01-01')).toBe(2023);
    });

    it('handles dates at year boundaries', () => {
      expect(parseYear('1999-12-31')).toBe(1999);
      expect(parseYear('2000-01-01')).toBe(2000);
    });

    it('handles old dates', () => {
      expect(parseYear('1900-05-15')).toBe(1900);
    });
  });

  describe('null/undefined handling', () => {
    it('returns null for undefined', () => {
      expect(parseYear(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseYear('')).toBeNull();
    });
  });

  describe('malformed date handling', () => {
    it('returns null for incomplete date', () => {
      expect(parseYear('1995')).toBeNull();
      expect(parseYear('1995-11')).toBeNull();
    });

    it('returns null for wrong format', () => {
      expect(parseYear('22-11-1995')).toBeNull();
      expect(parseYear('11/22/1995')).toBeNull();
    });

    it('returns null for garbage input', () => {
      expect(parseYear('not-a-date')).toBeNull();
      expect(parseYear('abc')).toBeNull();
    });

    it('returns null for partial ISO format', () => {
      expect(parseYear('1995-1-22')).toBeNull();
      expect(parseYear('1995-11-2')).toBeNull();
    });
  });

  describe('edge cases from dataset', () => {
    it('returns null for date with time suffix (strict ISO date format)', () => {
      expect(parseYear('1995-11-22T00:00:00')).toBeNull();
    });
  });
});

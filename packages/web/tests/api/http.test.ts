import { describe, it, expect } from 'vitest';
import { toQuery, BASE } from '../../src/api/http';

describe('toQuery', () => {
  it('converts params object to query string', () => {
    const result = toQuery({ page: 1, sort: 'title', order: 'asc' });
    expect(result).toBe('page=1&sort=title&order=asc');
  });

  it('omits undefined values', () => {
    const result = toQuery({ page: 1, sort: undefined, order: 'asc' });
    expect(result).toBe('page=1&order=asc');
  });

  it('omits empty string values', () => {
    const result = toQuery({ page: 1, sort: '', order: 'asc' });
    expect(result).toBe('page=1&order=asc');
  });

  it('converts numbers to strings', () => {
    const result = toQuery({ id: 123, limit: 20 });
    expect(result).toBe('id=123&limit=20');
  });

  it('returns empty string for empty object', () => {
    const result = toQuery({});
    expect(result).toBe('');
  });

  it('returns empty string when all values are undefined', () => {
    const result = toQuery({ a: undefined, b: undefined });
    expect(result).toBe('');
  });

  it('handles mixed types', () => {
    const result = toQuery({ q: 'batman', page: 2, missing: undefined });
    expect(result).toBe('q=batman&page=2');
  });

  it('encodes special characters', () => {
    const result = toQuery({ q: 'star wars', tag: 'action&adventure' });
    expect(result).toBe('q=star+wars&tag=action%26adventure');
  });
});

describe('BASE', () => {
  it('exports /api as the base path', () => {
    expect(BASE).toBe('/api');
  });
});

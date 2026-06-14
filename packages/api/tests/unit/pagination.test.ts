import { describe, it, expect } from 'vitest';
import { calcOffset, paginatedResponse, PaginationQuery } from '../../src/lib/pagination';

describe('calcOffset', () => {
  it('returns 0 for first page', () => {
    expect(calcOffset(1, 20)).toBe(0);
  });

  it('calculates correct offset for second page', () => {
    expect(calcOffset(2, 20)).toBe(20);
  });

  it('calculates correct offset for arbitrary page and pageSize', () => {
    expect(calcOffset(5, 10)).toBe(40);
    expect(calcOffset(3, 50)).toBe(100);
  });

  it('handles pageSize of 1', () => {
    expect(calcOffset(10, 1)).toBe(9);
  });

  it('handles large page numbers', () => {
    expect(calcOffset(1000, 100)).toBe(99900);
  });
});

describe('paginatedResponse', () => {
  it('wraps data in standard envelope', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = paginatedResponse(data, 100, 1, 20);

    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      total: 100,
      page: 1,
      pageSize: 20,
    });
  });

  it('handles empty data array', () => {
    const result = paginatedResponse([], 0, 1, 20);

    expect(result).toEqual({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it('preserves complex data objects', () => {
    const data = [{ id: 1, nested: { value: 'test' } }];
    const result = paginatedResponse(data, 1, 1, 10);

    expect(result.data[0]).toEqual({ id: 1, nested: { value: 'test' } });
  });
});

describe('PaginationQuery', () => {
  describe('page parameter', () => {
    it('defaults to 1 when not provided', () => {
      const result = PaginationQuery.parse({});
      expect(result.page).toBe(1);
    });

    it('coerces string to number', () => {
      const result = PaginationQuery.parse({ page: '5' });
      expect(result.page).toBe(5);
    });

    it('rejects page less than 1', () => {
      expect(() => PaginationQuery.parse({ page: 0 })).toThrow();
      expect(() => PaginationQuery.parse({ page: -1 })).toThrow();
    });

    it('rejects non-integer page', () => {
      expect(() => PaginationQuery.parse({ page: 1.5 })).toThrow();
    });
  });

  describe('pageSize parameter', () => {
    it('defaults to 20 when not provided', () => {
      const result = PaginationQuery.parse({});
      expect(result.pageSize).toBe(20);
    });

    it('coerces string to number', () => {
      const result = PaginationQuery.parse({ pageSize: '50' });
      expect(result.pageSize).toBe(50);
    });

    it('rejects pageSize less than 1', () => {
      expect(() => PaginationQuery.parse({ pageSize: 0 })).toThrow();
      expect(() => PaginationQuery.parse({ pageSize: -10 })).toThrow();
    });

    it('rejects pageSize greater than 100', () => {
      expect(() => PaginationQuery.parse({ pageSize: 101 })).toThrow();
      expect(() => PaginationQuery.parse({ pageSize: 500 })).toThrow();
    });

    it('accepts pageSize at boundaries', () => {
      expect(PaginationQuery.parse({ pageSize: 1 }).pageSize).toBe(1);
      expect(PaginationQuery.parse({ pageSize: 100 }).pageSize).toBe(100);
    });

    it('rejects non-integer pageSize', () => {
      expect(() => PaginationQuery.parse({ pageSize: 20.5 })).toThrow();
    });
  });
});

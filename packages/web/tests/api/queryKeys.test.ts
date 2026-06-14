import { describe, it, expect } from 'vitest';
import { queryKeys } from '../../src/api/queryKeys';

describe('queryKeys', () => {
  describe('movies', () => {
    it('has stable all key', () => {
      expect(queryKeys.movies.all).toEqual(['movies']);
    });

    it('creates list key with params', () => {
      const params = { page: 1, pageSize: 20, sort: 'title' as const, order: 'asc' as const };
      expect(queryKeys.movies.list(params)).toEqual(['movies', 'list', params]);
    });

    it('creates detail key with id', () => {
      expect(queryKeys.movies.detail(123)).toEqual(['movies', 'detail', 123]);
    });

    it('creates similar key with id', () => {
      expect(queryKeys.movies.similar(456)).toEqual(['movies', 'similar', 456]);
    });
  });

  describe('search', () => {
    it('has stable all key', () => {
      expect(queryKeys.search.all).toEqual(['search']);
    });

    it('creates query key with search term and page', () => {
      expect(queryKeys.search.query('batman', 2)).toEqual(['search', 'batman', 2, undefined, undefined]);
    });

    it('creates query key with sort and order', () => {
      expect(queryKeys.search.query('batman', 2, 'title', 'asc')).toEqual(['search', 'batman', 2, 'title', 'asc']);
    });
  });

  describe('key uniqueness', () => {
    it('different detail ids produce different keys', () => {
      expect(queryKeys.movies.detail(1)).not.toEqual(queryKeys.movies.detail(2));
    });

    it('different search terms produce different keys', () => {
      expect(queryKeys.search.query('batman', 1)).not.toEqual(
        queryKeys.search.query('superman', 1),
      );
    });

    it('different pages produce different keys', () => {
      expect(queryKeys.search.query('batman', 1)).not.toEqual(queryKeys.search.query('batman', 2));
    });

    it('detail and similar keys differ for same id', () => {
      expect(queryKeys.movies.detail(1)).not.toEqual(queryKeys.movies.similar(1));
    });
  });

  describe('edge cases', () => {
    it('handles empty search query', () => {
      const key = queryKeys.search.query('', 1);
      expect(key).toEqual(['search', '', 1, undefined, undefined]);
    });

    it('handles special characters in search query', () => {
      const key = queryKeys.search.query("batman's return", 1);
      expect(key[1]).toBe("batman's return");
    });

    it('handles zero page number', () => {
      const key = queryKeys.search.query('test', 0);
      expect(key[2]).toBe(0);
    });

    it('preserves list params reference', () => {
      const params = { page: 1, pageSize: 20, sort: 'title' as const, order: 'asc' as const };
      const key = queryKeys.movies.list(params);
      expect(key[2]).toBe(params);
    });
  });

  describe('key hierarchy for invalidation', () => {
    it('list key starts with movies base', () => {
      const listKey = queryKeys.movies.list({ page: 1, pageSize: 20, sort: 'title', order: 'asc' });
      expect(listKey[0]).toBe(queryKeys.movies.all[0]);
    });

    it('detail key starts with movies base', () => {
      const detailKey = queryKeys.movies.detail(1);
      expect(detailKey[0]).toBe(queryKeys.movies.all[0]);
    });

    it('search query key starts with search base', () => {
      const queryKey = queryKeys.search.query('test', 1);
      expect(queryKey[0]).toBe(queryKeys.search.all[0]);
    });
  });
});

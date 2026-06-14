import { describe, it, expect } from 'vitest';
import { similarityScore } from '../../src/lib/similarity.ts';

describe('similarityScore', () => {
  describe('weighting', () => {
    it('weights shared genres double and shared keywords single', () => {
      const score = similarityScore(
        { genres: [1, 2], keywords: [10] },
        { genres: [2], keywords: [10] },
      );
      expect(score).toBe(2 * 1 + 1); // one shared genre (x2) + one shared keyword
    });

    it('scores genres higher than keywords', () => {
      const genreOnlyScore = similarityScore(
        { genres: [1], keywords: [] },
        { genres: [1], keywords: [] },
      );
      const keywordOnlyScore = similarityScore(
        { genres: [], keywords: [1] },
        { genres: [], keywords: [1] },
      );
      expect(genreOnlyScore).toBe(2);
      expect(keywordOnlyScore).toBe(1);
    });
  });

  describe('no overlap', () => {
    it('returns 0 when nothing overlaps', () => {
      expect(similarityScore({ genres: [1], keywords: [2] }, { genres: [9], keywords: [8] })).toBe(0);
    });

    it('returns 0 when both are empty', () => {
      expect(similarityScore({ genres: [], keywords: [] }, { genres: [], keywords: [] })).toBe(0);
    });

    it('returns 0 when target is empty', () => {
      expect(similarityScore({ genres: [], keywords: [] }, { genres: [1], keywords: [2] })).toBe(0);
    });

    it('returns 0 when candidate is empty', () => {
      expect(similarityScore({ genres: [1], keywords: [2] }, { genres: [], keywords: [] })).toBe(0);
    });
  });

  describe('deduplication', () => {
    it('does not double-count repeated tags in target', () => {
      expect(similarityScore({ genres: [1, 1], keywords: [] }, { genres: [1], keywords: [] })).toBe(2);
    });

    it('does not double-count repeated tags in candidate', () => {
      expect(similarityScore({ genres: [1], keywords: [] }, { genres: [1, 1], keywords: [] })).toBe(2);
    });

    it('handles duplicates in keywords', () => {
      expect(similarityScore({ genres: [], keywords: [1, 1, 1] }, { genres: [], keywords: [1] })).toBe(1);
    });
  });

  describe('multiple matches', () => {
    it('sums all shared genres', () => {
      const score = similarityScore(
        { genres: [1, 2, 3], keywords: [] },
        { genres: [1, 2, 3], keywords: [] },
      );
      expect(score).toBe(6); // 3 genres * 2 weight
    });

    it('sums all shared keywords', () => {
      const score = similarityScore(
        { genres: [], keywords: [1, 2, 3, 4, 5] },
        { genres: [], keywords: [1, 2, 3, 4, 5] },
      );
      expect(score).toBe(5); // 5 keywords * 1 weight
    });

    it('correctly combines genres and keywords', () => {
      const score = similarityScore(
        { genres: [1, 2], keywords: [10, 20, 30] },
        { genres: [1, 2, 3], keywords: [10, 20] },
      );
      expect(score).toBe(2 * 2 + 2); // 2 shared genres * 2 + 2 shared keywords
    });
  });

  describe('partial overlap', () => {
    it('counts only overlapping items', () => {
      const score = similarityScore(
        { genres: [1, 2, 3], keywords: [10, 20] },
        { genres: [2, 4, 5], keywords: [20, 30] },
      );
      expect(score).toBe(2 + 1); // 1 shared genre * 2 + 1 shared keyword
    });
  });
});

import { describe, it, expect } from 'vitest';
import { MovieRowSchema, LinkRowSchema, RatingRowSchema } from '../../src/validators/rows.js';

describe('MovieRowSchema', () => {
  describe('valid rows', () => {
    it('coerces string numerics and extracts release_year', () => {
      const r = MovieRowSchema.safeParse({
        id: '862',
        title: 'Toy Story',
        release_date: '1995-11-22',
        budget: '30000000',
        vote_average: '7.7',
        vote_count: '5415',
        adult: 'False',
      });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.id).toBe(862);
        expect(r.data.releaseYear).toBe(1995);
        expect(r.data.budget).toBe(30000000);
        expect(r.data.voteCount).toBe(5415);
        expect(r.data.adult).toBe(0);
      }
    });

    it('marks adult rows with adult = 1', () => {
      const r = MovieRowSchema.safeParse({ id: '5', title: 'x', adult: 'True' });
      expect(r.success && r.data.adult).toBe(1);
    });

    it('handles minimal valid row', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: 'Test' });
      expect(r.success).toBe(true);
    });
  });

  describe('id validation', () => {
    it('rejects a corrupt row whose id is non-numeric (column shift)', () => {
      expect(MovieRowSchema.safeParse({ id: '1997-08-20', title: 'x' }).success).toBe(false);
    });

    it('rejects negative id', () => {
      expect(MovieRowSchema.safeParse({ id: '-1', title: 'x' }).success).toBe(false);
    });

    it('rejects zero id', () => {
      expect(MovieRowSchema.safeParse({ id: '0', title: 'x' }).success).toBe(false);
    });

    it('rejects floating point id', () => {
      expect(MovieRowSchema.safeParse({ id: '1.5', title: 'x' }).success).toBe(false);
    });
  });

  describe('title validation', () => {
    it('rejects a row with an empty title', () => {
      expect(MovieRowSchema.safeParse({ id: '1', title: '' }).success).toBe(false);
    });

    it('accepts title with special characters', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: "It's a Wonderful Life!" });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.title).toBe("It's a Wonderful Life!");
    });

    it('accepts unicode title', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: '日本語タイトル' });
      expect(r.success).toBe(true);
    });
  });

  describe('date and year handling', () => {
    it('sets release_year to null when the date is missing or malformed', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: 'x', release_date: '' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.releaseYear).toBeNull();
    });

    it('preserves releaseDate as string for valid dates', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: 'x', release_date: '2023-12-25' });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.releaseDate).toBe('2023-12-25');
        expect(r.data.releaseYear).toBe(2023);
      }
    });
  });

  describe('numeric field coercion', () => {
    it('maps empty numerics to null, not 0/NaN', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: 'x', budget: '', revenue: 'abc' });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.budget).toBeNull();
        expect(r.data.revenue).toBeNull();
      }
    });

    it('truncates vote_count to integer', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: 'x', vote_count: '5415.7' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.voteCount).toBe(5415);
    });

    it('handles zero values for numerics', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: 'x', budget: '0', revenue: '0' });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.budget).toBe(0);
        expect(r.data.revenue).toBe(0);
      }
    });

    it('handles negative budget/revenue', () => {
      const r = MovieRowSchema.safeParse({ id: '1', title: 'x', budget: '-100' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.budget).toBe(-100);
    });
  });

  describe('optional field handling', () => {
    it('converts empty strings to null via emptyToNull', () => {
      const r = MovieRowSchema.safeParse({
        id: '1',
        title: 'x',
        imdb_id: '',
        overview: '',
        tagline: '',
      });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.imdbId).toBeNull();
        expect(r.data.overview).toBeNull();
        expect(r.data.tagline).toBeNull();
      }
    });
  });
});

describe('LinkRowSchema', () => {
  it('maps MovieLens id to TMDB id', () => {
    const r = LinkRowSchema.safeParse({ movieId: '1', tmdbId: '862' });
    expect(r.success && r.data).toEqual({ movielensId: 1, tmdbId: 862 });
  });

  it('skips a row with no TMDB mapping (empty tmdbId)', () => {
    expect(LinkRowSchema.safeParse({ movieId: '1', tmdbId: '' }).success).toBe(false);
  });
});

describe('RatingRowSchema', () => {
  it('coerces a rating row', () => {
    const r = RatingRowSchema.safeParse({ userId: '1', movieId: '31', rating: '2.5', timestamp: '1260759144' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.movieId).toBe(31);
      expect(r.data.rating).toBe(2.5);
    }
  });
});

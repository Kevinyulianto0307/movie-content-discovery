import { describe, it, expect } from 'vitest';
import { GenreSchema, KeywordItemSchema, CastItemSchema, CrewItemSchema } from '../../src/validators/json-items';

describe('GenreSchema', () => {
  describe('valid input', () => {
    it('parses valid genre object', () => {
      const result = GenreSchema.safeParse({ id: 28, name: 'Action' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 28, name: 'Action' });
      }
    });

    it('coerces string id to number', () => {
      const result = GenreSchema.safeParse({ id: '28', name: 'Action' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(28);
      }
    });

    it('strips unknown fields', () => {
      const result = GenreSchema.safeParse({ id: 28, name: 'Action', extra: 'field' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 28, name: 'Action' });
        expect(result.data).not.toHaveProperty('extra');
      }
    });
  });

  describe('invalid input', () => {
    it('rejects missing id', () => {
      const result = GenreSchema.safeParse({ name: 'Action' });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = GenreSchema.safeParse({ id: 28 });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = GenreSchema.safeParse({ id: 28, name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric id', () => {
      const result = GenreSchema.safeParse({ id: 'abc', name: 'Action' });
      expect(result.success).toBe(false);
    });
  });
});

describe('KeywordItemSchema', () => {
  describe('valid input', () => {
    it('parses valid keyword object', () => {
      const result = KeywordItemSchema.safeParse({ id: 1234, name: 'based on novel' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 1234, name: 'based on novel' });
      }
    });
  });

  describe('invalid input', () => {
    it('rejects empty name', () => {
      const result = KeywordItemSchema.safeParse({ id: 1234, name: '' });
      expect(result.success).toBe(false);
    });
  });
});

describe('CastItemSchema', () => {
  describe('valid input', () => {
    it('parses complete cast object', () => {
      const result = CastItemSchema.safeParse({
        id: 5,
        name: 'Tom Hanks',
        character: 'Woody',
        order: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: 5,
          name: 'Tom Hanks',
          character: 'Woody',
          order: 0,
        });
      }
    });

    it('allows nullish fields', () => {
      const result = CastItemSchema.safeParse({
        id: null,
        name: null,
        character: null,
        order: null,
      });
      expect(result.success).toBe(true);
    });

    it('allows missing optional fields', () => {
      const result = CastItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('strips unknown fields like gender', () => {
      const result = CastItemSchema.safeParse({
        id: 5,
        name: 'Tom Hanks',
        character: 'Woody',
        order: 0,
        gender: 2,
        profile_path: '/some/path.jpg',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('gender');
        expect(result.data).not.toHaveProperty('profile_path');
      }
    });
  });
});

describe('CrewItemSchema', () => {
  describe('valid input', () => {
    it('parses complete crew object', () => {
      const result = CrewItemSchema.safeParse({
        id: 1,
        name: 'Christopher Nolan',
        job: 'Director',
        department: 'Directing',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: 1,
          name: 'Christopher Nolan',
          job: 'Director',
          department: 'Directing',
        });
      }
    });

    it('allows nullish fields', () => {
      const result = CrewItemSchema.safeParse({
        id: null,
        name: null,
        job: null,
        department: null,
      });
      expect(result.success).toBe(true);
    });

    it('allows empty object', () => {
      const result = CrewItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

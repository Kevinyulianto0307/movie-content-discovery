import { describe, it, expect } from 'vitest';
import { pythonLiteralToJson, parseJsonArray } from '../../src/parsers/json-columns.js';
import { GenreSchema, CastItemSchema } from '../../src/validators/json-items.js';

describe('pythonLiteralToJson', () => {
  describe('quote handling', () => {
    it('converts a simple single-quoted dict list', () => {
      expect(JSON.parse(pythonLiteralToJson(`[{'id': 1, 'name': 'jealousy'}]`))).toEqual([
        { id: 1, name: 'jealousy' },
      ]);
    });

    it('keeps apostrophes in double-quoted values (the naive-replace bug)', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'character': "Hooker's Mother"}]`));
      expect(out[0].character).toBe("Hooker's Mother");
    });

    it('handles a backslash-escaped apostrophe in a single-quoted value', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'name': 'It\\'s a wrap'}]`));
      expect(out[0].name).toBe("It's a wrap");
    });

    it('handles nested quotes correctly', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'quote': "He said \\"hello\\""}]`));
      expect(out[0].quote).toBe('He said "hello"');
    });

    it('handles empty strings', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'name': ''}]`));
      expect(out[0].name).toBe('');
    });
  });

  describe('python literal conversion', () => {
    it('converts None/True/False only outside strings', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'a': None, 'b': True, 'c': False, 'd': 'None'}]`));
      expect(out[0]).toEqual({ a: null, b: true, c: false, d: 'None' });
    });

    it('converts nan/NaN to null', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'a': nan, 'b': NaN}]`));
      expect(out[0]).toEqual({ a: null, b: null });
    });

    it('preserves True/False/None as strings when inside quotes', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'a': 'True', 'b': 'False', 'c': 'None'}]`));
      expect(out[0]).toEqual({ a: 'True', b: 'False', c: 'None' });
    });

    it('does not convert partial word matches', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'name': 'NoneOfYourBusiness'}]`));
      expect(out[0].name).toBe('NoneOfYourBusiness');
    });
  });

  describe('escape sequences', () => {
    it('handles newline escape', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'text': 'line1\\nline2'}]`));
      expect(out[0].text).toBe('line1\nline2');
    });

    it('handles tab escape', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'text': 'col1\\tcol2'}]`));
      expect(out[0].text).toBe('col1\tcol2');
    });

    it('handles carriage return escape', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'text': 'line1\\rline2'}]`));
      expect(out[0].text).toBe('line1\rline2');
    });

    it('handles backslash escape', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'path': 'C:\\\\Users'}]`));
      expect(out[0].path).toBe('C:\\Users');
    });
  });

  describe('edge cases', () => {
    it('handles empty array', () => {
      expect(JSON.parse(pythonLiteralToJson('[]'))).toEqual([]);
    });

    it('handles empty object in array', () => {
      expect(JSON.parse(pythonLiteralToJson('[{}]'))).toEqual([{}]);
    });

    it('handles numeric values', () => {
      const out = JSON.parse(pythonLiteralToJson(`[{'id': 123, 'score': 45.67}]`));
      expect(out[0]).toEqual({ id: 123, score: 45.67 });
    });
  });
});

describe('parseJsonArray', () => {
  it('returns [] for empty / None / null', () => {
    expect(parseJsonArray('', GenreSchema)).toEqual([]);
    expect(parseJsonArray('None', GenreSchema)).toEqual([]);
    expect(parseJsonArray(null, GenreSchema)).toEqual([]);
  });

  it('returns [] for unparseable input rather than throwing', () => {
    expect(parseJsonArray('{not valid', GenreSchema)).toEqual([]);
  });

  it('validates each item and drops invalid ones', () => {
    const out = parseJsonArray(`[{'id': 1, 'name': 'a'}, {'id': 2}]`, GenreSchema);
    expect(out).toEqual([{ id: 1, name: 'a' }]);
  });

  it('parses cast items, keeping only declared fields', () => {
    const out = parseJsonArray(
      `[{'id': 5, 'name': 'Tom Hanks', 'character': "Woody", 'order': 0, 'gender': 2}]`,
      CastItemSchema,
    );
    expect(out).toEqual([{ id: 5, name: 'Tom Hanks', character: 'Woody', order: 0 }]);
  });
});

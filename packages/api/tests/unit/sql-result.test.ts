import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseRows, parseFirstRow } from '../../src/lib/sql-result';

const TestSchema = z.object({
  id: z.number(),
  name: z.string(),
});

describe('parseRows', () => {
  it('parses valid rows through schema', () => {
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    const result = parseRows(TestSchema, rows);

    expect(result).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  });

  it('returns empty array for empty input', () => {
    const result = parseRows(TestSchema, []);
    expect(result).toEqual([]);
  });

  it('throws ZodError when row does not match schema', () => {
    const rows = [{ id: 'not-a-number', name: 'Alice' }];

    expect(() => parseRows(TestSchema, rows)).toThrow();
  });

  it('throws on first invalid row in array', () => {
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 'invalid', name: 'Bob' },
    ];

    expect(() => parseRows(TestSchema, rows)).toThrow();
  });

  it('strips unknown keys from rows', () => {
    const rows = [{ id: 1, name: 'Alice', extra: 'field' }];

    const result = parseRows(TestSchema, rows);

    expect(result[0]).toEqual({ id: 1, name: 'Alice' });
    expect(result[0]).not.toHaveProperty('extra');
  });

  it('works with schema that has transformations', () => {
    const TransformSchema = z
      .object({ value: z.string() })
      .transform((r) => ({ value: r.value.toUpperCase() }));

    const rows = [{ value: 'hello' }];
    const result = parseRows(TransformSchema, rows);

    expect(result[0].value).toBe('HELLO');
  });
});

describe('parseFirstRow', () => {
  it('returns undefined for empty array', () => {
    const result = parseFirstRow(TestSchema, []);
    expect(result).toBeUndefined();
  });

  it('parses and returns first row', () => {
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    const result = parseFirstRow(TestSchema, rows);

    expect(result).toEqual({ id: 1, name: 'Alice' });
  });

  it('throws ZodError when first row does not match schema', () => {
    const rows = [{ id: 'not-a-number', name: 'Alice' }];

    expect(() => parseFirstRow(TestSchema, rows)).toThrow();
  });

  it('ignores invalid second row when first is valid', () => {
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 'invalid', name: 'Bob' },
    ];

    const result = parseFirstRow(TestSchema, rows);

    expect(result).toEqual({ id: 1, name: 'Alice' });
  });

  it('strips unknown keys from result', () => {
    const rows = [{ id: 1, name: 'Alice', extra: 'field' }];

    const result = parseFirstRow(TestSchema, rows);

    expect(result).toEqual({ id: 1, name: 'Alice' });
    expect(result).not.toHaveProperty('extra');
  });
});

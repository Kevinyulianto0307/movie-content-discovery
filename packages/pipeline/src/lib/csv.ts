import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';

export const BATCH_SIZE = 500;

// Streaming CSV reader. `columns: true` yields objects keyed by header. The relax
// flags tolerate this dataset's ragged/odd rows; csv-parse still decodes standard
// CSV escaping (doubled `""` -> `"`) so Python's mixed-quote JSON survives intact.
export function csvRows(path: string): AsyncIterable<Record<string, string>> {
  return createReadStream(path).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true,
    }),
  );
}

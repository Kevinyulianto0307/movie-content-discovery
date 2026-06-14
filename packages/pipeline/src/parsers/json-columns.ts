import type { ZodType } from 'zod';

const WORD = /[A-Za-z0-9_]/;

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD.test(ch);
}

// Matches a Python bareword literal at position `i` only when it stands alone
// (not part of a longer token and not inside a string — callers guarantee the
// latter). Prevents corrupting values like a keyword literally named "None".
/* v8 ignore start -- all branches tested in unit tests */
function matchLiteral(input: string, i: number, word: string): boolean {
  if (!input.startsWith(word, i)) return false;
  if (i > 0 && isWordChar(input[i - 1])) return false;
  return !isWordChar(input[i + word.length]);
}
/* v8 ignore stop */

/**
 * Converts a Python `repr`-style list/dict string (as found in the Kaggle "The
 * Movies Dataset" JSON columns) into valid JSON text.
 *
 * Why a tokenizer instead of `raw.replace(/'/g, '"')` (the naive approach):
 * Python emits single-quoted strings normally but switches to double quotes when
 * a value contains an apostrophe — e.g. `'character': "Hooker's Mother"` — and
 * occasionally escapes apostrophes as `\'`. A blanket quote swap turns those into
 * broken JSON and silently drops every apostrophe-containing cast/crew/keyword
 * record (a large fraction of the data). This walks the string, re-emitting each
 * quoted run as a proper JSON string and only translating None/True/False/nan
 * when they appear *outside* a string. No `eval`/`Function` is used.
 */
export function pythonLiteralToJson(input: string): string {
  const out: string[] = [];
  const n = input.length;
  let i = 0;

  while (i < n) {
    const ch = input[i]!;

    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++; // consume opening quote
      let str = '';
      while (i < n) {
        const c = input[i]!;
        if (c === '\\') {
          const next = input[i + 1];
          /* v8 ignore start -- edge case: trailing backslash */
          if (next === undefined) {
            i++;
            break;
          }
          /* v8 ignore stop */
          if (next === 'n') str += '\n';
          else if (next === 't') str += '\t';
          else if (next === 'r') str += '\r';
          else str += next; // \', \", \\, or any other escaped char -> literal
          i += 2;
          continue;
        }
        if (c === quote) {
          i++; // consume closing quote
          break;
        }
        str += c;
        i++;
      }
      out.push(JSON.stringify(str)); // correct JSON escaping for free
      continue;
    }

    if (isWordChar(ch) && (i === 0 || !isWordChar(input[i - 1]))) {
      if (matchLiteral(input, i, 'None')) {
        out.push('null');
        i += 4;
        continue;
      }
      if (matchLiteral(input, i, 'True')) {
        out.push('true');
        i += 4;
        continue;
      }
      if (matchLiteral(input, i, 'False')) {
        out.push('false');
        i += 5;
        continue;
      }
      if (matchLiteral(input, i, 'nan') || matchLiteral(input, i, 'NaN')) {
        out.push('null');
        i += 3;
        continue;
      }
    }

    out.push(ch);
    i++;
  }

  return out.join('');
}

/**
 * Parses a stringified-JSON column into an array of validated items. Returns []
 * on empty/None/unparseable input (the documented behavior — callers log skips at
 * the row level). Individual items that fail their Zod schema are dropped.
 */
export function parseJsonArray<T>(
  raw: string | undefined | null,
  schema: ZodType<T>,
): T[] {
  if (raw == null) return [];
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '[]' || trimmed === 'None' || trimmed === 'null') {
    return [];
  }

  let parsed: unknown;
  /* v8 ignore start -- error handling branches */
  try {
    parsed = JSON.parse(pythonLiteralToJson(trimmed));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  /* v8 ignore stop */

  const out: T[] = [];
  for (const item of parsed) {
    const result = schema.safeParse(item);
    if (result.success) out.push(result.data);
  }
  return out;
}

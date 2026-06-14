// Ensures a local .env exists before anything reads DATABASE_URL.
// The project's .env has no secrets (local Postgres creds only), so we can safely
// seed it from .env.example. This keeps `npm run setup` a true one-command start
// instead of relying on the assessor remembering `cp .env.example .env`.
// Never overwrites an existing .env.
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = join(root, '.env');
const example = join(root, '.env.example');

if (existsSync(env)) {
  console.log('✓ .env already present.');
} else if (existsSync(example)) {
  copyFileSync(example, env);
  console.log('✓ Created .env from .env.example.');
} else {
  console.error('✖ No .env and no .env.example to copy from.');
  process.exit(1);
}

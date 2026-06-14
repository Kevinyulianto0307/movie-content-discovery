// Polls Postgres readiness after `docker compose up -d`.
// Node-based (not a bash script) so `npm run setup` works on macOS, Linux,
// and Windows without WSL.
import { execSync } from 'node:child_process';

const MAX_TRIES = 30;

for (let i = 1; i <= MAX_TRIES; i++) {
  try {
    execSync('docker compose exec -T postgres pg_isready -U postgres -d movies', {
      stdio: 'ignore',
    });
    console.log('Postgres is ready.');
    process.exit(0);
  } catch {
    if (i === MAX_TRIES) {
      console.error('Postgres did not become ready in 30s.');
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Preflight for `npm run setup` / `npm run db:up`.
// Docker is the project's only external dependency (it runs PostgreSQL). The raw
// `docker compose` error ("Cannot connect to the Docker daemon...") is cryptic,
// so this check fails early with an actionable message and a docs link.
import { execSync } from 'node:child_process';

function ok(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 1. Is the Docker CLI installed at all?
if (!ok('docker --version')) {
  console.error(
    [
      '',
      '✖ Docker is not installed.',
      '',
      '  This project uses Docker only to run PostgreSQL locally.',
      '  Install Docker Desktop, then re-run `npm run setup`:',
      '    https://docs.docker.com/get-docker/',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

// 2. CLI exists — is the daemon actually running? `docker info` talks to it.
if (!ok('docker info')) {
  console.error(
    [
      '',
      '✖ Docker is installed, but the Docker daemon is not running.',
      '',
      '  Start Docker, wait until it reports "running", then re-run `npm run setup`:',
      '    • macOS / Windows: open Docker Desktop and wait for the whale icon to settle',
      '    • Linux:           sudo systemctl start docker',
      '',
      '  More help: https://docs.docker.com/config/daemon/start/',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

console.log('✓ Docker daemon is running.');

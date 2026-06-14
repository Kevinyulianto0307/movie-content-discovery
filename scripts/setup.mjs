#!/usr/bin/env node
// Wrapper script for setup that prints a success message at completion.
import { execSync } from 'node:child_process';

const steps = [
  { cmd: 'npm run env:init', label: 'Initializing .env' },
  { cmd: 'npm install', label: 'Installing dependencies' },
  { cmd: 'npm run db:up', label: 'Starting Postgres container' },
  { cmd: 'npm run db:wait', label: 'Waiting for Postgres' },
  { cmd: 'npm run db:migrate', label: 'Running migrations' },
];

console.log('\n🚀 Starting setup...\n');

for (const { cmd, label } of steps) {
  console.log(`→ ${label}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error(`\n✖ Setup failed at: ${label}`);
    process.exit(1);
  }
}

console.log(
  [
    '',
    '═══════════════════════════════════════════════════════════════',
    '  ✅ Setup completed successfully!',
    '═══════════════════════════════════════════════════════════════',
    '',
    '  Next steps:',
    '    1. Run `npm run ingest` to load movie data',
    '    2. Run `npm run api` to start the API server',
    '    3. Run `npm run web` to start the frontend',
    '',
  ].join('\n'),
);

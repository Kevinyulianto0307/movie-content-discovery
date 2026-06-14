import pino from 'pino';

// pino-pretty for human-readable CLI output. Structured JSON would be noise for
// an interactive ingestion run; the final summary is printed via console.table.
/* v8 ignore start -- env var branch */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: {
    target: 'pino-pretty',
    options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
  },
});
/* v8 ignore stop */

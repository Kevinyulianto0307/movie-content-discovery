import { config } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Finds the monorepo root: the nearest ancestor whose package.json declares
// `workspaces`. npm workspace scripts (`npm run -w @mcd/... `) run with cwd set
// to the *package* directory, so resolving the root explicitly lets us load the
// single root .env and resolve DATA_DIR consistently from anywhere.
function findRepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { workspaces?: unknown };
        if (pkg.workspaces) return dir;
      } catch {
        // unreadable/!JSON package.json — keep walking up
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return start; // reached filesystem root; fall back to cwd
    dir = parent;
  }
}

export const repoRoot = findRepoRoot(process.cwd());

// Side effect: load the root .env. Missing file is fine (vars may come from the
// shell); dotenv simply no-ops.
config({ path: join(repoRoot, '.env') });

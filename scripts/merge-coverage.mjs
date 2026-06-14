#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const coverageDir = join(rootDir, 'coverage');

const packages = ['api', 'pipeline', 'web'];

function getColor(pct) {
  if (pct >= 80) return '#4caf50';
  if (pct >= 50) return '#ff9800';
  return '#f44336';
}

function getColorClass(pct) {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'medium';
  return 'low';
}

function mergeCoverage() {
  rmSync(coverageDir, { recursive: true, force: true });
  mkdirSync(coverageDir, { recursive: true });

  const summaries = [];

  for (const pkg of packages) {
    const pkgCoverageDir = join(rootDir, 'packages', pkg, 'coverage');
    const summaryPath = join(pkgCoverageDir, 'coverage-summary.json');

    if (existsSync(summaryPath)) {
      const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
      summaries.push({ pkg, summary, hasHtml: existsSync(join(pkgCoverageDir, 'index.html')) });

      // Copy package coverage to subdirectory
      const destDir = join(coverageDir, pkg);
      cpSync(pkgCoverageDir, destDir, { recursive: true });

      console.log(`✓ Found coverage for ${pkg}`);
    } else {
      console.log(`⚠ No coverage found for ${pkg}`);
    }
  }

  if (summaries.length === 0) {
    console.log('No coverage data found. Run tests first.');
    process.exit(1);
  }

  const merged = {
    total: { lines: { total: 0, covered: 0 }, statements: { total: 0, covered: 0 }, functions: { total: 0, covered: 0 }, branches: { total: 0, covered: 0 } },
  };

  const pkgTotals = {};

  for (const { pkg, summary } of summaries) {
    pkgTotals[pkg] = summary.total;
    for (const [file, data] of Object.entries(summary)) {
      if (file === 'total') {
        merged.total.lines.total += data.lines.total;
        merged.total.lines.covered += data.lines.covered;
        merged.total.statements.total += data.statements.total;
        merged.total.statements.covered += data.statements.covered;
        merged.total.functions.total += data.functions.total;
        merged.total.functions.covered += data.functions.covered;
        merged.total.branches.total += data.branches.total;
        merged.total.branches.covered += data.branches.covered;
      } else {
        const key = `packages/${pkg}/${file.replace(process.cwd() + '/', '')}`;
        merged[key] = data;
      }
    }
  }

  for (const metric of ['lines', 'statements', 'functions', 'branches']) {
    const m = merged.total[metric];
    m.pct = m.total > 0 ? Math.round((m.covered / m.total) * 10000) / 100 : 0;
  }

  writeFileSync(join(coverageDir, 'coverage-summary.json'), JSON.stringify(merged, null, 2));

  // Generate HTML report
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Combined Coverage Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 20px; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
    .card .value { font-size: 32px; font-weight: bold; }
    .card .detail { font-size: 12px; color: #999; margin-top: 4px; }
    .high { color: #4caf50; }
    .medium { color: #ff9800; }
    .low { color: #f44336; }
    .progress { height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 8px; overflow: hidden; }
    .progress-bar { height: 100%; border-radius: 4px; }
    table { width: 100%; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #fafafa; font-weight: 600; color: #333; }
    tr:last-child td { border-bottom: none; }
    a { color: #1976d2; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.high { background: #e8f5e9; color: #2e7d32; }
    .badge.medium { background: #fff3e0; color: #ef6c00; }
    .badge.low { background: #ffebee; color: #c62828; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Combined Coverage Report</h1>

    <div class="summary-cards">
      <div class="card">
        <h3>Statements</h3>
        <div class="value ${getColorClass(merged.total.statements.pct)}">${merged.total.statements.pct}%</div>
        <div class="detail">${merged.total.statements.covered} / ${merged.total.statements.total}</div>
        <div class="progress"><div class="progress-bar" style="width: ${merged.total.statements.pct}%; background: ${getColor(merged.total.statements.pct)}"></div></div>
      </div>
      <div class="card">
        <h3>Branches</h3>
        <div class="value ${getColorClass(merged.total.branches.pct)}">${merged.total.branches.pct}%</div>
        <div class="detail">${merged.total.branches.covered} / ${merged.total.branches.total}</div>
        <div class="progress"><div class="progress-bar" style="width: ${merged.total.branches.pct}%; background: ${getColor(merged.total.branches.pct)}"></div></div>
      </div>
      <div class="card">
        <h3>Functions</h3>
        <div class="value ${getColorClass(merged.total.functions.pct)}">${merged.total.functions.pct}%</div>
        <div class="detail">${merged.total.functions.covered} / ${merged.total.functions.total}</div>
        <div class="progress"><div class="progress-bar" style="width: ${merged.total.functions.pct}%; background: ${getColor(merged.total.functions.pct)}"></div></div>
      </div>
      <div class="card">
        <h3>Lines</h3>
        <div class="value ${getColorClass(merged.total.lines.pct)}">${merged.total.lines.pct}%</div>
        <div class="detail">${merged.total.lines.covered} / ${merged.total.lines.total}</div>
        <div class="progress"><div class="progress-bar" style="width: ${merged.total.lines.pct}%; background: ${getColor(merged.total.lines.pct)}"></div></div>
      </div>
    </div>

    <h2 style="margin-bottom: 16px;">Package Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Statements</th>
          <th>Branches</th>
          <th>Functions</th>
          <th>Lines</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${summaries.map(({ pkg, hasHtml }) => {
          const t = pkgTotals[pkg];
          return `
        <tr>
          <td><strong>@mcd/${pkg}</strong></td>
          <td><span class="badge ${getColorClass(t.statements.pct)}">${t.statements.pct}%</span></td>
          <td><span class="badge ${getColorClass(t.branches.pct)}">${t.branches.pct}%</span></td>
          <td><span class="badge ${getColorClass(t.functions.pct)}">${t.functions.pct}%</span></td>
          <td><span class="badge ${getColorClass(t.lines.pct)}">${t.lines.pct}%</span></td>
          <td>${hasHtml ? `<a href="./${pkg}/index.html">View Details →</a>` : '-'}</td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>

    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      Generated at ${new Date().toLocaleString()}
    </p>
  </div>
</body>
</html>`;

  writeFileSync(join(coverageDir, 'index.html'), html);

  console.log('\n📊 Combined Coverage Summary:');
  console.log('─'.repeat(50));
  console.log(`Statements : ${merged.total.statements.pct}% (${merged.total.statements.covered}/${merged.total.statements.total})`);
  console.log(`Branches   : ${merged.total.branches.pct}% (${merged.total.branches.covered}/${merged.total.branches.total})`);
  console.log(`Functions  : ${merged.total.functions.pct}% (${merged.total.functions.covered}/${merged.total.functions.total})`);
  console.log(`Lines      : ${merged.total.lines.pct}% (${merged.total.lines.covered}/${merged.total.lines.total})`);
  console.log('─'.repeat(50));
  console.log(`\n✓ Coverage report: ${coverageDir}/index.html`);
}

mergeCoverage();

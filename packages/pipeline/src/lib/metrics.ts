// Lightweight metrics for validating pipeline performance claims.
// Tracks batch timing and peak memory usage during ingestion.

export interface BatchMetrics {
  batchCount: number;
  totalRows: number;
  totalTimeMs: number;
  avgBatchMs: number;
  minBatchMs: number;
  maxBatchMs: number;
  peakHeapMB: number;
}

let batchTimes: number[] = [];
let peakHeapBytes = 0;

export function resetMetrics(): void {
  batchTimes = [];
  peakHeapBytes = 0;
}

export function recordBatchTime(ms: number): void {
  batchTimes.push(ms);
}

export function sampleHeap(): void {
  const used = process.memoryUsage().heapUsed;
  if (used > peakHeapBytes) {
    peakHeapBytes = used;
  }
}

export function getMetrics(totalRows: number): BatchMetrics {
  const totalTimeMs = batchTimes.reduce((a, b) => a + b, 0);
  return {
    batchCount: batchTimes.length,
    totalRows,
    totalTimeMs,
    avgBatchMs: batchTimes.length ? Math.round(totalTimeMs / batchTimes.length) : 0,
    minBatchMs: batchTimes.length ? Math.round(Math.min(...batchTimes)) : 0,
    maxBatchMs: batchTimes.length ? Math.round(Math.max(...batchTimes)) : 0,
    peakHeapMB: Math.round(peakHeapBytes / 1024 / 1024),
  };
}

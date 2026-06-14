import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetMetrics,
  recordBatchTime,
  sampleHeap,
  getMetrics,
} from '../../src/lib/metrics.js';

describe('metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('getMetrics with no batches', () => {
    it('returns zeros when no batches have been recorded', () => {
      const metrics = getMetrics(0);
      expect(metrics).toEqual({
        batchCount: 0,
        totalRows: 0,
        totalTimeMs: 0,
        avgBatchMs: 0,
        minBatchMs: 0,
        maxBatchMs: 0,
        peakHeapMB: 0,
      });
    });
  });

  describe('recordBatchTime', () => {
    it('records a single batch time', () => {
      recordBatchTime(100);
      const metrics = getMetrics(500);
      expect(metrics.batchCount).toBe(1);
      expect(metrics.totalTimeMs).toBe(100);
      expect(metrics.avgBatchMs).toBe(100);
      expect(metrics.minBatchMs).toBe(100);
      expect(metrics.maxBatchMs).toBe(100);
    });

    it('records multiple batch times and computes stats', () => {
      recordBatchTime(50);
      recordBatchTime(100);
      recordBatchTime(150);
      const metrics = getMetrics(1500);
      expect(metrics.batchCount).toBe(3);
      expect(metrics.totalRows).toBe(1500);
      expect(metrics.totalTimeMs).toBe(300);
      expect(metrics.avgBatchMs).toBe(100);
      expect(metrics.minBatchMs).toBe(50);
      expect(metrics.maxBatchMs).toBe(150);
    });
  });

  describe('sampleHeap', () => {
    it('tracks peak heap usage', () => {
      sampleHeap();
      const metrics = getMetrics(0);
      expect(metrics.peakHeapMB).toBeGreaterThanOrEqual(0);
    });

    it('retains the peak value across multiple samples', () => {
      sampleHeap();
      const firstMetrics = getMetrics(0);
      sampleHeap();
      const secondMetrics = getMetrics(0);
      expect(secondMetrics.peakHeapMB).toBeGreaterThanOrEqual(firstMetrics.peakHeapMB);
    });
  });

  describe('resetMetrics', () => {
    it('clears all recorded data', () => {
      recordBatchTime(100);
      sampleHeap();
      resetMetrics();
      const metrics = getMetrics(0);
      expect(metrics.batchCount).toBe(0);
      expect(metrics.peakHeapMB).toBe(0);
    });
  });
});

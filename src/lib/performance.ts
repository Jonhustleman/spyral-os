/**
 * SPYRAL OS — Performance Monitoring Utility
 *
 * Collects runtime performance metrics and reports them through
 * the observability layer. Supports:
 * - Web Vitals (FCP, LCP, INP)
 * - Navigation transition timing
 * - Studio render timing
 * - localStorage operation timing
 *
 * ADR-0060: Performance Is Product Experience
 */

export type PerformanceMetricType =
  | "FCP"
  | "LCP"
  | "INP"
  | "NavigationTransition"
  | "StudioRender"
  | "localStorageRead"
  | "localStorageWrite";

export interface PerformanceMetric {
  type: PerformanceMetricType;
  value: number; // milliseconds
  timestamp: number;
  sessionId?: string;
  studio?: string;
  metadata?: Record<string, unknown>;
}

type MetricCallback = (metric: PerformanceMetric) => void;

let metricListeners: MetricCallback[] = [];

/**
 * Register a listener for performance metrics.
 */
export function onPerformanceMetric(callback: MetricCallback): () => void {
  metricListeners.push(callback);
  return () => {
    metricListeners = metricListeners.filter((l) => l !== callback);
  };
}

function emit(metric: PerformanceMetric): void {
  metricListeners.forEach((cb) => cb(metric));
}

/**
 * Measure the duration of an async operation.
 * Returns the result of the operation and emits a performance metric.
 */
export async function measureAsync<T>(
  type: PerformanceMetricType,
  operation: () => Promise<T>,
  options?: { studio?: string; metadata?: Record<string, unknown> },
): Promise<T> {
  const start = performance.now();
  try {
    return await operation();
  } finally {
    const duration = performance.now() - start;
    emit({
      type,
      value: duration,
      timestamp: Date.now(),
      studio: options?.studio,
      metadata: options?.metadata,
    });
  }
}

/**
 * Measure the duration of a sync operation.
 * Returns the result of the operation and emits a performance metric.
 */
export function measureSync<T>(
  type: PerformanceMetricType,
  operation: () => T,
  options?: { studio?: string; metadata?: Record<string, unknown> },
): T {
  const start = performance.now();
  try {
    return operation();
  } finally {
    const duration = performance.now() - start;
    emit({
      type,
      value: duration,
      timestamp: Date.now(),
      studio: options?.studio,
      metadata: options?.metadata,
    });
  }
}

/**
 * Decorator to measure studio render time.
 * Usage: useEffect(() => { const end = measureRender('navigate'); ... });
 */
export function measureRender(studio: string): () => void {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    emit({
      type: "StudioRender",
      value: duration,
      timestamp: Date.now(),
      studio,
    });
  };
}

/**
 * Track Web Vitals using PerformanceObserver API.
 * Call once at app initialization.
 */
export function initWebVitals(): void {
  if (typeof window === "undefined" || !window.performance) return;

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        emit({
          type: "LCP",
          value: lastEntry.startTime,
          timestamp: Date.now(),
        });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // LCP not supported
  }

  // First Contentful Paint (via paint entries)
  try {
    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find((e) => e.name === "first-contentful-paint");
      if (fcp) {
        emit({
          type: "FCP",
          value: fcp.startTime,
          timestamp: Date.now(),
        });
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });
  } catch {
    // Paint API not supported
  }

  // Interaction to Next Paint
  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        emit({
          type: "INP",
          value: lastEntry.duration,
          timestamp: Date.now(),
        });
      }
    });
    inpObserver.observe({ type: "first-input", buffered: true });
  } catch {
    // INP not supported
  }
}

/**
 * Create a timed wrapper around localStorage.
 * Use this instead of raw localStorage to get timing metrics.
 */
export const timedStorage = {
  getItem<T = string>(key: string): T | null {
    return measureSync("localStorageRead", () => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    });
  },

  setItem(key: string, value: unknown): void {
    measureSync("localStorageWrite", () => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage full or unavailable
      }
    });
  },

  removeItem(key: string): void {
    measureSync("localStorageWrite", () => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Storage unavailable
      }
    });
  },
};

// Singleton: initialize Web Vitals once
let vitalsInitialized = false;
export function ensureWebVitals(): void {
  if (!vitalsInitialized && typeof window !== "undefined") {
    vitalsInitialized = true;
    initWebVitals();
  }
}

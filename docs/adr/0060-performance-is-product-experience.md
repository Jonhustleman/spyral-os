# ADR-0060: Performance Is Product Experience

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Implementation Engineer (GitHub Copilot)  
**Type:** Infrastructure  

## Context

SPYRAL OS has reached Engineering Maturity 95% with all Operational Excellence systems in place — tests, CI, error boundaries, and observability. The final piece before declaring v0.2-alpha Engineering Complete is Performance Budgets.

Performance in SPYRAL is not about technical benchmarks alone. It directly affects user trust, journey continuity, and cognitive flow. A slow studio transition breaks the user's mental model. A delayed validation erodes confidence. An unresponsive textbox during AI streaming undermines the illusion of a thinking system.

Performance budgets exist to protect **user momentum**, not engineering vanity metrics.

## Decision

Performance will be evaluated and protected in **three dimensions**:

### Dimension 1 — Technical Performance (Build-Time)

Track bundle size and asset weight. Prevents regressions from going unnoticed.

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Total JS bundle (gzip) | < 200 KB | CI warning at 180 KB |
| Initial page JS (gzip) | < 100 KB | CI warning at 90 KB |
| CSS bundle (gzip) | < 50 KB | CI warning at 45 KB |
| Image assets per page | < 500 KB | Manual review |

**Tool:** `@next/bundle-analyzer` generates HTML reports on every build. CI uploads the report as an artifact for PR review.

### Dimension 2 — Interaction Performance (Runtime)

Measure what the user experiences during a session. These metrics are collected by the observability layer (ADR-0059) and exposed in Developer Mode.

| Metric | Target | Collection Point |
|--------|--------|------------------|
| First Contentful Paint (FCP) | < 1.5s | `performance.timing` / PaintTiming API |
| Largest Contentful Paint (LCP) | < 2.5s | PerformanceObserver |
| Interaction to Next Paint (INP) | < 200ms | PerformanceObserver |
| Navigation transition time | < 150ms | Store subscription timestamps |
| Studio render time | < 100ms | `useEffect` + `performance.now()` |
| localStorage read/write | < 50ms | Wrapper timing in storage adapter |

### Dimension 3 — Cognitive Performance (Product)

These are the metrics that matter most. They measure whether SPYRAL is succeeding at its core mission: helping founders navigate reality.

| Metric | Target | Notes |
|--------|--------|-------|
| Time to First Insight | < 30s | How long before the user gains new understanding |
| Average Journey Completion | < 5 min | Full intent → learning cycle |
| Questions per Journey | 3-7 | Too few = shallow, too many = friction |
| Resume Rate | > 80% | Users who return within 24h to continue |
| Validation Completion Rate | > 90% | Users who finish validation once started |
| Learning Generation Rate | > 70% | Journeys that produce at least one insight |

## Implementation Plan

### Phase 1 — Build-Time Analysis (This Sprint)

1. Install `@next/bundle-analyzer` as a dev dependency
2. Add `ANALYZE=true` npm script to `package.json`
3. Configure `next.config.ts` with bundle analysis
4. Add bundle report upload to CI workflow as an artifact
5. Document bundle size budgets in a `performance-budgets.md` file

### Phase 2 — Runtime Measurement (This Sprint)

1. Extend the observability logger (ADR-0059) with performance-specific event types: `PerformanceMetric`, `BundleMetric`, `InteractionMetric`
2. Add a `performance.ts` utility module for collecting Web Vitals
3. Instrument studio renders with render-time tracking
4. Instrument localStorage operations with duration tracking
5. Add a Developer Mode panel showing live performance data

### Phase 3 — Product Metrics (Next Milestone)

1. Track journey-level metrics in NavigationSession
2. Compute product metrics from session data
3. Expose metrics in Developer Mode dashboard
4. Set alert thresholds for regression detection

## Consequences

### Positive

- **Performance regressions are caught in CI** before reaching production
- **User experience is measurable** alongside technical metrics
- **Cognitive load is treated as a performance concern** — unique to SPYRAL
- **Engineering Freeze becomes safe** — we have data to prove stability
- **Milestone A.2 exit criteria are clearly defined**

### Negative

- **Bundle analyzer adds ~30s to build time** (only when `ANALYZE=true`)
- **Runtime instrumentation adds slight overhead** (mitigated by sampling)
- **Product metrics require session data** — won't be accurate until real users exist

### Mitigations

- Bundle analyzer runs only on-demand via `ANALYZE=true` env var
- Runtime metrics sampled at 1:10 for high-frequency events
- Product metrics baseline established during alpha user testing

## Exit Criteria for Milestone A.2

```
🟢 Testing Foundation
🟢 Core Logic Protected
🟢 Canonical Journey Protected
🟢 CI Pipeline
🟢 Error Boundaries
🟢 Observability
🟢 Performance Budgets
```

When all seven are complete, SPYRAL v0.2-alpha Engineering is officially complete, and engineering focus shifts to user testing.

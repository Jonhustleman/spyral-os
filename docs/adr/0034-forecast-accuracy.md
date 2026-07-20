# ADR-0034: Forecast Accuracy

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

The Execution Engine produces forecasts (predicted completion dates, estimated effort, risk assessments). Without measuring forecast accuracy, the system has no way to improve its predictions or calibrate user expectations.

## Decision

Execution forecasts should eventually be measured and tracked as a key performance indicator.

Example:
- Forecast: 80% confidence of completion by target date
- Observed: Completed at 72% confidence level
- **Forecast Accuracy: 90%**

Forecast accuracy becomes an important input to the Learning Engine. Over time, the system learns which forecasting methods are most reliable for which types of work.

## Consequences

- ExecutionReport should track forecast accuracy once sufficient data is available.
- Forecast accuracy is a candidate for the Learning Engine's first learning target.
- The Variance contract can be reused for forecast-vs-actual comparisons.
- Forecast accuracy will be displayed in the Validation Studio Trend view.

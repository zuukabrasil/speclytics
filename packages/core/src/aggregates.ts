import type { SpeclyticsRun } from "./model.js";

export function computeSummary(run: Omit<SpeclyticsRun, "summary">): SpeclyticsRun["summary"] {
  let total = 0, passed = 0, failed = 0, flaky = 0, skipped = 0, durationMs = 0;

  for (const suite of run.suites) {
    durationMs += suite.durationMs;
    for (const t of suite.tests) {
      total += 1;
      if (t.outcome === "passed") passed += 1;
      else if (t.outcome === "failed") failed += 1;
      else if (t.outcome === "flaky") flaky += 1;
      else skipped += 1;
    }
  }

  return { total, passed, failed, flaky, skipped, durationMs };
}

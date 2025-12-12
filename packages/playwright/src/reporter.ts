import type {
  FullResult, Reporter, Suite, TestCase, TestResult
} from "@playwright/test/reporter";

import type { SpeclyticsRun, SpeclyticsTest } from "@speclytics/core";
import { computeSummary, fingerprintError } from "@speclytics/core";
import { createHttpSink } from "@speclytics/sink-http";

import type { SpeclyticsReporterOptions } from "./types.js";
import { stableTestId } from "./utils/ids.js";

type SinkLike = { name: string; sendRun(run: SpeclyticsRun): Promise<void> };

export default class SpeclyticsReporter implements Reporter {
  private opts: SpeclyticsReporterOptions;
  private start = Date.now();
  private run: Omit<SpeclyticsRun, "summary">;
  private sinks: SinkLike[] = [];

  constructor(options: SpeclyticsReporterOptions) {
    this.opts = options;

    this.run = {
      runId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      project: { name: options.projectName },
      env: { name: options.env },
      dimensions: options.dimensions ?? {},
      suites: []
    };

    const sinks = options.sinks ?? [];
    for (const s of sinks) {
      if (s.type === "http") this.sinks.push(createHttpSink(s.options));
    }
  }

  onBegin(_config: any, _suite: Suite) {
    this.start = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const file = test.location?.file ?? "unknown";
    const titlePath = test.titlePath();
    const id = stableTestId(file, titlePath);

    const attempts = test.results.map((r, idx) => {
      const err = r.error;
      const message = err?.message;
      const stack = this.opts.includeStacks ? err?.stack : undefined;
      const fp = fingerprintError(message, stack);

      return {
        retry: idx,
        status: r.status as "passed" | "failed" | "skipped",
        durationMs: r.duration,
        error: err ? { message: message ?? "Error", stack, fingerprint: fp } : undefined
      };
    });

    // flake (MVP): falhou em uma tentativa e passou em outra no mesmo run
    const hasFail = attempts.some(a => a.status === "failed");
    const hasPass = attempts.some(a => a.status === "passed");

    let outcome: SpeclyticsTest["outcome"] = result.status === "skipped" ? "skipped" : (result.status as any);
    if (hasFail && hasPass) outcome = "flaky";
    else if (result.status === "passed") outcome = "passed";
    else if (result.status === "failed") outcome = "failed";

    const t: SpeclyticsTest = {
      id,
      titlePath,
      file,
      outcome,
      durationMs: result.duration,
      retryCount: Math.max(0, test.results.length - 1),
      attempts
    };

    // agrupa por arquivo (suite = spec file)
    let suite = this.run.suites.find(s => s.file === file);
    if (!suite) {
      suite = { file, durationMs: 0, tests: [] };
      this.run.suites.push(suite);
    }
    suite.tests.push(t);
    suite.durationMs += result.duration;
  }

  async onEnd(result: FullResult) {
    const durationMs = Date.now() - this.start;

    const finalRun = {
      ...this.run,
      summary: {
        ...computeSummary(this.run),
        durationMs // duração real da execução
      }
    };

    // Se não configurou sink, não falha o pipeline
    if (this.sinks.length === 0) return;

    // Envia em paralelo; se falhar, propaga (você pode decidir “best-effort” depois)
    await Promise.all(this.sinks.map((s: SinkLike) => s.sendRun(finalRun)));
  }
}

export type SpeclyticsRun = {
  runId: string;
  timestamp: string; // ISO
  project: { name: string };
  env?: { name?: string };
  dimensions?: Record<string, string>; // browser, shard, etc.

  summary: {
    total: number;
    passed: number;
    failed: number;
    flaky: number;
    skipped: number;
    durationMs: number;
  };

  suites: Array<{
    file: string;
    durationMs: number;
    tests: SpeclyticsTest[];
  }>;
};

export type SpeclyticsTest = {
  id: string; // stable hash from file + titlePath
  titlePath: string[];
  file: string;
  outcome: "passed" | "failed" | "flaky" | "skipped";
  durationMs: number;
  retryCount: number;

  attempts: Array<{
    retry: number;
    status: "passed" | "failed" | "skipped";
    durationMs: number;
    error?: { message: string; stack?: string; fingerprint?: string; category?: string };
  }>;
};

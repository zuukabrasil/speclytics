import type { SpeclyticsRun } from "@speclytics/core";
import type { HttpSinkOptions, Sink } from "./types.js";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`HTTP sink timeout after ${ms}ms`)), ms);
    p.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

export function createHttpSink(opts: HttpSinkOptions): Sink {
  return {
    name: "http",
    async sendRun(run: SpeclyticsRun) {
      const timeoutMs = opts.timeoutMs ?? 10_000;

      const res = await withTimeout(
        fetch(opts.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(opts.headers ?? {})
          },
          body: JSON.stringify(run)
        }),
        timeoutMs
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `HTTP sink failed: ${res.status} ${res.statusText} ${text}`.trim()
        );
      }
    }
  };
}

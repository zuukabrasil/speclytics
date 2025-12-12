import type { SpeclyticsRun } from "@speclytics/core";

export type HttpSinkOptions = {
  endpoint: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export interface Sink {
  name: string;
  sendRun(run: SpeclyticsRun): Promise<void>;
}

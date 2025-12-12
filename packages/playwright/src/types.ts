import type { HttpSinkOptions } from "@speclytics/sink-http";

export type SpeclyticsReporterOptions = {
  projectName: string;
  env?: string;
  dimensions?: Record<string, string>;

  sinks?: Array<
    | { type: "http"; options: HttpSinkOptions }
  >;

  includeStacks?: boolean; 
};

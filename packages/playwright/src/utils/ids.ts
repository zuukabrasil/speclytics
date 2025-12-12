import { createHash } from "node:crypto";

export function stableTestId(file: string, titlePath: string[]): string {
  return createHash("sha1").update(`${file}::${titlePath.join(" > ")}`).digest("hex");
}

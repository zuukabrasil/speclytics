import { createHash } from "node:crypto";

export function hashText(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

export function fingerprintError(message?: string, stack?: string): string | undefined {
  const base = [message ?? "", stack ?? ""].join("\n").trim();
  if (!base) return undefined;
  return hashText(base);
}

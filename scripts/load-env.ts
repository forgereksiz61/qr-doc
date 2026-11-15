import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function loadLocalEnv(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const text = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function resolveSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim() || "http://localhost:3000";
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new Error("SITE_URL geçersiz. Örnek: http://localhost:3000");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SITE_URL yalnızca http veya https olabilir.");
  }

  return url.origin;
}

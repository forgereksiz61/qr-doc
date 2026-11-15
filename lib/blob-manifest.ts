import { isValidReportToken } from "@/lib/report-token";

export type BlobReportEntry = {
  token: string;
  fileName: string;
  bytes: number;
};

export type BlobReportManifest = {
  version: 1;
  entries: BlobReportEntry[];
};

function isEntry(value: unknown): value is BlobReportEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Partial<BlobReportEntry>;
  return (
    typeof entry.token === "string" &&
    isValidReportToken(entry.token) &&
    typeof entry.fileName === "string" &&
    entry.fileName.length > 0 &&
    entry.fileName.length <= 180 &&
    !entry.fileName.includes("/") &&
    !entry.fileName.includes("\\") &&
    typeof entry.bytes === "number" &&
    Number.isInteger(entry.bytes) &&
    entry.bytes > 0
  );
}

export function parseBlobManifest(raw: string): BlobReportManifest | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as { version?: unknown }).version !== 1 ||
    !Array.isArray((parsed as { entries?: unknown }).entries)
  ) {
    return null;
  }

  const entries: BlobReportEntry[] = [];
  for (const entry of (parsed as { entries: unknown[] }).entries) {
    if (!isEntry(entry)) {
      return null;
    }
    entries.push(entry);
  }

  return { version: 1, entries };
}

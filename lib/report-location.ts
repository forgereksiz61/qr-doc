import { isValidReportToken } from "@/lib/report-token";

export const BLOB_MANIFEST_PATHNAME = "reports/manifest.json";

export function usesPrivateBlob(): boolean {
  return process.env.VERCEL === "1";
}

export function reportBlobPathname(token: string): string | null {
  if (!isValidReportToken(token)) {
    return null;
  }

  return `reports/${token}.pdf`;
}

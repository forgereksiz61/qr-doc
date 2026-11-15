import path from "node:path";

export const REPORT_TOKEN_PATTERN = /^[0-9a-f]{32}$/;

export const DEMO_REPORT_TOKEN = "6b7c84a0f725a903d6b6714a2cd538ef";

export function isValidReportToken(token: string): boolean {
  return REPORT_TOKEN_PATTERN.test(token);
}

export function reportPdfPath(token: string): string | null {
  if (!isValidReportToken(token)) {
    return null;
  }

  return path.join(process.cwd(), "local-data", "reports", `${token}.pdf`);
}

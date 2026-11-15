import "server-only";
import { access, constants } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { reportPdfPath } from "@/lib/report-token";

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

export async function reportPdfExists(token: string): Promise<boolean> {
  const filePath = reportPdfPath(token);
  if (!filePath) {
    return false;
  }

  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch (error) {
    if (isMissingFile(error)) {
      return false;
    }
    throw error;
  }
}

export async function readReportPdf(token: string): Promise<Buffer | null> {
  const filePath = reportPdfPath(token);
  if (!filePath) {
    return null;
  }

  try {
    return await readFile(filePath);
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }
    throw error;
  }
}

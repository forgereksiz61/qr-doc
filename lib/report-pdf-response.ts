import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readReportPdf } from "@/lib/local-report-storage";
import { isValidReportToken } from "@/lib/report-token";

const PRIVATE_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const FALLBACK_NAME = "rapor.pdf";
const MANIFEST_PATH = path.join(process.cwd(), "local-data", "import-manifest.json");

function textResponse(body: string, status: number): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function sanitizeDownloadName(value: string): string | null {
  const baseName = path.win32.basename(value.replaceAll("\\", "/"));
  const withoutControls = baseName.replace(/[\u0000-\u001F\u007F]/g, "");
  const withoutReserved = withoutControls.replace(/[<>:"/\\|?*]/g, "").trim();
  const limited = Array.from(withoutReserved).slice(0, 180).join("").trim();
  if (!limited || limited === "." || limited === "..") {
    return null;
  }

  return limited.toLowerCase().endsWith(".pdf") ? limited : `${limited}.pdf`;
}

function asciiFallbackName(filename: string): string {
  const ascii = filename
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_")
    .trim();

  if (!ascii || ascii === ".pdf") {
    return FALLBACK_NAME;
  }

  return ascii.toLowerCase().endsWith(".pdf") ? ascii : `${ascii}.pdf`;
}

function quotedFilename(filename: string): string {
  const latin1 = Array.from(filename).every((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code <= 255 && code !== 34 && code !== 92 && code !== 127;
  });

  return latin1 ? filename : asciiFallbackName(filename);
}

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function inlineContentDisposition(filename: string): string {
  const safeName = sanitizeDownloadName(filename) ?? FALLBACK_NAME;
  const encodedName = encodeRfc5987(safeName);
  const header = `inline; filename="${quotedFilename(safeName)}"; filename*=UTF-8''${encodedName}`;
  const headerIsSafe = Array.from(header).every((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code <= 255 && code !== 127;
  });

  if (!headerIsSafe) {
    return `inline; filename="${FALLBACK_NAME}"; filename*=UTF-8''${encodeRfc5987(FALLBACK_NAME)}`;
  }

  return header;
}

async function manifestDownloadName(token: string): Promise<string | null> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as { entries?: unknown }).entries)) {
    return null;
  }

  for (const entry of (parsed as { entries: unknown[] }).entries) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    const record = entry as { token?: unknown; relativePath?: unknown };
    if (record.token !== token || typeof record.relativePath !== "string") {
      continue;
    }

    return sanitizeDownloadName(record.relativePath);
  }

  return null;
}

export async function reportPdfResponse(token: string): Promise<NextResponse> {
  if (!isValidReportToken(token)) {
    return textResponse("Rapor bulunamadı.", 404);
  }

  try {
    const pdf = await readReportPdf(token);
    if (!pdf) {
      return textResponse("Rapor bulunamadı.", 404);
    }

    const filename = (await manifestDownloadName(token)) ?? FALLBACK_NAME;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": inlineContentDisposition(filename),
      },
    });
  } catch {
    return textResponse("Belge şu anda görüntülenemiyor.", 500);
  }
}

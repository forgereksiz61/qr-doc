import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readReportPdf } from "@/lib/local-report-storage";
import { usesPrivateBlob } from "@/lib/report-location";
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

function pdfHeaders(filename: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    ...PRIVATE_HEADERS,
    "Content-Type": "application/pdf",
    "Content-Disposition": inlineContentDisposition(filename),
    "Accept-Ranges": "bytes",
    ...extra,
  };
}

function parseSingleRange(
  header: string,
  size: number,
): { start: number; end: number } | "unsatisfiable" | "unsupported" {
  if (!header.startsWith("bytes=") || header.includes(",")) {
    return "unsupported";
  }

  const match = /^(\d*)-(\d*)$/.exec(header.slice("bytes=".length).trim());
  if (!match || size <= 0) {
    return "unsatisfiable";
  }

  const [, startText, endText] = match;
  if (startText === "" && endText === "") {
    return "unsatisfiable";
  }

  if (startText === "") {
    const suffix = Number(endText);
    if (!Number.isInteger(suffix) || suffix <= 0) {
      return "unsatisfiable";
    }
    return { start: Math.max(size - suffix, 0), end: size - 1 };
  }

  const start = Number(startText);
  const end = endText === "" ? size - 1 : Number(endText);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return "unsatisfiable";
  }

  return { start, end: Math.min(end, size - 1) };
}

function pdfBytesResponse(bytes: Buffer, filename: string, request: Request): NextResponse {
  const body = new Uint8Array(bytes);
  const range = request.headers.get("range");
  if (!range) {
    return new NextResponse(body, {
      status: 200,
      headers: pdfHeaders(filename, { "Content-Length": String(body.byteLength) }),
    });
  }

  const parsed = parseSingleRange(range, body.byteLength);
  if (parsed === "unsupported") {
    return new NextResponse(body, {
      status: 200,
      headers: pdfHeaders(filename, { "Content-Length": String(body.byteLength) }),
    });
  }
  if (parsed === "unsatisfiable") {
    return new NextResponse(null, {
      status: 416,
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Range": `bytes */${body.byteLength}`,
      },
    });
  }

  const slice = body.subarray(parsed.start, parsed.end + 1);
  return new NextResponse(new Uint8Array(slice), {
    status: 206,
    headers: pdfHeaders(filename, {
      "Content-Range": `bytes ${parsed.start}-${parsed.end}/${body.byteLength}`,
      "Content-Length": String(slice.byteLength),
    }),
  });
}

async function readReportBytes(token: string): Promise<Buffer | null> {
  if (!usesPrivateBlob()) {
    return readReportPdf(token);
  }

  const { readPrivateReportPdf } = await import("@/lib/private-blob-reports");
  return readPrivateReportPdf(token);
}

async function readReportFileName(token: string): Promise<string> {
  if (!usesPrivateBlob()) {
    return (await manifestDownloadName(token)) ?? FALLBACK_NAME;
  }

  const { readPrivateReportFileName } = await import("@/lib/private-blob-reports");
  return (await readPrivateReportFileName(token)) ?? FALLBACK_NAME;
}

export async function reportPdfResponse(token: string, request: Request): Promise<NextResponse> {
  if (!isValidReportToken(token)) {
    return textResponse("Rapor bulunamadı.", 404);
  }

  try {
    const pdf = await readReportBytes(token);
    if (!pdf) {
      return textResponse("Rapor bulunamadı.", 404);
    }

    return pdfBytesResponse(pdf, await readReportFileName(token), request);
  } catch {
    return textResponse("Belge şu anda görüntülenemiyor.", 500);
  }
}

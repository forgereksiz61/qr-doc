import "server-only";
import { get } from "@vercel/blob";
import { parseBlobManifest } from "@/lib/blob-manifest";
import { BLOB_MANIFEST_PATHNAME, reportBlobPathname } from "@/lib/report-location";

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}

async function readPrivatePath(pathname: string): Promise<Buffer | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  return readStream(result.stream);
}

export async function readPrivateReportPdf(token: string): Promise<Buffer | null> {
  const pathname = reportBlobPathname(token);
  if (!pathname) {
    return null;
  }

  return readPrivatePath(pathname);
}

export async function readPrivateReportFileName(token: string): Promise<string | null> {
  const manifestBytes = await readPrivatePath(BLOB_MANIFEST_PATHNAME);
  if (!manifestBytes) {
    return null;
  }

  const manifest = parseBlobManifest(manifestBytes.toString("utf8"));
  const entry = manifest?.entries.find((item) => item.token === token);
  return entry?.fileName ?? null;
}

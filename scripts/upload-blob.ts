import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { BLOB_MANIFEST_PATHNAME, reportBlobPathname } from "../lib/report-location";
import { isValidReportToken } from "../lib/report-token";
import { loadLocalEnv } from "./load-env";

type ManifestEntry = {
  token: string;
  relativePath: string;
};

type PlannedUpload = {
  token: string;
  fileName: string;
  bytes: number;
  sourcePath: string;
};

const MANIFEST_PATH = path.join(process.cwd(), "local-data", "import-manifest.json");

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

async function loadTokenMap(): Promise<Map<string, string>> {
  const parsed: unknown = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as { entries?: unknown }).entries)) {
    throw new Error("Yerel manifest okunamadı.");
  }

  const byName = new Map<string, string>();
  for (const entry of (parsed as { entries: unknown[] }).entries) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Yerel manifest kaydı geçersiz.");
    }
    const record = entry as Partial<ManifestEntry>;
    if (typeof record.token !== "string" || !isValidReportToken(record.token)) {
      throw new Error("Yerel manifest token geçersiz.");
    }
    if (typeof record.relativePath !== "string" || record.relativePath.length === 0) {
      throw new Error("Yerel manifest dosya adı eksik.");
    }
    const fileName = path.win32.basename(record.relativePath);
    if (byName.has(fileName)) {
      throw new Error("Yerel manifestte yinelenen dosya adı var.");
    }
    byName.set(fileName, record.token);
  }

  return byName;
}

async function collectUpdatedPdfs(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "tr"));
}

async function planUploads(directory: string, byName: Map<string, string>): Promise<PlannedUpload[]> {
  const fileNames = await collectUpdatedPdfs(directory);
  const unmatched = fileNames.filter((fileName) => !byName.has(fileName));
  const missing = [...byName.keys()].filter((fileName) => !fileNames.includes(fileName));

  if (unmatched.length > 0 || missing.length > 0) {
    console.error("Dosya adları birebir eşleşmedi. Otomatik eşleştirme yapılmadı.");
    for (const fileName of unmatched) {
      console.error(`Klasörde fazla: ${fileName}`);
    }
    for (const fileName of missing) {
      console.error(`Klasörde yok: ${fileName}`);
    }
    process.exitCode = 1;
    return [];
  }

  const planned: PlannedUpload[] = [];
  for (const fileName of fileNames) {
    const token = byName.get(fileName);
    const sourcePath = path.join(directory, fileName);
    if (!token) {
      throw new Error("Eşleşen token bulunamadı.");
    }
    const info = await stat(sourcePath);
    const header = Buffer.alloc(5);
    const handle = await open(sourcePath, "r");
    try {
      await handle.read(header, 0, 5, 0);
    } finally {
      await handle.close();
    }
    const digest = await sha256File(sourcePath);
    if (info.size <= 0 || header.toString("ascii") !== "%PDF-" || digest.length !== 64) {
      throw new Error(`PDF okunamadı: ${fileName}`);
    }
    planned.push({ token, fileName, bytes: info.size, sourcePath });
  }

  return planned;
}

async function blobExists(pathname: string): Promise<boolean> {
  const { BlobNotFoundError, head } = await import("@vercel/blob");
  try {
    await head(pathname);
    return true;
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return false;
    }
    throw error;
  }
}

async function uploadPlanned(planned: PlannedUpload[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error(
      "Gerçek yükleme için BLOB_READ_WRITE_TOKEN gerekli. Değeri terminale yazılmadı.",
    );
  }

  const { put } = await import("@vercel/blob");
  const uploaded: PlannedUpload[] = [];

  for (const item of planned) {
    const pathname = reportBlobPathname(item.token);
    if (!pathname) {
      throw new Error("Blob yolu üretilemedi.");
    }
    if (await blobExists(pathname)) {
      console.log(`Atlandı, blob zaten var: ${item.token} (${item.bytes} bayt)`);
      uploaded.push(item);
      continue;
    }

    const bytes = await readFile(item.sourcePath);
    await put(pathname, bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/pdf",
      cacheControlMaxAge: 60,
    });
    console.log(`Yüklendi: ${item.token} (${item.bytes} bayt)`);
    uploaded.push(item);
  }

  if (uploaded.length !== planned.length) {
    throw new Error("Manifest yüklenmedi. Bütün PDF yüklemeleri tamamlanmadı.");
  }

  if (await blobExists(BLOB_MANIFEST_PATHNAME)) {
    console.log("Manifest atlandı, blob zaten var.");
    return;
  }

  const manifest = {
    version: 1,
    entries: planned.map((item) => ({
      token: item.token,
      fileName: item.fileName,
      bytes: item.bytes,
    })),
  };
  await put(BLOB_MANIFEST_PATHNAME, JSON.stringify(manifest), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  console.log("Özel manifest yüklendi.");
}

async function main(): Promise<void> {
  loadLocalEnv();
  const upload = process.argv.includes("--upload");
  const directory = process.env.PDF_UPDATED_DIR?.trim();
  if (!directory) {
    throw new Error("PDF_UPDATED_DIR tanımlı değil.");
  }

  const resolved = path.resolve(directory);
  const info = await stat(resolved);
  if (!info.isDirectory()) {
    throw new Error("PDF_UPDATED_DIR bir klasör olmalıdır.");
  }

  const planned = await planUploads(resolved, await loadTokenMap());
  if (planned.length === 0) {
    return;
  }

  console.log(upload ? "Gerçek yükleme" : "dry-run");
  for (const item of planned) {
    console.log(`${item.fileName} | ${item.token} | ${item.bytes}`);
  }
  console.log(`Eşleşen PDF: ${planned.length}`);

  if (!upload) {
    console.log("Blob'a veri gönderilmedi.");
    return;
  }

  await uploadPlanned(planned);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Yükleme hazırlığı tamamlanamadı.";
  console.error(message);
  process.exitCode = 1;
});

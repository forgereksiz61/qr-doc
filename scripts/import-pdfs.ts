import { createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { isValidReportToken, reportPdfPath } from "../lib/report-token";
import { loadLocalEnv, resolveSiteUrl } from "./load-env";

type ManifestEntry = {
  token: string;
  sha256: string;
  relativePath: string;
  bytes: number;
  importedAt: string;
};

type Manifest = {
  version: 1;
  entries: ManifestEntry[];
};

type CsvRow = {
  relativePath: string;
  fileName: string;
  token: string;
  reportUrl: string;
};

const MANIFEST_PATH = path.join(process.cwd(), "local-data", "import-manifest.json");
const REPORTS_DIR = path.join(process.cwd(), "local-data", "reports");
const CSV_PATH = path.join(process.cwd(), "exports", "report-links.csv");

function resolveImportDir(): string {
  const raw = process.env.PDF_IMPORT_DIR?.trim();
  if (!raw) {
    throw new Error(
      "PDF_IMPORT_DIR tanımlı değil. .env.local dosyasına içe aktarılacak klasörü yazın.",
    );
  }

  return path.resolve(raw);
}

function isSameOrInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

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

async function collectPdfs(directory: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        found.push(fullPath);
      }
    }
  }

  await walk(directory);
  found.sort((left, right) => left.localeCompare(right, "tr"));
  return found;
}

function isManifestEntry(value: unknown): value is ManifestEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Partial<ManifestEntry>;
  return (
    typeof entry.token === "string" &&
    isValidReportToken(entry.token) &&
    typeof entry.sha256 === "string" &&
    /^[0-9a-f]{64}$/.test(entry.sha256) &&
    typeof entry.relativePath === "string" &&
    entry.relativePath.length > 0 &&
    typeof entry.bytes === "number" &&
    Number.isInteger(entry.bytes) &&
    entry.bytes >= 0 &&
    typeof entry.importedAt === "string"
  );
}

async function loadManifest(): Promise<Manifest> {
  if (!existsSync(MANIFEST_PATH)) {
    return { version: 1, entries: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  } catch {
    throw new Error("Manifest okunamadı. Mevcut bağlantıları korumak için dosya değiştirilmedi.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as { version?: unknown }).version !== 1 ||
    !Array.isArray((parsed as { entries?: unknown }).entries)
  ) {
    throw new Error("Manifest biçimi tanınmıyor. Mevcut bağlantıları korumak için işlem durdu.");
  }

  const entries: ManifestEntry[] = [];
  for (const entry of (parsed as { entries: unknown[] }).entries) {
    if (!isManifestEntry(entry)) {
      throw new Error("Manifest kaydı geçersiz. Mevcut bağlantıları korumak için işlem durdu.");
    }
    entries.push(entry);
  }

  return { version: 1, entries };
}

async function saveManifest(manifest: Manifest): Promise<void> {
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  const temporaryPath = `${MANIFEST_PATH}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(temporaryPath, MANIFEST_PATH);
}

function allocateToken(usedTokens: Set<string>): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const token = randomBytes(16).toString("hex");
    const destination = reportPdfPath(token);
    if (
      !destination ||
      !isValidReportToken(token) ||
      usedTokens.has(token) ||
      existsSync(destination)
    ) {
      continue;
    }

    usedTokens.add(token);
    return token;
  }

  throw new Error("Benzersiz token üretilemedi.");
}

function assertReportDestination(destination: string): void {
  if (
    !isSameOrInside(REPORTS_DIR, destination) ||
    path.extname(destination).toLowerCase() !== ".pdf"
  ) {
    throw new Error("Hedef yol geçersiz.");
  }
}

async function copyVerified(
  sourcePath: string,
  destination: string,
  sourceSize: number,
): Promise<void> {
  assertReportDestination(destination);
  await copyFile(sourcePath, destination);
  const copied = await stat(destination);
  if (copied.size !== sourceSize) {
    await rm(destination, { force: true });
    throw new Error("Kopyalanan dosyanın boyutu kaynakla aynı değil.");
  }
}

function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function writeCsv(rows: CsvRow[]): Promise<void> {
  await mkdir(path.dirname(CSV_PATH), { recursive: true });
  const lines = [
    "relative_path,file_name,token,report_url",
    ...rows.map((row) =>
      [row.relativePath, row.fileName, row.token, row.reportUrl].map(csvField).join(","),
    ),
  ];
  await writeFile(CSV_PATH, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

async function main(): Promise<void> {
  loadLocalEnv();
  const siteUrl = resolveSiteUrl();
  const importDir = resolveImportDir();

  if (isSameOrInside(REPORTS_DIR, importDir) || isSameOrInside(importDir, REPORTS_DIR)) {
    throw new Error("Kaynak klasör, kopyaların bulunduğu local-data/reports klasörüyle örtüşemez.");
  }

  let sourceStat;
  try {
    sourceStat = await stat(importDir);
  } catch {
    throw new Error("PDF_IMPORT_DIR klasörü bulunamadı.");
  }
  if (!sourceStat.isDirectory()) {
    throw new Error("PDF_IMPORT_DIR bir klasör olmalıdır.");
  }

  const manifest = await loadManifest();
  const byHash = new Map(manifest.entries.map((entry) => [entry.sha256, entry]));
  const usedTokens = new Set(manifest.entries.map((entry) => entry.token));
  const realRoot = await realpath(importDir);
  const pdfs = await collectPdfs(importDir);
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const rows: CsvRow[] = [];

  await mkdir(REPORTS_DIR, { recursive: true });

  for (const sourcePath of pdfs) {
    const relativePath = path.relative(importDir, sourcePath);
    try {
      const realFile = await realpath(sourcePath);
      if (!isSameOrInside(realRoot, realFile)) {
        throw new Error("Dosya kaynak klasörün dışında.");
      }

      const sourceHash = await sha256File(sourcePath);
      const sourceSize = (await stat(sourcePath)).size;
      let entry = byHash.get(sourceHash);

      if (!entry) {
        const token = allocateToken(usedTokens);
        const destination = reportPdfPath(token);
        if (!destination) {
          throw new Error("Token için hedef yol üretilemedi.");
        }
        await copyVerified(sourcePath, destination, sourceSize);
        entry = {
          token,
          sha256: sourceHash,
          relativePath,
          bytes: sourceSize,
          importedAt: new Date().toISOString(),
        };
        manifest.entries.push(entry);
        byHash.set(sourceHash, entry);
        await saveManifest(manifest);
        imported += 1;
      } else {
        const destination = reportPdfPath(entry.token);
        if (!destination) {
          throw new Error("Kayıtlı token için hedef yol üretilemedi.");
        }

        if (!existsSync(destination)) {
          await copyVerified(sourcePath, destination, sourceSize);
          imported += 1;
        } else {
          const destinationHash = await sha256File(destination);
          if (destinationHash !== sourceHash) {
            await copyVerified(sourcePath, destination, sourceSize);
            imported += 1;
          } else {
            skipped += 1;
          }
        }
      }

      rows.push({
        relativePath,
        fileName: path.basename(sourcePath),
        token: entry.token,
        reportUrl: `${siteUrl}/public/report/${entry.token}`,
      });
    } catch (error) {
      errors += 1;
      const message = error instanceof Error ? error.message : "Dosya aktarılamadı.";
      console.error(`Hata: ${relativePath} — ${message}`);
    }
  }

  rows.sort((left, right) => left.relativePath.localeCompare(right.relativePath, "tr"));
  await writeCsv(rows);

  console.log(`Kaynak: ${importDir}`);
  console.log(`Bulunan PDF: ${pdfs.length}`);
  console.log(`Yeni aktarılan: ${imported}`);
  console.log(`Atlanan: ${skipped}`);
  console.log(`Hata: ${errors}`);
  console.log(`Bağlantı listesi: ${CSV_PATH}`);
  console.log("Aynı içerik yeniden aktarılırsa mevcut token korunur.");

  if (errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "İçe aktarma tamamlanamadı.";
  console.error(message);
  process.exitCode = 1;
});

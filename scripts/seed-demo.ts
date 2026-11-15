import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_REPORT_TOKEN, reportPdfPath } from "../lib/report-token";
import { buildDemoPdf, demoPdfLines } from "./demo-pdf";
import { isLoopbackSite, reportPageUrl, writeDemoQr } from "./demo-qr";
import { loadLocalEnv, resolveSiteUrl } from "./load-env";

async function main(): Promise<void> {
  loadLocalEnv();
  const siteUrl = resolveSiteUrl();
  const pdfPath = reportPdfPath(DEMO_REPORT_TOKEN);

  if (!pdfPath) {
    throw new Error("Demo token geçersiz.");
  }

  await mkdir(path.dirname(pdfPath), { recursive: true });
  const pdf = buildDemoPdf(demoPdfLines(DEMO_REPORT_TOKEN));
  if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error("Demo PDF oluşturulamadı.");
  }

  await writeFile(pdfPath, pdf);
  const qrPath = await writeDemoQr(siteUrl);

  console.log("Örnek rapor hazır.");
  console.log(`Demo token: ${DEMO_REPORT_TOKEN}`);
  console.log(`Rapor sayfası: ${reportPageUrl(siteUrl)}`);
  console.log(`PDF adresi: ${siteUrl}/api/report/${DEMO_REPORT_TOKEN}/pdf`);
  console.log(`QR dosyası: ${qrPath}`);

  if (isLoopbackSite(siteUrl)) {
    console.log(
      "Not: localhost QR kodu telefonda açılmaz. Aynı Wi-Fi için SITE_URL değerini bilgisayarın LAN adresine çevirip npm run qr çalıştırın.",
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Örnek rapor oluşturulamadı.";
  console.error(message);
  process.exitCode = 1;
});

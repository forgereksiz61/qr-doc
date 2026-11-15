import { access } from "node:fs/promises";
import { DEMO_REPORT_TOKEN, reportPdfPath } from "../lib/report-token";
import { isLoopbackSite, reportPageUrl, writeDemoQr } from "./demo-qr";
import { loadLocalEnv, resolveSiteUrl } from "./load-env";

async function main(): Promise<void> {
  loadLocalEnv();
  const siteUrl = resolveSiteUrl();
  const pdfPath = reportPdfPath(DEMO_REPORT_TOKEN);

  if (!pdfPath) {
    throw new Error("Demo token geçersiz.");
  }

  try {
    await access(pdfPath);
  } catch {
    throw new Error("Demo PDF yok. Önce npm run seed:demo çalıştırın.");
  }

  const qrPath = await writeDemoQr(siteUrl);
  console.log(`QR dosyası: ${qrPath}`);
  console.log(`Rapor sayfası: ${reportPageUrl(siteUrl)}`);

  if (isLoopbackSite(siteUrl)) {
    console.log(
      "Not: localhost adresi telefonda bu bilgisayarı açmaz. Telefon testi için SITE_URL değerini LAN adresine çevirip QR kodunu yeniden üretin.",
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "QR üretilemedi.";
  console.error(message);
  process.exitCode = 1;
});

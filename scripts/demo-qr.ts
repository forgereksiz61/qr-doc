import { mkdir } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { DEMO_REPORT_TOKEN } from "../lib/report-token";

export function reportPageUrl(siteUrl: string): string {
  return `${siteUrl}/public/report/${DEMO_REPORT_TOKEN}`;
}

export async function writeDemoQr(siteUrl: string): Promise<string> {
  const outputDir = path.join(process.cwd(), "exports");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "demo-report-qr.png");

  await QRCode.toFile(outputPath, reportPageUrl(siteUrl), {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return outputPath;
}

export function isLoopbackSite(siteUrl: string): boolean {
  const hostname = new URL(siteUrl).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

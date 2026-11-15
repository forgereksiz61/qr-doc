import { reportPdfResponse } from "@/lib/report-pdf-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PdfRouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: PdfRouteContext) {
  const { token } = await context.params;
  return reportPdfResponse(token, request);
}

import { reportPdfResponse } from "@/lib/report-pdf-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReportRouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: ReportRouteContext) {
  const { token } = await context.params;
  return reportPdfResponse(token, request);
}

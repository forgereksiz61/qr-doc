import { NextResponse } from "next/server";

const DESTINATION = "https://linkosgb.com.tr/";

function redirectHome(): NextResponse {
  return NextResponse.redirect(DESTINATION, {
    status: 302,
    headers: {
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}

export function GET() {
  return redirectHome();
}

export function HEAD() {
  return redirectHome();
}

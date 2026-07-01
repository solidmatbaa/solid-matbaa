import { NextRequest, NextResponse } from "next/server";

/** Legacy link verification — redirect to OTP-based login flow. */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(
    `${appUrl}/ar/auth/login?info=use_otp`
  );
}

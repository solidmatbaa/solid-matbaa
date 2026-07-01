import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeAndSendOtp } from "@/lib/otp";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const admin = createAdminClient();

    const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = usersPage?.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return NextResponse.json({
        success: true,
        data: { message: "If account exists, code sent" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("email_verified, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.email_verified) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Email already verified" },
        { status: 400 }
      );
    }

    const otpResult = await storeAndSendOtp(
      normalizedEmail,
      profile?.full_name ?? "Customer"
    );

    if (!otpResult.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: otpResult.error ?? "Failed to send code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Verification code sent" },
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

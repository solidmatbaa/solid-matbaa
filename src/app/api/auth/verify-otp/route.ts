import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyOtpCode } from "@/lib/otp";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { formatAuthError } from "@/lib/auth-errors";
import type { ApiResponse } from "@/types";

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { success: false, error: "Invalid JSON body" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Invalid Code" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const { email, otpCode, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const result = await verifyOtpCode(normalizedEmail, otpCode);

    if (!result.ok) {
      return Response.json(
        { success: false, error: result.error ?? "Invalid Code" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const { supabase, response } = createSupabaseRouteClient(request, {
      success: true,
      data: { verified: true, message: "Signed in" },
    });

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      console.error("Post-OTP sign-in error:", signInError);
      return Response.json(
        {
          success: false,
          error: formatAuthError(signInError, "Verification succeeded but sign-in failed"),
        } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    return response;
  } catch (err) {
    console.error("Verify OTP error:", err);
    return Response.json(
      { success: false, error: "Internal server error" } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

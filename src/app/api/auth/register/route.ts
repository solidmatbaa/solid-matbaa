import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeAndSendOtp } from "@/lib/otp";
import { formatAuthError } from "@/lib/auth-errors";
import { validateUserAddress } from "@/lib/address-data";
import type { ApiResponse, UserAddress } from "@/types";

function otpSentResponse(email: string) {
  return NextResponse.json({
    success: true,
    message: "OTP sent",
    data: { message: "Verification code sent to your email", email },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email, password, fullName, username, phone, address, locale } = body;

    if (!email || !password || !fullName || !username || !phone || !address) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const addressError = validateUserAddress(address as UserAddress);
    if (addressError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: addressError },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const { data: usernameTaken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (usernameTaken) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Username is already taken" },
        { status: 400 }
      );
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, email_verified, full_name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile?.email_verified) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "A user with this email address has already been registered" },
        { status: 400 }
      );
    }

    if (existingProfile && !existingProfile.email_verified) {
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(
        existingProfile.id,
        {
          password,
          user_metadata: {
            full_name: fullName,
            username: normalizedUsername,
            phone,
            locale: locale ?? "ar",
          },
        }
      );

      if (updateAuthError) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: formatAuthError(updateAuthError) },
          { status: 400 }
        );
      }

      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({
          full_name: fullName,
          username: normalizedUsername,
          phone,
          address: address as UserAddress,
          locale: locale ?? "ar",
          email_verified: false,
        })
        .eq("id", existingProfile.id);

      if (profileUpdateError) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: profileUpdateError.message || "Failed to update profile" },
          { status: 500 }
        );
      }

      const otpResult = await storeAndSendOtp(normalizedEmail, fullName);
      if (!otpResult.ok) {
        console.error("OTP resend for existing user failed:", otpResult.error);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: otpResult.error ?? "Failed to send verification code" },
          { status: 500 }
        );
      }

      return otpSentResponse(normalizedEmail);
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
        username: normalizedUsername,
        phone,
        locale: locale ?? "ar",
      },
    });

    if (authError || !authData.user) {
      console.error("Register createUser error:", authError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: formatAuthError(authError) },
        { status: 400 }
      );
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        username: normalizedUsername,
        phone,
        address: address as UserAddress,
        locale: locale ?? "ar",
        email_verified: false,
        role: "customer",
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Register profile update error:", profileError);
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: profileError.message || "Failed to save profile" },
        { status: 400 }
      );
    }

    const otpResult = await storeAndSendOtp(normalizedEmail, fullName);
    if (!otpResult.ok) {
      console.error("Register OTP send failed:", otpResult.error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: otpResult.error ?? "Failed to send verification code" },
        { status: 500 }
      );
    }

    return otpSentResponse(normalizedEmail);
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

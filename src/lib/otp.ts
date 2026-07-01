import { randomInt, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOtpEmail } from "@/lib/resend";

export const OTP_EXPIRY_MINUTES = 10;

export function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function storeAndSendOtp(
  email: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: dbError } = await admin.from("otp_verifications").upsert(
    {
      email: email.toLowerCase().trim(),
      otp_code: otpCode,
      expires_at: expiresAt,
    },
    { onConflict: "email" }
  );

  if (dbError) {
    return { ok: false, error: dbError.message };
  }

  const sent = await sendOtpEmail(email, name, otpCode, OTP_EXPIRY_MINUTES);
  if (!sent) {
    return { ok: false, error: "Failed to send verification email" };
  }

  return { ok: true };
}

export async function verifyOtpCode(
  email: string,
  otpCode: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data: row, error: fetchError } = await admin
    .from("otp_verifications")
    .select("otp_code, expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (fetchError || !row) {
    return { ok: false, error: "Invalid Code" };
  }

  if (new Date(row.expires_at) < new Date()) {
    await admin.from("otp_verifications").delete().eq("email", normalizedEmail);
    return { ok: false, error: "Invalid Code" };
  }

  if (!safeCompare(row.otp_code, otpCode.trim())) {
    return { ok: false, error: "Invalid Code" };
  }

  const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = usersPage?.users.find(
    (u) => u.email?.toLowerCase() === normalizedEmail
  );

  if (!user) {
    return { ok: false, error: "Invalid Code" };
  }

  await admin.auth.admin.updateUserById(user.id, { email_confirm: true });

  await admin
    .from("profiles")
    .update({ email_verified: true, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  await admin.from("otp_verifications").delete().eq("email", normalizedEmail);

  return { ok: true };
}

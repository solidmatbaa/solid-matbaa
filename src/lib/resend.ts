import { Resend } from "resend";

const DEFAULT_FROM = "Solid Matbaa <noreply@solidmatbaa.com>";

let resendClient: Resend | null = null;

export function getResendFrom(): string {
  return process.env.RESEND_FROM || DEFAULT_FROM;
}

export function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
): Promise<boolean> {
  try {
    const resend = getResend();
    const from = getResendFrom();

    const result = await resend.emails.send({
      from,
      to,
      subject: "Verify your email - Solid Matbaa | تأكيد بريدك الإلكتروني",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #0369a1;">Solid Matbaa | سوليد مطبعة</h1>
          <p>مرحباً ${name}،</p>
          <p>شكراً لتسجيلك معنا. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
          <p style="margin: 32px 0;">
            <a href="${verifyUrl}" style="background: #0284c7; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              تأكيد البريد الإلكتروني
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Hello ${name}, please verify your email by clicking the button above.</p>
          <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("Resend verification email API error:", result.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Resend verification email failed:", err);
    return false;
  }
}

export async function sendOtpEmail(
  to: string,
  name: string,
  otpCode: string,
  expiryMinutes: number
): Promise<boolean> {
  try {
    const resend = getResend();
    const from = getResendFrom();

    const result = await resend.emails.send({
      from,
      to,
      subject: `Your verification code: ${otpCode} - Solid Matbaa`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #0369a1;">Solid Matbaa | سوليد مطبعة</h1>
          <p>مرحباً ${name}،</p>
          <p>رمز التحقق الخاص بك:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0284c7; margin: 24px 0;">${otpCode}</p>
          <p style="color: #666; font-size: 14px;">Hello ${name}, your verification code is <strong>${otpCode}</strong>.</p>
          <p style="color: #999; font-size: 12px;">This code expires in ${expiryMinutes} minutes.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("Resend OTP email API error:", result.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Resend OTP email failed:", err);
    return false;
  }
}

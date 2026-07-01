import { NextRequest, NextResponse } from "next/server";
import { ensureSolidAdminExists } from "@/lib/admin-init";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensurePaymentReceiptsStorage } from "@/lib/payment-receipts-storage";
import type { ApiResponse } from "@/types";

/**
 * Manual admin bootstrap endpoint.
 * Requires header: x-admin-init-secret: <ADMIN_INIT_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.ADMIN_INIT_SECRET;
    const provided = request.headers.get("x-admin-init-secret");

    if (!secret || provided !== secret) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const result = await ensureSolidAdminExists();

    if (result.error && !result.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const admin = createAdminClient();
    const storageResult = await ensurePaymentReceiptsStorage(admin);

    if (!storageResult.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: storageResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Admin init error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

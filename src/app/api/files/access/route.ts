import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { resolveStorageObjectPath } from "@/lib/storage-access";
import type { ApiResponse } from "@/types";

const ALLOWED_BUCKETS = new Set(["payment-receipts", "order-designs", "order-receipts"]);

export async function GET(request: NextRequest) {
  try {
    const bucket = request.nextUrl.searchParams.get("bucket")?.trim() ?? "";
    const pathParam = request.nextUrl.searchParams.get("path")?.trim() ?? "";

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid bucket" },
        { status: 400 }
      );
    }

    const objectPath = resolveStorageObjectPath(bucket, pathParam);
    if (!objectPath) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid file path" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pathParts = objectPath.split("/");
    const ownerId = pathParts[1];
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();

    const isOwner = ownerId === user.id;
    const isTenantAdmin =
      isAdmin(profile) &&
      (!profile?.tenant_id || !pathParts[0] || pathParts[0] === profile.tenant_id);

    if (!isOwner && !isTenantAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60 * 15);

    if (error || !data?.signedUrl) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error?.message ?? "Could not access file" },
        { status: 404 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error("Storage access error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSolidAdmin } from "@/lib/auth";
import { getSiteIban } from "@/lib/payment-details";
import type { ApiResponse } from "@/types";

const settingsSchema = z.object({
  hero_images: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  contact_info: z
    .object({
      email: z.string(),
      phone: z.string(),
      address: z.record(z.string()),
    })
    .optional(),
  site_content: z
    .object({
      hero_title: z.record(z.string()),
      hero_subtitle: z.record(z.string()),
      hero_button_designs: z.record(z.string()),
      hero_button_custom: z.record(z.string()),
      instagram_url: z.string(),
      facebook_url: z.string(),
    })
    .optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "solid-matbaa";

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (!tenant) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        iban: getSiteIban(settings.iban),
      },
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id, username")
      .eq("id", user.id)
      .single();

    if (!isSolidAdmin(profile)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("settings")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("tenant_id", profile!.tenant_id);

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSolidAdmin } from "@/lib/auth";
import type { ApiResponse, Product } from "@/types";

async function getAdminProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id, username")
    .eq("id", user.id)
    .single();

  if (!isSolidAdmin(profile)) return null;
  return profile;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: products ?? [] });
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAdminProfile();
    if (!profile) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .insert({
        tenant_id: profile.tenant_id,
        name: body.name,
        description: body.description,
        price: body.price ?? 0,
        pricing_tiers: body.pricing_tiers ?? [
          { quantity: 100, price: 19 },
          { quantity: 500, price: 39 },
          { quantity: 1000, price: 69 },
        ],
        image_url: body.image_url ?? null,
        sizes: body.sizes ?? [],
        specs: body.specs ?? [],
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Products POST error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await getAdminProfile();
    if (!profile) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Product ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Products PATCH error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const profile = await getAdminProfile();
    if (!profile) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Product ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    console.error("Products DELETE error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateUserAddress } from "@/lib/address-data";
import { routing } from "@/i18n/routing";
import type { ApiResponse, Profile, UserAddress } from "@/types";

const userAddressSchema = z
  .object({
    country: z.string().min(1),
    state: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    region: z.string().optional(),
    street: z.string().min(1),
    building_number: z.string().min(1),
    apartment_number: z.string().min(1),
    postal_code: z.string().optional(),
    additional_details: z.string().optional(),
    province: z.string().optional(),
    neighborhood: z.string().optional(),
  })
  .passthrough();

const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(3).max(40).optional(),
    locale: z.enum(routing.locales).optional(),
    address: userAddressSchema.optional(),
  })
  .refine(
    (data) =>
      data.full_name !== undefined ||
      data.phone !== undefined ||
      data.locale !== undefined ||
      data.address !== undefined,
    { message: "No profile fields to update" }
  );

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Profile>>({
      success: true,
      data: profile as Profile,
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    if (parsed.data.address) {
      const addressError = validateUserAddress(parsed.data.address as UserAddress);
      if (addressError) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: addressError },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.full_name !== undefined) updateData.full_name = parsed.data.full_name;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
    if (parsed.data.locale !== undefined) updateData.locale = parsed.data.locale;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

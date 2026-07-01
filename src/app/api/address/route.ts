import { NextRequest, NextResponse } from "next/server";
import {
  getCountryFieldConfig,
  getDistrictsForCountry,
  getNeighborhoodsForCountry,
  getProvincesForCountry,
  getSupportedCountries,
} from "@/lib/address-providers";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get("country")?.trim();
    const province = request.nextUrl.searchParams.get("province")?.trim();
    const district = request.nextUrl.searchParams.get("district")?.trim();
    const level = request.nextUrl.searchParams.get("level") ?? "provinces";

    if (level === "countries") {
      return NextResponse.json({ success: true, data: getSupportedCountries() });
    }

    if (level === "config") {
      if (!country) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "country is required" },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: getCountryFieldConfig(country) });
    }

    if (!country) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "country is required" },
        { status: 400 }
      );
    }

    if (level === "provinces") {
      return NextResponse.json({ success: true, data: getProvincesForCountry(country) });
    }

    if (level === "districts") {
      if (!province) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "province is required" },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: getDistrictsForCountry(country, province) });
    }

    if (level === "neighborhoods") {
      if (!province || !district) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "province and district are required" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        data: getNeighborhoodsForCountry(country, province, district),
      });
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Invalid level" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Address API error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

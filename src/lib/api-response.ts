import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export function jsonApiResponse<T>(
  body: ApiResponse<T>,
  status = body.success ? 200 : 400
): NextResponse {
  return NextResponse.json(body, { status, headers: JSON_HEADERS });
}

export function jsonApiError(
  error: string,
  status = 500
): NextResponse {
  return jsonApiResponse({ success: false, error }, status);
}

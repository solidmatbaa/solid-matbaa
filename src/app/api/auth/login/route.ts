import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { formatAuthError } from "@/lib/auth-errors";
import type { ApiResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { success: false, error: "Invalid JSON body" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Invalid email or password" } satisfies ApiResponse<null>,
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { password } = parsed.data;

    const { supabase, response } = createSupabaseRouteClient(request, {
      success: true,
      data: { message: "Signed in" },
    });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return Response.json(
        { success: false, error: formatAuthError(error, "Invalid email or password") } satisfies ApiResponse<null>,
        { status: 401 }
      );
    }

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return Response.json(
      { success: false, error: "Internal server error" } satisfies ApiResponse<null>,
      { status: 500 }
    );
  }
}

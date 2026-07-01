import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL, ADMIN_USERNAME } from "@/lib/auth";

export interface AdminInitResult {
  exists: boolean;
  created: boolean;
  updated: boolean;
  error?: string;
}

let initPromise: Promise<AdminInitResult> | null = null;

async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
) {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) return match;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function upsertAdminProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "solid-matbaa")
    .maybeSingle();

  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      tenant_id: tenant?.id ?? null,
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      role: "admin",
      email_verified: true,
      full_name: "Solid Matbaa Admin",
      locale: "en",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

/**
 * Ensures the default Solid Matbaa admin exists in Supabase Auth + profiles.
 * Safe to call on startup; deduped per process via a shared promise.
 */
export async function ensureSolidAdminExists(): Promise<AdminInitResult> {
  if (!initPromise) {
    initPromise = runAdminInit();
  }
  return initPromise;
}

async function runAdminInit(): Promise<AdminInitResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      exists: false,
      created: false,
      updated: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is not configured",
    };
  }

  try {
    const admin = createAdminClient();

    const { data: profileByUsername } = await admin
      .from("profiles")
      .select("id, email, username, role")
      .eq("username", ADMIN_USERNAME)
      .maybeSingle();

    const { data: profileByEmail } = await admin
      .from("profiles")
      .select("id, email, username, role")
      .eq("email", ADMIN_EMAIL)
      .maybeSingle();

    const existingProfile = profileByEmail ?? profileByUsername;

    if (
      existingProfile &&
      existingProfile.role === "admin" &&
      existingProfile.username === ADMIN_USERNAME &&
      existingProfile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    ) {
      return { exists: true, created: false, updated: false };
    }

    const authUser =
      (existingProfile?.id
        ? { id: existingProfile.id }
        : null) ?? (await findAuthUserByEmail(admin, ADMIN_EMAIL));

    if (authUser) {
      await upsertAdminProfile(admin, authUser.id);
      return { exists: true, created: false, updated: true };
    }

    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!password) {
      return {
        exists: false,
        created: false,
        updated: false,
        error:
          "Admin user missing. Set ADMIN_INITIAL_PASSWORD to auto-create solid.matbaa@gmail.com on startup.",
      };
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Solid Matbaa Admin",
        username: ADMIN_USERNAME,
        locale: "en",
      },
    });

    if (createError || !created.user) {
      return {
        exists: false,
        created: false,
        updated: false,
        error:
          createError?.message ??
          (createError ? JSON.stringify(createError) : "Failed to create admin auth user"),
      };
    }

    await upsertAdminProfile(admin, created.user.id);

    return { exists: true, created: true, updated: false };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null
          ? JSON.stringify(err)
          : "Unknown admin init error";
    console.error("[admin-init]", message);
    return { exists: false, created: false, updated: false, error: message };
  }
}

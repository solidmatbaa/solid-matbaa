import { createClient } from "@/lib/supabase/client";
import { ORDER_DESIGNS_BUCKET } from "@/lib/order-files";

export async function uploadCustomDesignPdfClient(
  file: File
): Promise<
  { ok: true; designFileUrl: string; path: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.tenant_id) {
    return { ok: false, error: "Profile not configured" };
  }

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const objectPath = `${profile.tenant_id}/${user.id}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(ORDER_DESIGNS_BUCKET)
    .upload(objectPath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(ORDER_DESIGNS_BUCKET).getPublicUrl(objectPath);

  return { ok: true, designFileUrl: publicUrl, path: objectPath };
}

export async function removeCustomDesignPdfClient(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(ORDER_DESIGNS_BUCKET).remove([path]);
}

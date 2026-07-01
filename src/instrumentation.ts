export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSolidAdminExists } = await import("@/lib/admin-init");
    ensureSolidAdminExists().then((result) => {
      if (result.error) {
        console.warn("[admin-init]", result.error);
      }
    });
  }
}

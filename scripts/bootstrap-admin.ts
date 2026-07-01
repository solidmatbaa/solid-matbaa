/**
 * One-off admin bootstrap script.
 * Usage: npx tsx scripts/bootstrap-admin.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

async function main() {
  const { ensureSolidAdminExists } = await import("../src/lib/admin-init");
  const { ADMIN_EMAIL, ADMIN_USERNAME } = await import("../src/lib/auth");

  const result = await ensureSolidAdminExists();

  console.log(
    JSON.stringify(
      {
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        exists: result.exists,
        created: result.created,
        updated: result.updated,
        error: result.error ?? null,
      },
      null,
      2
    )
  );

  if (!result.exists) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

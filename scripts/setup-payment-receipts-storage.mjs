/**
 * Creates/updates the payment-receipts Supabase Storage bucket.
 * RLS policies are applied via supabase/migrations/014_payment_receipts_storage.sql
 *
 * Usage: npm run setup:payment-receipts-storage
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

const BUCKET = "payment-receipts";
const MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const exists = buckets?.some((b) => b.id === BUCKET || b.name === BUCKET);
  const options = {
    public: true,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: MIME_TYPES,
  };

  if (exists) {
    const { error } = await admin.storage.updateBucket(BUCKET, options);
    if (error) {
      console.error("Failed to update bucket:", error.message);
      process.exit(1);
    }
    console.log(`Updated bucket "${BUCKET}" (public, mime types: ${MIME_TYPES.join(", ")})`);
  } else {
    const { error } = await admin.storage.createBucket(BUCKET, options);
    if (error) {
      console.error("Failed to create bucket:", error.message);
      process.exit(1);
    }
    console.log(`Created bucket "${BUCKET}" (public, mime types: ${MIME_TYPES.join(", ")})`);
  }

  console.log(
    "Note: Run Supabase migrations (014_payment_receipts_storage.sql) to apply storage RLS policies."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

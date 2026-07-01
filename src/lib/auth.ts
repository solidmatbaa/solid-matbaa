import type { Profile } from "@/types";

export const ADMIN_USERNAME = "solid";
export const ADMIN_EMAIL = "solid.matbaa@gmail.com";

export function isAdmin(
  profile: Pick<Profile, "role"> | null | undefined
): boolean {
  return profile?.role === "admin";
}

/** @deprecated Use isAdmin — kept for imports across the codebase */
export function isSolidAdmin(
  profile: Pick<Profile, "username" | "role"> | null | undefined
): boolean {
  return isAdmin(profile);
}

type AuthLikeError = {
  message?: string;
  code?: string;
  status?: number;
} | null | undefined;

const CODE_MESSAGES: Record<string, string> = {
  email_exists: "A user with this email address has already been registered",
  user_already_exists: "A user with this email address has already been registered",
  weak_password: "Password is too weak. Use at least 6 characters.",
};

export function formatAuthError(error: AuthLikeError, fallback = "Registration failed"): string {
  if (!error) return fallback;

  const message = error.message?.trim();
  if (message && message !== "{}") {
    return message;
  }

  if (error.code && CODE_MESSAGES[error.code]) {
    return CODE_MESSAGES[error.code];
  }

  if (message === "{}") {
    return "Registration failed. This username or email may already be in use.";
  }

  return fallback;
}

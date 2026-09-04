import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps Supabase auth failures onto keys in the `auth` / `errors` catalogs.
 * Returns a `[namespace, key]` pair so the caller translates with its own
 * translator instance.
 */
export function authErrorKey(error: AuthError): [string, string] {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login")) {
    return ["auth", "invalidCredentials"];
  }
  if (code === "email_not_confirmed") return ["auth", "emailNotConfirmed"];
  if (code === "user_already_exists" || code === "email_exists") {
    return ["auth", "emailTaken"];
  }
  if (code === "weak_password") return ["validation", "passwordMin"];
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return ["auth", "rateLimited"];
  }
  if (code === "same_password") return ["auth", "samePassword"];
  if (message.includes("fetch") || message.includes("network")) {
    return ["errors", "network"];
  }
  return ["errors", "generic"];
}

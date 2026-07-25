/**
 * Public origin used for auth email redirects (signup confirm, etc.).
 * Prefer VITE_SITE_URL in production so emails never fall back to localhost.
 */
export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "http://localhost:5173";
}

/** Where Supabase should send users after they confirm their email. */
export function getEmailConfirmRedirectUrl(): string {
  return `${getSiteUrl()}/auth/confirmed`;
}

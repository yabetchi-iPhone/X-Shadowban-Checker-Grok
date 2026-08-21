/**
 * Optional OAuth fallback values (server-only — never import from the client).
 *
 * Production should set GROK_AUTH_CLIENT_ID / GROK_AUTH_CLIENT_SECRET
 * (or disable sign-in with VITE_AUTH_ENABLED=false). These defaults stay empty
 * so a public clone cannot reuse a shared preview credential.
 */
export const PREVIEW_CLIENT_ID = "";
export const PREVIEW_CLIENT_SECRET = "";

/** Default issuer if GROK_AUTH_ISSUER is unset. */
export const GROK_ISSUER_DEFAULT = "https://auth.grok.me";

export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;

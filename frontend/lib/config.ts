/**
 * lib/config.ts
 *
 * Single source of truth for the backend URL.
 * All fetches across the frontend must import BACKEND_URL from here.
 *
 * Environment variable: NEXT_PUBLIC_BACKEND_URL
 * Fallback: production Render URL (safe for Vercel deploys where env may be missing)
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://signverse-backend.onrender.com";

if (!BACKEND_URL) {
  console.error(
    "[config] BACKEND_URL is missing. " +
    "Set NEXT_PUBLIC_BACKEND_URL in .env.local and in Vercel environment variables."
  );
}

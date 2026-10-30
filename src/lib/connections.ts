// Connections (Phase 5) shared helpers. Kept OUT of the route files:
// Next.js route modules may only export HTTP handlers, so a helper
// exported from api/connections/route.ts fails the production build.

// Forgiving site-URL normalization for connection creation/editing:
// "youtube.com" becomes "https://youtube.com/"; anything that does not
// parse as http(s) is rejected (null).
export function normalizeSiteUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

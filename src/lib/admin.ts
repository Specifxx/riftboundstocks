// Hard-coded allowlist rather than a stored User.isAdmin column — this avoids
// a schema migration for what is currently a single-person allowlist, and
// admin status here only controls read-only visibility into account data
// (see app/admin/page.tsx), never a write path. Compared case-insensitively
// since OAuth providers don't guarantee a canonical case for the address.
const ADMIN_EMAILS = ["mastermisclick@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

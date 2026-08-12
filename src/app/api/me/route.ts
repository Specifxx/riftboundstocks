import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Session endpoint for the client-side chrome (NavUser). WHY THIS EXISTS: calling
// getCurrentUser() (which reads cookies()) directly from the root layout or Navbar
// would force EVERY page in the app to render dynamically per-request, killing the
// static generation this site is built around (see DEPLOYMENT.md — the whole pitch
// is a build that pre-renders every card/set/article page). The navbar instead
// renders signed-out HTML on the server (cacheable) and the client fetches the
// real session from here after mount. /login, /signup and /profile are narrow
// utility pages that are fine reading the session directly server-side.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    {
      user: user
        ? {
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

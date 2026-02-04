/**
 * GET /auth/signed-in?next=/dashboard
 * Server-side redirect after login so the same request that has the session
 * cookies is used to redirect to dashboard (avoids client-side redirect
 * before cookies are committed).
 */
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { SessionDebugDisplay } from "@/components/auth/SessionDebugDisplay";
import { Button } from "@/components/ui/button";

function safeNext(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("://")
  ) {
    return "/dashboard";
  }
  return next;
}

export default async function SignedInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; debug?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params?.next);

  // Debug: show session state (cookies, Supabase user, DB user) and link to dashboard
  if (params?.debug === "1") {
    return <SignedInDebugPage next={next} />;
  }

  const user = await getCurrentUser();
  console.log("[SIGNED-IN] getCurrentUser result:", user ? user.id : "null");
  if (user) {
    redirect(next);
  }

  redirect("/auth/signin?error=Session+not+found.+Please+sign+in+again.");
}

async function SignedInDebugPage({ next }: { next: string }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gray-50">
      <h2 className="text-lg font-semibold text-gray-800">Session debug</h2>
      <p className="text-sm text-gray-700">
        {user
          ? "Server saw Supabase user on this request."
          : "No Supabase user — cookies not seen by server."}
      </p>
      <p className="text-xs text-gray-500">
        Session debug (same request cookies):
      </p>
      <SessionDebugDisplay />
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/api/debug/session"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Open /api/debug/session in new tab
        </Link>
        {/* Full-page link so dashboard request gets Cookie header (avoids client-side nav cookie issues) */}
        <Button asChild>
          <a href={next}>Continue to dashboard</a>
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Sign in with ?debug=1 to see this page (e.g. /auth/signin?debug=1).
      </p>
    </div>
  );
}

/**
 * Supabase Server Client
 * For use in Server Components, Server Actions, and Route Handlers
 *
 * This client automatically handles cookie-based session management
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables.",
    );
  }
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Get the current authenticated user from Supabase Auth
 * Returns null if not authenticated.
 * Uses getUser() first (validates JWT with Supabase); if that fails (e.g. serverless
 * timeout), falls back to getSession() so the cookie session still works.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log(
    "[getCurrentUser] getUser result:",
    user ? user.id : "null",
    "error:",
    error?.message || "none",
  );

  if (user) return user;
  if (!error) return null;

  // Fallback: session from cookie (e.g. when getUser() times out in serverless)
  console.log("[getCurrentUser] Trying getSession fallback");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log(
    "[getCurrentUser] getSession result:",
    session?.user?.id || "null",
  );
  return session?.user ?? null;
}

/**
 * Get the current user's session
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

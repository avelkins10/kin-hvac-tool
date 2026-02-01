/**
 * GET /api/debug-auth
 * Temporary: returns Cookie header and path so we can see what the server receives.
 * Open this URL in the same tab (or new tab) after seeing "Taking you to dashboard"
 * to verify cookies are present. Delete this file when done debugging.
 */
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') ?? '(none)'
  const url = new URL(request.url)
  return NextResponse.json({
    path: url.pathname,
    cookieHeader: cookie,
    cookiePresent: cookie !== '(none)',
    timestamp: new Date().toISOString(),
  })
}

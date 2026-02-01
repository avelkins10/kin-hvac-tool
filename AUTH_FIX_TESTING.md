# Auth Cookie Fix - Testing Guide

## Changes Made

### 1. Fixed Login Route (`app/api/auth/login/route.ts`)
**Problem**: Was creating a `NextResponse.json()` object first, then trying to mutate its cookies via Supabase's `setAll` callback. This pattern doesn't work reliably with Next.js App Router.

**Solution**: Use `cookies()` from `next/headers` (the recommended Supabase SSR pattern for App Router). Next.js automatically includes these cookies in the response.

```typescript
// OLD (incorrect):
const jsonResponse = NextResponse.json(...)
const supabase = createServerClient(..., {
  cookies: {
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) =>
        jsonResponse.cookies.set(name, value, { ...options, path: '/' })
      )
    }
  }
})

// NEW (correct):
const cookieStore = await cookies()
const supabase = createServerClient(..., {
  cookies: {
    getAll() { return cookieStore.getAll() },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      )
    }
  }
})
```

### 2. Fixed Middleware (`lib/supabase/middleware.ts` + `middleware.ts`)
**Problem**: `updateSession` and `getMiddlewareUser` were creating SEPARATE Supabase clients. If tokens were refreshed in `updateSession`, the new tokens wouldn't be available to `getMiddlewareUser`.

**Solution**: Combined both operations into a single `updateSession()` function that returns both the response AND the user. This ensures we use the same Supabase client and response for both operations.

```typescript
// OLD (incorrect):
const response = await updateSession(request)
const user = await getMiddlewareUser(request) // Creates NEW client

// NEW (correct):
const { response, user } = await updateSession(request) // Single client
```

### 3. Added Debug Endpoint (`app/api/debug/cookies/route.ts`)
Temporary endpoint to inspect cookies on requests: `GET /api/debug/cookies`

Returns:
- All cookies on the request
- Whether Supabase can read a valid user from those cookies
- Useful for debugging cookie issues

## Testing Steps

### 1. Clear Browser State
```bash
# Open DevTools → Application → Storage → Clear site data
# Or use Incognito/Private window
```

### 2. Start Development Server
```bash
pnpm dev
```

### 3. Monitor Server Logs
Watch for these log messages:
- `[LOGIN] Setting cookies:` - Shows what cookies are being set during login
- `[MIDDLEWARE] Path: /dashboard Cookies: [...]` - Shows what cookies middleware receives
- `[MIDDLEWARE] User: user@example.com` - Shows if user was found

### 4. Test Login Flow

1. **Navigate to** `/auth/signin`

2. **Enter credentials and submit**

3. **Check Network tab** (DevTools → Network):
   - **POST /api/auth/login** → Should return 200
   - Look at Response Headers → Should see `Set-Cookie` headers with names like:
     - `sb-<project>-auth-token`
     - `sb-<project>-auth-token-code-verifier`
   - **GET /dashboard** → Should return 200 (not redirect to /auth/signin)

4. **Check Application tab** (DevTools → Application → Cookies):
   - Should see Supabase cookies stored
   - Check their attributes:
     - `Path`: Should be `/`
     - `SameSite`: Should be `Lax` or `None`
     - `Secure`: Should match your environment (true for HTTPS)
     - `HttpOnly`: Should be `true`

5. **Check server logs**:
   ```
   [LOGIN] Setting cookies: [{ name: 'sb-xxx-auth-token', ... }]
   [MIDDLEWARE] Path: /dashboard Cookies: ['sb-xxx-auth-token', ...]
   [MIDDLEWARE] User: user@example.com Error: none
   ```

### 5. Test Cookie Persistence

1. **After successful login**, navigate to `/api/debug/cookies`
2. **Expected response**:
   ```json
   {
     "cookieCount": 2,
     "cookies": [
       { "name": "sb-xxx-auth-token", ... },
       { "name": "sb-xxx-auth-token-code-verifier", ... }
     ],
     "supabaseAuth": {
       "hasUser": true,
       "userId": "...",
       "email": "user@example.com"
     }
   }
   ```

3. **Refresh the page** - should stay on /dashboard

## Expected Behavior

### ✅ Success
- Login POST returns 200 with Set-Cookie headers
- Browser stores cookies
- Navigation to /dashboard succeeds (no redirect)
- User sees dashboard content
- Subsequent requests include cookies

### ❌ Failure (if still broken)
- Login POST returns 200 but cookies not in Application tab
- GET /dashboard redirects to /auth/signin
- Server logs show `[MIDDLEWARE] Cookies: []` (empty)

## Common Issues & Solutions

### Issue: Cookies not stored by browser
**Symptoms**: Set-Cookie headers present, but Application tab shows no cookies

**Possible causes**:
- `Secure` flag set to `true` but running on `http://localhost`
- `SameSite=None` requires `Secure=true`
- Browser blocking third-party cookies

**Solution**: Check cookie attributes in Set-Cookie headers. For local development, cookies should have:
- `Secure=false` (or omitted) for HTTP
- `SameSite=Lax` is safe for same-site navigation

### Issue: Cookies not sent on /dashboard request
**Symptoms**: Cookies in Application tab, but not in Request Headers for /dashboard

**Possible causes**:
- `Path` mismatch (cookies set for `/api` won't be sent to `/dashboard`)
- `Domain` mismatch
- `SameSite=Strict` blocks navigation

**Solution**: Verify in Application tab that cookie `Path=/`

### Issue: Middleware can't read cookies
**Symptoms**: Cookies sent, but Supabase can't find user

**Possible causes**:
- Cookie names mismatch (login sets `sb-xxx-auth-token`, middleware looks for different name)
- Cookie value corrupted
- Supabase URL/key mismatch between login and middleware

**Solution**: Check server logs to confirm cookie names match

## Vercel Deployment

After testing locally, test on Vercel:

1. **Deploy changes**:
   ```bash
   git add -A
   git commit -m "Fix auth cookie handling"
   git push
   ```

2. **Test on production**:
   - Vercel uses HTTPS, so `Secure=true` cookies will work
   - Check that environment variables are set correctly
   - Test same flow as local

3. **Check Vercel logs**:
   - Go to Vercel dashboard → Project → Deployments → Latest → Functions
   - Look for `[LOGIN]` and `[MIDDLEWARE]` logs

## Cleanup

After confirming the fix works:

1. **Remove debug endpoint**:
   ```bash
   rm app/api/debug/cookies/route.ts
   ```

2. **Remove console.log statements**:
   - `app/api/auth/login/route.ts` line with `console.log('[LOGIN] ...')`
   - `lib/supabase/middleware.ts` lines with `console.log('[MIDDLEWARE] ...')`

3. **Remove this guide**:
   ```bash
   rm AUTH_FIX_TESTING.md
   ```

## Technical Details

### Why the old pattern failed:
1. Next.js App Router has specific requirements for cookie handling
2. Creating a response object and then mutating it doesn't guarantee cookies are included
3. The `cookies()` helper from `next/headers` is the official, supported way to set cookies in App Router route handlers

### Why the new pattern works:
1. `cookies()` is Next.js's official cookie API for App Router
2. Cookies set via `cookieStore.set()` are automatically included in ANY response from the route handler
3. This matches Supabase SSR's recommended pattern for Next.js 13+ App Router

### Middleware fix:
1. Creating separate Supabase clients can lead to inconsistent state
2. Token refresh in one client won't be visible to another client
3. Using a single client ensures consistent session state across the request

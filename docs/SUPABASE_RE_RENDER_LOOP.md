# Why "Too Many Re-renders" After Switching to Supabase

The builder worked with Neon and started hitting a React "Too many re-renders" loop after switching to Supabase. The behavior comes from **timing and data-loading**, not from Supabase being wrong.

## What’s different with Supabase

1. **Data loading timing**
   - **Neon**: Often very fast. By the time the client hydrates and the builder mounts, `PriceBookProvider`’s `loadPriceBook()` has usually finished. The assessment sees final data on first render, so “sync from context” effects run once.
   - **Supabase**: Same Prisma + API code, but latency can differ (region, connection pool, cold starts). `loadPriceBook()` can still be in flight when the assessment first mounts. The assessment then runs with **default/placeholder** `priceBook`, effects run and call `setState`, then real data arrives → context updates → re-render → effects run again. That cascade can push React over its re-render limit.

2. **React 18 / Strict Mode**
   - In dev, Strict Mode double-invokes effects. So `loadPriceBook()` runs twice → more `setPriceBook` / `setLoading` updates. With Neon you may have been on an older stack or different Strict Mode behavior, so you saw fewer updates. With Supabase + current Next/React, the extra updates add to the cascade above.

3. **Auth path**
   - With Neon you may have used NextAuth (session in DB). With Supabase you use Supabase Auth + `requireAuth()` (Prisma for user row). The page still renders once on the server; the loop is from **client-side** context/effect timing, not from auth causing double server render.

## Fixes applied

- **Deferred mount**: Don’t render `InteractiveHouseAssessment` until after the first paint (`mounted` state set in `useEffect`). Avoids a synchronous loop on first paint.
- **Stable callbacks**: `handleProposalIdChange` only updates parent state when the id actually changes; all builder callbacks are `useCallback` with stable deps.
- **Memo**: `InteractiveHouseAssessment` wrapped in `React.memo` so it doesn’t re-render when parent re-renders with the same props.
- **Sync only when loaded**: Assessment “sync from context” effects (add-ons, default financing) only run when `priceBookLoading === false`, so they run once with final data instead of once with defaults and again with real data.

## If it still happens

- Ensure `priceBookLoading` is used in the assessment’s sync effects so they don’t run on default data.
- In dev, try temporarily disabling Strict Mode in `next.config.mjs` to see if the loop goes away (confirms effect double-run is involved).
- Add a short `console.log` at the top of `App` and of `InteractiveHouseAssessmentInner` to see how often each renders and what triggers the cascade.

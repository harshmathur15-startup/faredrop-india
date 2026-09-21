# Security hardening — status & checklist

Living checklist for travelbaby.in (faredrop-india). Keep it updated as items land.

## ✅ Done (branch `security/hardening` + live DB)
- **RLS lockdown** — every public table default-denied to the anon key; only `deals`
  (public read) and `user_preferences` (own-row) allow-listed.
  Migration: `supabase/migrations/20260920120000_enable_rls_lockdown.sql`. **Applied to prod.**
- **Service-role isolation** — `src/lib/supabase-admin.ts` (server-only guard); `supabase.ts`
  is anon-only. Prevents the service key from ever reaching the browser.
- **Rate limiting** — per-IP on `signup`, `waitlist`, `request-deal`, `events`; per-user on
  `payments/create-order`, `subscriptions/create`.
- **Security headers** — HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy,
  Permissions-Policy, COOP (allow-popups for Google sign-in). See `next.config.ts`.
- **CSP** — shipped Report-Only (Razorpay/GA/Supabase/Google/image-CDN allowlist).

## 🔜 Your queue (dashboards — can't be done from code)
- [ ] **Vercel env vars (prod):** confirm `ADMIN_SECRET`, `CRON_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
      `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_*`, `RESEND_API_KEY`, `FLIGHTAPI_KEY` all set.
- [ ] **Vercel Deployment Protection:** password/SSO-protect Preview deployments.
- [ ] **Supabase Auth:** tighten OTP/email rate limits; lock redirect-URL allowlist to real
      domains; enable leaked-password protection (if password login is used).
- [ ] **Supabase backups / PITR:** confirm automated backups are on.
- [ ] **GitHub:** enable secret scanning + push protection + Dependabot alerts/security updates.
      (Dependabot config added: `.github/dependabot.yml`.)
- [ ] **Error monitoring:** add Sentry; alert on 401/429/500 spikes.
- [ ] **Rotate secrets** that were shared during dev (flightapi, Resend, service role, Razorpay).
- [ ] **CSP:** after a clean Report-Only run in prod, flip header key
      `Content-Security-Policy-Report-Only` → `Content-Security-Policy`.
- [ ] **Rotate `NEXT_PUBLIC_PEXELS_API_KEY`** (ships to browser) or proxy it.

## 🐞 Dependency findings (from `npm audit`, 2026-09-20)
- **sharp** (high) — libvips/libheif CVEs via Next image optimizer. Fix: bump Next to latest 16.x.
- **xlsx / SheetJS** (high/critical) — prototype pollution + ReDoS; no npm fix. Only used in
  admin/scripts tooling (admin-gated). Mitigate by upgrading to the SheetJS CDN build or avoiding
  parsing untrusted spreadsheets. Track upstream.

## Post-deploy smoke test (2 min)
Homepage loads → a deal page loads → Google sign-in works → one test checkout completes.

## Reference
- RLS diagnostic: `select tablename, rowsecurity from pg_tables where schemaname='public';`
- Supabase project: `ltogjuhutfsbzjhpxxux`

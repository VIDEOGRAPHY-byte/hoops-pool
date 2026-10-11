# Security remediation — 10 October 2026

This branch is a review candidate, not a deployment. No live Supabase changes or credential rotations were performed.

## Deployment blockers and order

1. Arrange a trusted organizer-assisted recovery process for existing participants **before rollout**. Legacy unsigned cookies cannot safely identify an account. Previously signed cookies also lack expiry and purpose, so this release deliberately rejects them. Existing display names remain reserved to prevent takeover; do not reset someone based only on knowledge of a name or shared pool passcode. Recovery must verify the person through an independent trusted channel. A durable re-authentication/recovery feature remains required for general use, including when a 30-day session expires. This audit does not create credentials or perform account resets.
2. Review `supabase/migrations/20261010_security.sql` against a backup and a disposable copy of the actual database. Custom grants/policies and concurrency must be checked against that database. Approve and apply the migration separately, together with the app update; old app versions need anonymous reads and the new app requires the `save_pool_pick` RPC. Do not roll back to the permissive policies.
3. Verify existing `SESSION_SECRET` and `ADMIN_SECRET` values have at least 32 random characters, plus a nonempty `CRON_SECRET`. Missing/short secrets fail closed in all modes. Generate or rotate credentials only with separate approval. Participant cookies are Secure in production. Admin cookies carry expiring HMAC tokens rather than the admin secret itself.
4. Confirm hosting preview behavior before pushing this branch. GitHub deployment history shows Vercel; a branch push may publish a preview. No merge/deploy is authorized by this file.

## Fixed boundaries

Signed, shape-checked, purpose-bound, expiring sessions; current participant/pool membership checked on every session read. No unsigned fallback. Cookie admin mutations require exact Origin; explicit API admin credentials remain supported. Cron routes require configured secrets. Private pool/passcode/participant/pick tables lose anonymous/authenticated access, and public reference tables lose writes. Server-side private reads are scoped to the authenticated pool. Atomic pick saves lock/check pool, participant and series, deny completed/locked series and locked picks, and validate selected team and games. The security RPC is callable only by service_role. Odds use the latest snapshot per team.

## Remaining limits

Pool codes and admin login lack a durable distributed rate limiter. Configure an approved hosting/database-backed limit before opening this prototype to untrusted traffic; an in-memory limiter would not protect independent serverless workers. Passcodes remain stored in plaintext in the private database and can be read by trusted service-role code. Membership can be revoked by removing the participant; there is no self-service session revocation/recovery UI. Admin actions currently operate across pools. Live RLS/grants, backups, deployed secrets, host protections and provider behavior were not inspected or changed. Local PostgreSQL tests use PGlite and replace uuid-ossp's generator with PostgreSQL's built-in equivalent; this is not a hosted Supabase integration test.

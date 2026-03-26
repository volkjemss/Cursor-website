# SUPA SERVICE Trial API

Minimal backend for trial onboarding:

- checks email eligibility with UserCheck
- sends OTP via Resend
- verifies OTP
- creates 24h trial credentials
- blocks multiple trials per email/device

## Run

Set env variables, then:

- `node trial-api/server.mjs`

Default port: `8787`.

## Required env vars (production)

- `USERCHECK_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `TRIAL_XTREAM_SERVER`
- `APP_JWT_SECRET`

Optional:

- `PORT` (default `8787`)
- `TRIAL_DURATION_HOURS` (default `24`)

## Integrate your real provisioning API

In `server.mjs`, replace the placeholder in `buildTrialCredentials()` with your own API call that creates real Xtream trial accounts.

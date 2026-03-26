# SUPA SERVICE IPTV App (React + Capacitor)

IPTV Android app with:
- direct Xtream login
- free-trial flow (email -> OTP -> 24h trial credentials)
- local offer notifications during trial

## Key features

- **Branding**: app renamed to `SUPA SERVICE`
- **HTTP IPTV URLs supported on Android** (`usesCleartextTraffic=true`)
- **Existing account login** (server URL, username, password)
- **Free trial flow**
  - user enters email
  - backend validates email through UserCheck API
  - backend sends OTP through Resend
  - user verifies OTP
  - backend creates 24h Xtream trial credentials
- **One trial limit** per email and per device (enforced by backend)
- **Offer notifications** scheduled during active trial

## Environment variables

Copy `.env.example` to `.env`:

- `VITE_TRIAL_API_BASE_URL=http://localhost:8787` (or your hosted trial API)

## Local development

1. Install dependencies:
   - `npm install`
2. (optional) Start demo Xtream API:
   - `npm run mock:xtream`
3. Start trial backend:
   - `npm run trial:api`
4. Start app:
   - `npm run dev`

## Trial backend (`trial-api/server.mjs`)

Endpoints:
- `POST /api/trial/status`
- `POST /api/trial/request-otp`
- `POST /api/trial/verify-otp`
- `POST /api/trial/create`

Required env vars for production:
- `USERCHECK_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `TRIAL_XTREAM_SERVER`
- `TRIAL_DURATION_HOURS` (default `24`)
- `APP_JWT_SECRET`

Notes:
- without `USERCHECK_API_KEY`, email check uses dev fallback (allow)
- without `RESEND_API_KEY` + `RESEND_FROM`, OTP logs to server console (dev fallback)
- replace `buildTrialCredentials()` with your real credential provisioning API call

## Android APK workflow

1. Build web and sync:
   - `npm run apk:build`
2. Build debug APK:
   - `cd android && ./gradlew assembleDebug`
3. APK output:
   - `android/app/build/outputs/apk/debug/app-debug.apk`

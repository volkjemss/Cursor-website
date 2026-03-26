# Xtream IPTV App (React + Capacitor)

Simple IPTV app that connects to Xtream Codes compatible providers, loads live categories/channels, and plays streams in-app.

## Features

- Login with Xtream server URL + username + password
- Fetch live categories (`get_live_categories`)
- Fetch channels by category (`get_live_streams`)
- In-app channel playback (HLS.js fallback + native video support)
- Android packaging support with Capacitor

## Run locally

1. Install dependencies:
   - `npm install`
2. Start development server:
   - `npm run dev`
3. Open URL shown by Vite (usually `http://localhost:5173`).

### Optional mock Xtream server (for testing)

If you do not have provider credentials yet, run:

- `node scripts/mock-xtream-server.mjs`

Then log in from the app with:

- Server URL: `http://localhost:8090`
- Username: `demo`
- Password: `demo`

## Build web app

- `npm run build`
- `npm run preview`
- Optional mock API for local testing:
  - `npm run mock:xtream`
  - Login with `http://localhost:8090`, username `demo`, password `demo`

## Android APK workflow

The project already includes `capacitor.config.ts`.

1. Build and sync web assets:
   - `npm run apk:build`
2. If this is the first Android setup:
   - `npm run cap:add:android`
3. Open Android Studio project:
   - `npm run android:open`
4. In Android Studio:
   - `Build > Build Bundle(s) / APK(s) > Build APK(s)`

## Notes

- Some Xtream providers use non-HLS transport streams (`.ts`) that may not play in all browsers. The APK build is generally more reliable on real devices.
- Credentials are saved in local storage for convenience.

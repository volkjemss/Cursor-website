# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Danke TV** landing page with a Node.js/Express backend handling a signup flow: email validation (UserCheck), OTP verification (Resend), and account creation (DRM Cloud API).

### Running the dev server

```sh
npm install
node server.js
```

Server starts on `http://localhost:3000/` (serves static files + API routes).

### Required secrets (environment variables)

| Variable | Purpose |
|----------|---------|
| `DRM_API_KEY` | DRM Cloud API for account creation |
| `RESEND_API_KEY` | Resend for sending OTP and credential emails |
| `USERCHECK_API_KEY` | UserCheck for disposable email detection |
| `FROM_EMAIL` | (Optional) Sender email; defaults to `onboarding@resend.dev` |

### Lint / Test / Build

- No linter or test framework is configured.
- No build step; `server.js` runs directly with Node.js ESM.

### Notes

- **Resend test-mode limitation**: `onboarding@resend.dev` can only send to the Resend account owner's email. For production, verify a domain at `resend.com/domains` and set `FROM_EMAIL`.
- **DRM API**: Called at `http://api.drm-cloud.com/dev_api.php` with `package_id=101`, `template_id=1`, `country=all`, and `note=<user email>`.
- Frontend is vanilla HTML/CSS/JS in `index.html` and `styles.css`. The signup modal and flow logic are in a `<script>` block at the bottom of `index.html`.

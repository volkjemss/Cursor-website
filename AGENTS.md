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
- **Checkout URLs**: Plan buttons link to `https://instant-ai-text.com/checkout?plan={plan}_{variant}` where variant is `basic`, `protectplus`, `vision`, or `combo`.

### SEO Automation

Run `npm run seo-audit` after any content changes. The script checks all HTML files for:
- Title tag presence and length (30-70 chars)
- Meta description presence and length (100-160 chars)
- Canonical URL, Open Graph tags, structured data (JSON-LD)
- Exactly one `<h1>` per page
- Sitemap inclusion, image alt attributes

**Automated SEO checklist for future agents:**
1. Run `npm run seo-audit` — fix any reported issues
2. If adding new pages, add them to `sitemap.xml` with correct `<lastmod>` date
3. Every new page needs: `<title>`, meta description, canonical URL, OG tags, JSON-LD schema, and exactly one `<h1>`
4. Blog articles should target specific long-tail keywords (check `<meta name="keywords">`)
5. Update `priceValidUntil` in the Product schema when the year changes
6. Keep structured data in sync with actual plan prices if they change

**Blog articles** are in `/blog/` and target high-value IPTV search queries:
- `setup-iptv-smart-tv.html` — "how to setup IPTV" (setup guide)
- `best-iptv-football-2026.html` — "best IPTV football" (sports keyword)
- `iptv-vs-cable.html` — "IPTV vs cable TV" (comparison keyword)

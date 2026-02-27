# Website Analysis: supa-services.com

**Date:** February 27, 2026  
**Status:** Live (HTTP 200)  
**URL:** https://supa-services.com

---

## 1. Overview

**Supa Services** is a premium IPTV streaming service website that markets itself as offering 25,000+ live TV channels, 145,000+ movies, and 44,000+ TV series, with HD/4K quality streaming across 100+ countries. The site also has a secondary section selling premium streaming accounts (Netflix, Spotify, Disney+, etc.) at discounted prices.

### Business Model
- **Primary:** IPTV subscription service (annual access, one-time payment ~€39-45/year)
- **Secondary:** Reselling premium streaming service accounts (Netflix, Spotify, Disney+, HBO Max, Amazon Prime Video, YouTube Premium)
- Contact via WhatsApp (+44 7446 431335, UK number)
- Email: contact@supa-services.com

### Key Claims
| Metric | Claimed Value |
|--------|--------------|
| Live Channels | 25,000+ |
| Movies | 145,000+ |
| TV Series | 44,000+ |
| Countries | 100+ |
| Quality | HD / 4K Ultra HD |
| Support | 24/7 via WhatsApp |
| Free Trial | 24-hour trial available |
| Money-back | 30-day guarantee |

---

## 2. Technology Stack

### Frontend
| Technology | Details |
|-----------|---------|
| **Framework** | React 18.3.1 (Single Page Application) |
| **Build Tool** | Vite (hashed assets: `index-3GnZKp-L.js`) |
| **CSS Framework** | Tailwind CSS (utility-first, all classes present in CSS) |
| **UI Components** | shadcn/ui (Radix UI primitives: Switch, Tabs, Dialog, etc.) |
| **Charting** | Recharts (data visualization library) |
| **i18n** | i18next + i18next-browser-languagedetector (multilingual) |
| **SEO** | React Helmet (dynamic meta tags) |
| **Carousel** | Embla Carousel with auto-scroll plugin |
| **Routing** | Client-side SPA routing |
| **Icons** | Lucide React icons |

### Backend & Services
| Service | Details |
|---------|---------|
| **Backend/Database** | Supabase (hosted at `uevlsbuldauxgyyqqajc.supabase.co`) |
| **Auth** | Supabase Auth (GoTrue) with email verification |
| **CDN/Proxy** | Cloudflare (cf-ray headers, managed DNS) |
| **Hosting** | Static site deployed behind Cloudflare CDN |
| **Email Service** | Spacemail (MX records: mx1/mx2.spacemail.com) |
| **Email Marketing** | Brevo (formerly Sendinblue, verified via TXT record) |
| **Analytics** | Facebook Pixel (fbq tracking: PageView + custom events) |
| **Geolocation** | ipapi.co (IP-based country detection via `https://ipapi.co/json/`) |
| **Movie Posters** | TMDB API (The Movie Database image CDN) |

### DNS Configuration
| Record | Value |
|--------|-------|
| A Records | `172.67.216.207`, `104.21.24.46` (Cloudflare IPs) |
| Nameservers | `sreeni.ns.cloudflare.com`, `sterling.ns.cloudflare.com` |
| MX Records | `mx1.spacemail.com`, `mx2.spacemail.com` |
| SPF | `v=spf1 include:spf.spacemail.com ~all` |
| Brevo | `brevo-code:5c99fd47b8163465334301f99aba812c` |

### SSL Certificate
| Property | Value |
|----------|-------|
| Issuer | Google Trust Services (WE1) |
| Subject | supa-services.com |
| Valid From | January 12, 2026 |
| Valid Until | April 12, 2026 |
| Algorithm | ECDSA with SHA-256, P-256 curve |
| Key Size | 256 bit |

---

## 3. Content & Features

### Main Website Sections (from sitemap)
1. **Homepage** (`/`) - Hero, features, showcase, testimonials, pricing
2. **Pricing** (`/pricing`) - Subscription plans with device options
3. **Blog** (`/blog`) - SEO content in German, French, and English
4. **Tutorials** (`/tutorials`) - IPTV setup guides
5. **Privacy Policy** (`/privacy`)
6. **Terms of Service** (`/terms`)

### Multilingual Support
The site supports **9 languages** with full translations:
- **English** (en) - Primary
- **French** (fr)
- **German** (de)
- **Spanish** (es)
- **Italian** (it)
- **Russian** (ru)
- **Arabic** (ar) - RTL support
- **Chinese** (zh)
- **Dutch** (nl, detected from locale handling)

### Blog Content Strategy (SEO)
The site has **32 blog articles** organized by language:
- **12 German articles** - IPTV-focused (cost, legality, providers, channels, VPN, etc.)
- **12 French articles** - IPTV-focused (boxes, free channels, subscriptions, legality, etc.)
- **8 English articles** - IPTV guides (where to buy, best service, legality, setup, VPN, etc.)

### IPTV App Setup Guides
Detailed installation instructions for multiple IPTV players:
- IBO Player (recommended)
- IPTV Smarters Pro
- TiviMate
- Perfect Player
- Smart IPTV
- SS IPTV
- Shamel TV
- 9Xtream

Supports Xtream Codes API and M3U playlist methods.

### Featured Content (Movie/Series Showcase)
Uses TMDB posters to showcase popular titles:
- **Movies:** The Shawshank Redemption, The Godfather, The Dark Knight, LOTR, Schindler's List, Pulp Fiction, Inception, Interstellar, Fight Club, Forrest Gump
- **Series:** Breaking Bad, Game of Thrones, The Sopranos, The Wire, Stranger Things, Chernobyl, The Office, House of Cards, Peaky Blinders, The Crown

### Pricing Model
- Annual access with one-time payment
- Base price appears to be ~€45 for 1 device
- Upsells: Shield+ Proxy (bypass ISP blocks, +€12), 4K Ultra HD (+€20)
- Multi-device pricing tiers available
- Promo code system for 10% discounts
- Free 24-hour trial with email verification

### Trial System
- Email-based verification with 6-digit OTP code
- Blocks disposable/temporary email addresses
- One trial per user (tracks usage)
- Provides Xtream Codes credentials (username, password, server URLs)
- Also provides M3U playlist link
- Powered by Supabase backend

---

## 4. Performance Analysis

### Page Load Metrics
| Metric | Value |
|--------|-------|
| HTML Size | 1,850 bytes (minimal shell for SPA) |
| JS Bundle Size | ~1.19 MB (uncompressed) |
| CSS Bundle Size | ~114.7 KB (uncompressed) |
| Total Initial Assets | ~1.31 MB (uncompressed) |
| Time to First Byte (TTFB) | ~46ms (excellent, Cloudflare CDN) |
| DNS Lookup | ~1.5ms |
| TCP Connect | ~1.9ms |
| Cloudflare Cache | HIT |

### Performance Observations
- **SPA Architecture:** Single-page app means the initial HTML is a near-empty shell (`<div id="root">`). All content is rendered client-side via JavaScript, which negatively impacts:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Search engine crawlability (content is JS-rendered)
- **Large JS Bundle:** ~1.19 MB uncompressed is significant. The bundle includes React, React DOM, Supabase client, i18next, all translations, Radix UI components, Recharts, and application code in a single file.
- **No Code Splitting:** All JS is in one monolithic bundle (`index-3GnZKp-L.js`), no lazy loading or route-based splitting observed.
- **Cloudflare CDN:** Fast delivery with cache hits, HTTP/2 support.
- **No Prerendering/SSR:** The site does not use SSR or static site generation, relying entirely on client-side rendering.

---

## 5. SEO Analysis

### Strengths
- Comprehensive meta tags (title, description, keywords, OpenGraph, Twitter Card)
- Canonical URL defined (`https://www.supa-services.com`)
- XML Sitemap with all pages and blog articles
- robots.txt properly configured
- Blog articles targeting German, French, and English keywords
- Descriptive page titles and meta descriptions
- Semantic URL structures for blog posts

### Weaknesses
- **Client-Side Rendering (CSR):** Content is entirely JavaScript-rendered, which means search engine crawlers may not index the full page content. This is the single biggest SEO issue.
- **Canonical URL Mismatch:** The canonical URL uses `www.supa-services.com` but the site is served from `supa-services.com` (without www). This could cause canonicalization confusion.
- **Sitemap References Wrong Domain:** The robots.txt references a sitemap at `https://strongerplayer.com/sitemap.xml` instead of the current domain, suggesting the site was previously branded as "Stronger Player" or is a rebrand/clone.
- **Copyright Footer Inconsistency:** The footer copyright reads "Stronger Streaming Player" rather than "Supa Services", confirming the rebrand/template reuse.
- **No Structured Data (JSON-LD):** No schema.org markup for FAQ, Product, Organization, or BreadcrumbList detected.
- **AI Training Blocked:** robots.txt blocks AI crawlers (ClaudeBot, GPTBot, Google-Extended, etc.)

---

## 6. Security Assessment

### Positive
- HTTPS enforced with valid SSL certificate (Google Trust Services)
- Cloudflare proxy hides origin server IP
- ECDSA P-256 SSL certificate (modern, efficient)
- SPF record configured for email authentication

### Concerns
- **Supabase URL Exposed:** The Supabase project URL (`uevlsbuldauxgyyqqajc.supabase.co`) is visible in the client-side JavaScript bundle. While the anon key is expected to be public, it exposes the backend infrastructure.
- **Facebook Pixel Tracking:** User behavior tracked via Facebook Pixel (PageView and custom event tracking).
- **IP Geolocation:** Uses ipapi.co to detect user's country, which may raise privacy concerns.
- **Localhost Reference:** `http://localhost:9999` found in the JS bundle, suggesting development artifacts left in production code.
- **SSL Certificate Short-Lived:** Certificate expires April 12, 2026 (90-day auto-renewal typical of Cloudflare/Let's Encrypt).

---

## 7. Brand & Identity Analysis

### Branding Issues
The website shows signs of being a rebrand or white-label template:
- **Current Brand:** "Supa Services"
- **Previous/Alternate Brand:** "Stronger Player" / "Stronger Streaming Player"
  - Footer copyright references "Stronger Streaming Player"
  - Sitemap in robots.txt points to `strongerplayer.com`
  - Blog articles reference "Stronger Player" pricing
- The English translations embed "Supa Services" branding, but some content still references the older brand name.

### Design
- Dark-themed UI with purple/pink gradient accents
- Custom CSS variables for theming (primary: purple `262 83% 58%`, secondary: pink `280 87% 65%`)
- Responsive design with mobile, tablet, and desktop breakpoints
- Modern component library (shadcn/ui) for consistent UI elements
- Movie poster carousel for visual engagement
- Country-based channel showcase

---

## 8. Legal & Compliance Observations

- Privacy Policy and Terms of Service pages exist in the sitemap
- GDPR-relevant: Uses cookies (i18next language storage), Facebook Pixel, IP geolocation
- No visible cookie consent banner mechanism detected in the code
- The service appears to operate in a legal grey area:
  - IPTV services offering access to premium TV channels (beIN Sports, RMC Sport, Eurosport, Canal+) at very low prices typically involve unauthorized redistribution
  - The blog articles discuss IPTV legality, suggesting awareness of legal concerns
  - The "Shield+ Proxy" upsell to "bypass ISP blocks" suggests the service may be blocked by ISPs in some jurisdictions

---

## 9. Summary & Key Findings

| Category | Rating | Notes |
|----------|--------|-------|
| **Technology** | Good | Modern React + Tailwind + Supabase stack |
| **Performance** | Needs Work | Large monolithic JS bundle, no SSR/SSG, no code splitting |
| **SEO** | Poor | CSR-only kills crawlability; canonical/sitemap inconsistencies |
| **Security** | Fair | HTTPS + Cloudflare, but dev artifacts and exposed backend URLs |
| **Branding** | Poor | Inconsistent branding between "Supa Services" and "Stronger Player" |
| **i18n** | Excellent | 9 languages with comprehensive translations |
| **UX/Design** | Good | Modern, dark-themed, responsive with polished UI components |
| **Legal** | Questionable | IPTV service with premium channel access at unusually low prices |

### Recommendations
1. **Implement SSR/SSG** (e.g., Next.js or Astro) for SEO and performance
2. **Code split** the JS bundle using dynamic imports and route-based lazy loading
3. **Fix branding inconsistencies** - remove all "Stronger Player" references
4. **Fix canonical URL** to match the actual serving domain
5. **Fix sitemap reference** in robots.txt to point to supa-services.com
6. **Add structured data** (JSON-LD) for better search engine understanding
7. **Remove localhost reference** from production bundle
8. **Add cookie consent** mechanism for GDPR compliance
9. **Implement image optimization** (WebP/AVIF, lazy loading for TMDB images)
10. **Add DMARC record** for email security alongside existing SPF

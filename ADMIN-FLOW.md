# Bhavna Space — Admin Authentication & Email Dispatch Flow

This document details the complete end-to-end architecture, cryptographic security model, and implementation workflows for:
1. **Two-Factor Admin Authentication (Email + Password + 2FA OTP)**
2. **Branded Rich Text Email Authoring & Resend API Dispatch**

---

## Architecture Overview

```mermaid
graph TD
    subgraph Client ["Browser (Client-Side)"]
        UI_Login["/:ddmmyyyy/login (Dynamic Credentials & 2FA Form)"]
        UI_Console["/:ddmmyyyy/ (Send Emails Console & Rich Editor)"]
        HTML_Conv["email-html-converter.ts (HTML Normalizer)"]
    end

    subgraph Server ["Server Runtime (Worker / Dev Middleware)"]
        DateValidator["src/server/admin-path.ts (Rolling ddmmyyyy Validator)"]
        AuthUtils["src/server/auth.ts (Web Crypto HMAC-SHA256)"]
        AdminAPI["src/server/admin-api.ts (API Router)"]
        WorkerRouter["src/worker.ts / dev-api-plugin.mjs"]
    end

    subgraph External ["External Services"]
        Resend["Resend REST API (api.resend.com)"]
        Recipient["Recipient Mailbox (Client / Partner)"]
    end

    UI_Login -->|1. Submit email + password| AdminAPI
    AdminAPI -->|2. Generate 6-digit OTP & sign challenge| AuthUtils
    AdminAPI -->|3. Send OTP email via Resend| Resend
    Resend -->|4. Deliver OTP to Admin inbox| Recipient

    UI_Login -->|5. Submit 6-digit OTP + challengeToken| AdminAPI
    AdminAPI -->|6. Verify HMAC signature & OTP hash| AuthUtils
    AdminAPI -->|7. Set-Cookie: bhavna_admin_session (HttpOnly; SameSite=Lax)| UI_Login

    UI_Login -->|8. Redirect to /:ddmmyyyy/ (Browser sends HttpOnly cookie)| UI_Console
    UI_Console -->|9. Rich Text authored -> convert to inline HTML| HTML_Conv
    UI_Console -->|10. POST /api/admin/send-email (Automatic Session Cookie)| AdminAPI
    AdminAPI -->|11. Authenticate token & dispatch payload| Resend
    Resend -->|12. Deliver branded email with Email ID| Recipient
```

---

## Dynamic Rolling Date Route (`domain/ddmmyyyy/login`)

To maximize stealth and eliminate bot scanning of standard `/admin` administrative endpoints, the admin portal uses **dynamic daily rolling date routes**:

* **Public Format:** `domain/{ddmmyyyy}/login` and `domain/{ddmmyyyy}/` (e.g., `bhavnaspace.com/13102026/login` and `bhavnaspace.com/13102026/` for October 13, 2026).
* **Direct `/admin` Probes Blocked:** Any direct request to `/admin` or `/admin/*` is immediately blocked and returned as `404 Not Found`.
* **Zero-Rebuild Edge Routing:**
  - Cloudflare Worker ([`src/worker.ts`](file:///var/www/cml-projects/bhavnaspace/src/worker.ts)) and Vite dev middleware ([`dev-api-plugin.mjs`](file:///var/www/cml-projects/bhavnaspace/dev-api-plugin.mjs)) validate the incoming `\d{8}` date string via [`isValidAdminDateSlug()`](file:///var/www/cml-projects/bhavnaspace/src/server/admin-path.ts).
  - Validation checks against the current date in Indian Standard Time (IST, UTC+5:30) and UTC, with an automated 2-hour midnight grace tolerance window so admins are never cut off during date rollovers.
  - An optional `ADMIN_ROUTE_OVERRIDE` environment variable can be set if a custom fixed slug is required.
  - If valid, the edge server internally maps the request to the compiled admin assets without altering the browser address bar. If invalid, it returns `404 Not Found`.

---

## 1. Authentication Flow (Step-by-Step)

### Step 1.1: Credentials Submission
* **File:** [`src/pages/admin/login.astro`](file:///var/www/cml-projects/bhavnaspace/src/pages/admin/login.astro)
* **Endpoint:** `POST /api/admin/login`
* **Request Payload:** `{ email: string, password: string }`

1. The administrator inputs their email and password.
2. The server compares the submitted email against the dynamic `ADMIN_EMAIL` environment variable (`ADMIN_EMAIL` can contain one or more comma-separated addresses).
3. The password is verified against `ADMIN_PASSWORD`.

### Step 1.2: OTP Generation & Challenge Token (Stateless Security)
* **File:** [`src/server/admin-api.ts`](file:///var/www/cml-projects/bhavnaspace/src/server/admin-api.ts) & [`src/server/auth.ts`](file:///var/www/cml-projects/bhavnaspace/src/server/auth.ts)

To eliminate the need for an external database or KV store across edge instances, the system uses a **stateless HMAC challenge**:
1. A cryptographically random 6-digit OTP is generated (`100000`–`999999`) using `crypto.getRandomValues`.
2. An expiry timestamp is set for 10 minutes (`exp = Date.now() + 10 * 60 * 1000`).
3. An OTP hash is generated: `otpHash = sha256Hex(otp + ADMIN_SESSION_SECRET)`.
4. A signed **challenge token** is created via HMAC-SHA256 containing `{ email, otpHash, exp }`.
5. An email is dispatched via Resend to the admin email with the 6-digit code framed inside the luxury Bhavna Space verification template.
6. The server returns `{ ok: true, step: 'otp', email, challengeToken }` to the client.

### Step 1.3: 2FA Verification & HttpOnly Session Issuance (XSS Prevention)
* **Endpoint:** `POST /api/admin/verify-otp`
* **Request Payload:** `{ email: string, otp: string, challengeToken: string }`

1. The client displays 6 auto-advancing input fields with a 10-minute live countdown timer.
2. When submitted, the server:
   - Verifies the HMAC-SHA256 signature of `challengeToken` using `ADMIN_SESSION_SECRET`.
   - Checks that `Date.now() <= exp` (rejects expired codes).
   - Verifies that the submitted email matches the token email.
   - Computes `sha256Hex(submittedOtp + ADMIN_SESSION_SECRET)` and verifies it against `otpHash`.
3. If valid, the server creates a **24-hour signed session token**:
   ```typescript
   sessionToken = signToken({ email, role: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 }, secret);
   ```
4. **HttpOnly Cookie Issuance:**
   The server attaches a secure `Set-Cookie` header to the response:
   ```http
   Set-Cookie: bhavna_admin_session=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure
   ```
   > [!IMPORTANT]
   > **XSS Defense:** The token is marked `HttpOnly`, which strictly prohibits client-side JavaScript (`document.cookie` or `localStorage`) from reading or extracting it. Even in the event of an XSS vulnerability, malicious scripts cannot steal the administrative session token.

### Step 1.4: Client-Side Auth Guard
* **File:** [`src/layouts/AdminLayout.astro`](file:///var/www/cml-projects/bhavnaspace/src/layouts/AdminLayout.astro)

1. Client storage (`localStorage`) is purged of all sensitive session tokens.
2. When any `/admin/*` route is loaded:
   - A background verification call is dispatched: `GET /api/admin/me` with `credentials: 'same-origin'`.
   - The browser automatically attaches the `HttpOnly` cookie.
   - If the server responds with `200 OK`, access is granted.
   - If the server responds with `401 Unauthorized`, the client redirects to `/admin/login?reason=unauthenticated`.
   - When the user signs out (`POST /api/admin/logout`), the server issues an expired cookie (`Max-Age=0`), terminating the session.

---

## 2. Email Authoring & Dispatch Flow (Step-by-Step)

### Step 2.1: Authoring in the Admin Console
* **File:** [`src/pages/admin/index.astro`](file:///var/www/cml-projects/bhavnaspace/src/pages/admin/index.astro)

1. **Recipients (`to`):**
   - Completely dynamic input supporting single or multiple comma-separated emails.
   - Quick-insert pills dynamically insert the active administrator email or studio contact.
2. **Subject:**
   - Text input with client-side validation.
3. **Preset Starters:**
   - Buttons to quickly inject pre-authored studio copy (*Design Proposal*, *Consultation Follow-Up*, *Material Palette*, or *Clear Blank*).
4. **Rich Text Formatting Toolbar:**
   - Headings (`H2`, `H3`), Paragraphs (`P`).
   - Inline formatting: Bold, Italic, Underline, Strikethrough.
   - Structural: Bullet lists, Numbered lists, Editorial Blockquotes with terracotta accents, and Horizontal divider lines.
   - Hyperlink insertion (`createLink`).

### Step 2.2: HTML Normalization & Email Client Sanitization
* **File:** [`src/scripts/email-html-converter.ts`](file:///var/www/cml-projects/bhavnaspace/src/scripts/email-html-converter.ts)

Before transmitting to Resend, the browser-rendered DOM inside `contenteditable` is processed through `convertEditorToCleanHtml`:
1. **Strips Dangerous Elements:** Removes `<script>`, `<style>`, `<iframe>`, and `on*` event handlers.
2. **Normalizes Structural Tags:** Converts browser-inserted `<b>`, `<i>`, and plain `<div>` into clean `<strong>`, `<em>`, and `<p>`.
3. **Injects Email-Safe Inline Styles:**
   - Headings: `font-family: Georgia, 'Times New Roman', serif`, color `#2B2A26`, line-height `1.3`.
   - Paragraphs: system font stack, color `#2B2A26`, line-height `1.7`, `margin: 0 0 16px`.
   - Blockquotes: left border `3px solid #DB9558`, background `#FCF9EA`, italic serif.
   - Links: color `#8A5420`, underline, `target="_blank"`.
   - Dividers: `1px solid #E3DCC4`.

### Step 2.3: Branded Bhavna Space Letterhead Framing
* Function: `wrapInBhavnaEmailTemplate(cleanHtml, { subject })`

By default, the content is framed inside the official **Bhavna Space Editorial Email Template**:
* **Studio Header:** "BHAVNA SPACE — Interiors • Architecture • Decor (Mumbai, Maharashtra)" on `#FCF9EA` Warm Ivory banner with 1px border.
* **White Editorial Body:** Generous whitespace, high-contrast typography, WCAG AA compliant.
* **Studio Signature Footer:** Studio concept, physical location, direct email link, and website link.
*(Admins can uncheck "Wrap in Bhavna Space Editorial Letterhead" to send raw authored HTML).*

### Step 2.4: Dispatch via Resend API
* **Endpoint:** `POST /api/admin/send-email`
* **File:** [`src/server/admin-api.ts`](file:///var/www/cml-projects/bhavnaspace/src/server/admin-api.ts)

1. **Authentication:** Verifies the Bearer session token.
2. **Payload Parsing:** Validates all recipient addresses via email regex, ensures subject and HTML are non-empty.
3. **API Call:** Sends an authorized HTTPS request to Resend:
   ```bash
   POST https://api.resend.com/emails
   Authorization: Bearer $RESEND_API_KEY
   Content-Type: application/json

   {
     "from": "Bhavna Space <connect@bhavnaspace.com>",
     "to": ["client@example.com"],
     "subject": "Bhavna Space — Design Proposal",
     "html": "<!DOCTYPE html>..."
   }
   ```
4. **Response & Session Log:**
   - Upon success, Resend returns `{ "id": "01a132fc-..." }`.
   - The UI displays an alert with the Resend ID and logs the message into the **Session Dispatch Log** with a one-click "Copy ID" utility.

---

## 3. Environment Variables Reference

| Variable | Description | Source / Usage |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | API key from Resend (`re_...`) | Used to send 2FA OTP and outgoing studio emails |
| `CONTACT_FROM_EMAIL` | Verified sending identity (e.g. `Bhavna Space <connect@bhavnaspace.com>`) | Sender address in all outgoing Resend emails |
| `ADMIN_EMAIL` | Dynamic administrator email address(es) (comma-separated) | Validated during Step 1 login; receives the 2FA OTP |
| `ADMIN_PASSWORD` | Administrator password | Validated during Step 1 login |
| `ADMIN_SESSION_SECRET` | Secret key used for Web Crypto HMAC token signing | Signs challenge tokens and 24h session JWTs |
| `ADMIN_ROUTE_OVERRIDE` | Optional override for rolling `ddmmyyyy` route slug | If set, replaces rolling date slug with fixed custom path |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public key | Client-side bot check on public contact form |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile private key | Server-side verification for public contact form |

---

## 4. Local Development vs. Production Parity

* **Local Dev (`npm run dev`):** Handled via [`dev-api-plugin.mjs`](file:///var/www/cml-projects/bhavnaspace/dev-api-plugin.mjs). A custom Vite connect middleware intercepts `/api/admin/*`, reads variables from [`.env`](file:///var/www/cml-projects/bhavnaspace/.env), and runs the identical Web Crypto handlers.
* **Production (`wrangler deploy`):** Handled via Cloudflare Worker [`src/worker.ts`](file:///var/www/cml-projects/bhavnaspace/src/worker.ts). The worker intercepts `/api/admin/*` and executes the exact same modular handler [`src/server/admin-api.ts`](file:///var/www/cml-projects/bhavnaspace/src/server/admin-api.ts) directly on the edge.

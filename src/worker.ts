import { handleAdminApi } from './server/admin-api';
import { isValidAdminDateSlug } from './server/admin-path';

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  PUBLIC_SITE_URL?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  ADMIN_ROUTE_OVERRIDE?: string;
}

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  message?: string;
  website?: string;
  'cf-turnstile-response'?: string;
  cfTurnstileResponse?: string;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);

async function validateTurnstile(token: string, secret: string, ip: string | null) {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return response.json() as Promise<{ success: boolean; hostname?: string; 'error-codes'?: string[] }>;
}

async function handleContact(request: Request, env: Env) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.ADMIN_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return json({ error: 'Contact service is not configured.' }, 503);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 15000) return json({ error: 'Request is too large.' }, 413);

  let payload: ContactPayload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  // Honeypot catches simple bots before spending a Turnstile verification request.
  if (payload.website) return json({ ok: true });

  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim();
  const phone = String(payload.phone ?? '').trim();
  const projectType = String(payload.projectType ?? 'Other').trim();
  const message = String(payload.message ?? '').trim();
  const token = String(payload['cf-turnstile-response'] ?? payload.cfTurnstileResponse ?? '').trim();

  if (!name || name.length > 80) return json({ error: 'Please enter your name.' }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 160) return json({ error: 'Please enter a valid email.' }, 400);
  if (!message || message.length > 3000) return json({ error: 'Please tell us a little about the project.' }, 400);
  if (!token) return json({ error: 'Please complete the verification.' }, 400);

  const verification = await validateTurnstile(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'));
  if (!verification.success) return json({ error: 'Verification failed. Please try again.' }, 403);

  const html = `
    <h2>New Bhavna Space enquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone / WhatsApp:</strong> ${escapeHtml(phone || 'Not provided')}</p>
    <p><strong>Project type:</strong> ${escapeHtml(projectType)}</p>
    <hr />
    <p><strong>Message</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
  `;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.ADMIN_EMAIL],
      reply_to: email,
      subject: `New ${projectType} enquiry — ${name}`,
      html,
    }),
  });

  if (!emailResponse.ok) return json({ error: 'We could not send your enquiry right now. Please use WhatsApp instead.' }, 502);
  return json({ ok: true });
}

type QuotePayload = {
  bhk?: string;
  location?: string;
  mobile?: string;
  name?: string;
  website?: string;
};

async function handleQuote(request: Request, env: Env) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!env.RESEND_API_KEY) {
    return json({ error: 'Quotation email service is not configured.' }, 503);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 15000) return json({ error: 'Request is too large.' }, 413);

  let payload: QuotePayload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid request payload.' }, 400); }

  // Honeypot check
  if (payload.website) return json({ ok: true });

  const bhk = String(payload.bhk ?? '').trim();
  const location = String(payload.location ?? '').trim();
  const mobile = String(payload.mobile ?? '').trim();
  const name = String(payload.name ?? '').trim();

  if (!bhk) return json({ error: 'Please select a configuration (1 BHK, 2 BHK, 3 BHK, or 3 BHK+).' }, 400);
  if (!location || location.length > 150) return json({ error: 'Please enter your property location / city.' }, 400);
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 10 || mobile.length > 25) {
    return json({ error: 'Please enter a valid 10-digit mobile number.' }, 400);
  }

  const cleanPhone = digits.length === 10 ? digits : digits.slice(-10);
  const waLink = `https://wa.me/91${cleanPhone}`;
  const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FCF9EA; border: 1px solid #E3DCC4; padding: 32px; border-radius: 6px; color: #2B2A26;">
      <div style="border-bottom: 2px solid #DB9558; padding-bottom: 16px; margin-bottom: 24px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8A5420; font-weight: bold; display: block; margin-bottom: 4px;">Bhavna Space — Instant Quotation Request</span>
        <h2 style="font-size: 24px; margin: 0; color: #2B2A26; font-weight: 500;">New Free Quotation Lead</h2>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #5E5B52; margin: 0 0 20px;">
        A potential client has requested an instant free quotation via the homepage popup.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #FFFFFF; border: 1px solid #E3DCC4; border-radius: 4px; overflow: hidden;">
        <tbody>
          <tr style="border-bottom: 1px solid #E3DCC4;">
            <td style="padding: 12px 16px; font-weight: bold; width: 150px; background: #F8F5E4; color: #2B2A26;">Configuration</td>
            <td style="padding: 12px 16px; font-size: 16px; font-weight: bold; color: #8A5420;">${escapeHtml(bhk)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E3DCC4;">
            <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Location / City</td>
            <td style="padding: 12px 16px; color: #2B2A26;">${escapeHtml(location)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E3DCC4;">
            <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Mobile Number</td>
            <td style="padding: 12px 16px; color: #2B2A26;">
              <a href="tel:${escapeHtml(mobile)}" style="color: #2B2A26; font-weight: 600; text-decoration: none;">${escapeHtml(mobile)}</a>
              &nbsp;&bull;&nbsp;
              <a href="${waLink}" style="color: #4F5E38; font-weight: 600; text-decoration: underline;" target="_blank">Open WhatsApp &rarr;</a>
            </td>
          </tr>
          ${name ? `
          <tr style="border-bottom: 1px solid #E3DCC4;">
            <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Name</td>
            <td style="padding: 12px 16px; color: #2B2A26;">${escapeHtml(name)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Received At</td>
            <td style="padding: 12px 16px; color: #5E5B52; font-size: 13px;">${escapeHtml(submittedAt)} IST</td>
          </tr>
        </tbody>
      </table>

      <div style="background: #FAF6E8; border-left: 3px solid #DB9558; padding: 14px 18px; border-radius: 2px; margin-top: 24px;">
        <p style="margin: 0; font-size: 13px; color: #2B2A26; line-height: 1.5;">
          <strong>Quick Action:</strong> Click the WhatsApp link above to send floor plan samples or discuss quotation pricing directly with the client.
        </p>
      </div>

      <p style="font-size: 12px; color: #5E5B52; margin-top: 24px; text-align: center;">
        Sent automatically from bhavnaspace.com homepage quotation system
      </p>
    </div>
  `;

  const recipients = ['himanshuatoz46@gmail.com', 'dhruvam1999@gmail.com'];
  const fromEmail = env.CONTACT_FROM_EMAIL || 'Bhavna Space <connect@bhavnaspace.com>';

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipients,
      subject: `✨ Free Quotation Request: ${bhk} in ${location} — ${name || mobile}`,
      html,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error('[Resend Error]', errorText);
    return json({ error: 'Could not send quotation email right now. Please connect on WhatsApp directly.' }, 502);
  }

  return json({ ok: true });
}

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'DENY');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com https://api.resend.com; font-src 'self' data:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
  );
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. API Handlers
    if (url.pathname.startsWith('/api/admin/')) {
      const adminResponse = await handleAdminApi(request, env);
      if (adminResponse) return adminResponse;
    }
    if (url.pathname === '/api/contact') return handleContact(request, env);
    if (url.pathname === '/api/quote') return handleQuote(request, env);

    // 2. Hide static /admin path directly from public access (returns 404)
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return new Response('Not Found', { status: 404 });
    }

    // 3. Dynamic admin link: domain/ddmmyyyy/login and domain/ddmmyyyy/
    const dynamicAdminMatch = url.pathname.match(/^\/(\d{8})(\/login)?\/?$/);
    if (dynamicAdminMatch) {
      const dateSlug = dynamicAdminMatch[1];
      const isLogin = dynamicAdminMatch[2] === '/login';

      if (!isValidAdminDateSlug(dateSlug, new Date(), env.ADMIN_ROUTE_OVERRIDE)) {
        return new Response('Not Found', { status: 404 });
      }

      // Rewrite internally to the built admin static asset
      const assetUrl = new URL(request.url);
      assetUrl.pathname = isLogin ? '/admin/login/index.html' : '/admin/index.html';
      const assetRequest = new Request(assetUrl.toString(), request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      return applySecurityHeaders(assetResponse);
    }

    // 4. Standard static asset fetch
    const response = await env.ASSETS.fetch(request);
    return applySecurityHeaders(response);
  },
};

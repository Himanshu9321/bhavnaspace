interface Env {
  ASSETS: Fetcher;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  PUBLIC_SITE_URL?: string;
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
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
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
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `New ${projectType} enquiry — ${name}`,
      html,
    }),
  });

  if (!emailResponse.ok) return json({ error: 'We could not send your enquiry right now. Please use WhatsApp instead.' }, 502);
  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env);

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com https://api.resend.com; font-src 'self' data:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

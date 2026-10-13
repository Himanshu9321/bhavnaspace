import { signToken, verifyToken, sha256Hex, generateOtp } from './auth.ts';

export interface AdminEnv {
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

const DEFAULT_SECRET = 'bhavnaspace-admin-production-secure-key-2026';
const DEFAULT_ADMIN_PASSWORD = 'BhavnaSpace@2026';
const DEFAULT_FROM = 'Bhavna Space <connect@bhavnaspace.com>';

const json = (data: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });

function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((part) => {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k && v) {
      cookies[k] = decodeURIComponent(v);
    }
  });
  return cookies;
}

export function getSessionToken(request: Request): string {
  // 1. Prefer secure HttpOnly cookie
  const cookies = parseCookies(request);
  if (cookies.bhavna_admin_session) {
    return cookies.bhavna_admin_session;
  }
  // 2. Fallback to Authorization: Bearer <token>
  const authHeader = request.headers.get('Authorization') || '';
  return authHeader.replace(/^Bearer\s+/i, '').trim();
}

function isRequestSecure(request: Request): boolean {
  try {
    const url = new URL(request.url);
    if (url.protocol === 'https:') return true;
  } catch {}
  return request.headers.get('X-Forwarded-Proto') === 'https';
}

function makeSessionCookieHeader(token: string, isHttps: boolean, maxAgeSeconds = 86400): string {
  const secureFlag = isHttps ? '; Secure' : '';
  return `bhavna_admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

function makeClearSessionCookieHeader(isHttps: boolean): string {
  const secureFlag = isHttps ? '; Secure' : '';
  return `bhavna_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureFlag}`;
}

function getSecret(env: AdminEnv): string {
  return env.ADMIN_SESSION_SECRET?.trim() || DEFAULT_SECRET;
}

function getAllowedAdminEmails(env: AdminEnv): string[] {
  const configured = env.ADMIN_EMAIL?.trim() || '';
  return configured
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getAdminPassword(env: AdminEnv): string {
  return env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
}

function createOtpEmailTemplate(otp: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bhavna Space Admin Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FCF9EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B2A26;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF9EA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid #E3DCC4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(43, 42, 38, 0.04);">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #F0ECE0; background-color: #FCF9EA;">
              <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #8A5420; font-weight: 600;">Admin Console Security</p>
              <h1 style="margin: 0; font-size: 26px; font-weight: 500; letter-spacing: -0.01em; color: #2B2A26; font-family: Georgia, 'Times New Roman', serif;">BHAVNA SPACE</h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; letter-spacing: 0.08em; color: #5E5B52; text-transform: uppercase;">Two-Factor Authentication</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; background-color: #FFFFFF;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #2B2A26;">
                A sign-in attempt was initiated for your Bhavna Space administrator account (<strong>${email}</strong>).
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #5E5B52;">
                Enter this single-use 6-digit verification code to complete sign-in:
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #FCF9EA; border: 1px solid #DB9558; border-radius: 4px; padding: 22px 16px; text-align: center; margin-bottom: 28px;">
                <span style="font-size: 38px; font-weight: 700; letter-spacing: 0.28em; color: #8A5420; font-family: monospace; display: inline-block; padding-left: 0.28em;">${otp}</span>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #5E5B52;">
                ⏳ <strong>Valid for 10 minutes.</strong> Never share this code with anyone.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #8A857A;">
                If you did not request this login code, you can safely disregard this email or update your password.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #FCF9EA; border-top: 1px solid #E3DCC4; text-align: center;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.05em; color: #5E5B52;">
                Bhavna Space Studio &bull; Interior Architecture &bull; Mumbai, Maharashtra
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #8A857A;">
                <a href="https://bhavnaspace.com" style="color: #8A5420; text-decoration: none;">bhavnaspace.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function wrapInBhavnaEmailTemplate(contentHtml: string, subjectTitle: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subjectTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FCF9EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B2A26; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF9EA; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E3DCC4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 24px rgba(43, 42, 38, 0.05);">
          <!-- Studio Header Banner -->
          <tr>
            <td style="padding: 36px 36px 28px; background-color: #FCF9EA; border-bottom: 1px solid #E3DCC4; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.22em; color: #8A5420; font-weight: 600;">Interiors &bull; Architecture &bull; Decor</p>
              <h1 style="margin: 0; font-size: 28px; font-weight: 400; letter-spacing: 0.02em; color: #2B2A26; font-family: Georgia, 'Times New Roman', serif;">BHAVNA SPACE</h1>
              <p style="margin: 6px 0 0; font-size: 12px; letter-spacing: 0.1em; color: #5E5B52; text-transform: uppercase;">Mumbai, Maharashtra</p>
            </td>
          </tr>
          <!-- Main Editorial Content Area -->
          <tr>
            <td style="padding: 40px 36px; background-color: #FFFFFF; font-size: 15px; line-height: 1.7; color: #2B2A26;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2B2A26;">
                ${contentHtml}
              </div>
            </td>
          </tr>
          <!-- Studio Signature & Footer -->
          <tr>
            <td style="padding: 28px 36px; background-color: #FCF9EA; border-top: 1px solid #E3DCC4; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 500; color: #2B2A26; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 0.03em;">
                BHAVNA SPACE
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #5E5B52; line-height: 1.5;">
                Interiors shaped by light, material, and quiet luxury.<br />
                Mumbai, Maharashtra, India
              </p>
              <p style="margin: 0; font-size: 12px; color: #8A5420;">
                <a href="https://bhavnaspace.com" style="color: #8A5420; text-decoration: underline;">bhavnaspace.com</a> &bull;
                <a href="mailto:connect@bhavnaspace.com" style="color: #8A5420; text-decoration: underline;">connect@bhavnaspace.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(val: string): string {
  return val.replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c] ?? c);
}

// 1. POST /api/admin/login
async function handleLogin(request: Request, env: AdminEnv): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request payload' }, 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = (body.password || '').trim();

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const allowedEmails = getAllowedAdminEmails(env);
  const expectedPassword = getAdminPassword(env);

  if (allowedEmails.length === 0) {
    return json({ error: 'No administrator email configured in environment. Please set ADMIN_EMAIL.' }, 503);
  }

  if (!allowedEmails.includes(email) || password !== expectedPassword) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const secret = getSecret(env);
  const otp = generateOtp();
  const otpHash = await sha256Hex(otp + secret);
  const exp = Date.now() + 10 * 60 * 1000; // 10 minutes

  const challengeToken = await signToken({ email, otpHash, exp }, secret);

  const resendKey = env.RESEND_API_KEY?.trim();
  const fromEmail = env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM;

  console.log(`[Bhavna Space Admin 2FA] Generated OTP for ${email}: ${otp}`);

  // Send OTP via Resend API
  if (resendKey) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `Bhavna Space Admin — Verification Code: ${otp}`,
          html: createOtpEmailTemplate(otp, email),
        }),
      });

      if (!emailRes.ok) {
        const errorText = await emailRes.text();
        console.error('[Resend Error sending OTP]', errorText);
        return json(
          {
            error: `Failed to dispatch 2FA email via Resend: ${errorText}. Please verify RESEND_API_KEY.`,
          },
          502
        );
      }
    } catch (err) {
      console.error('[Resend Exception sending OTP]', err);
      return json({ error: 'Network error contacting Resend API' }, 502);
    }
  } else {
    console.warn('[Bhavna Space Admin] RESEND_API_KEY not configured. OTP printed to console.');
  }

  return json({
    ok: true,
    step: 'otp',
    email,
    challengeToken,
    message: `Verification code sent to ${email}`,
  });
}

// 2. POST /api/admin/verify-otp
async function handleVerifyOtp(request: Request, env: AdminEnv): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { email?: string; otp?: string; challengeToken?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request payload' }, 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  const otp = (body.otp || '').trim().replace(/\s+/g, '');
  const challengeToken = (body.challengeToken || '').trim();

  if (!email || !otp || !challengeToken) {
    return json({ error: 'Email, OTP, and challenge token are required' }, 400);
  }

  const secret = getSecret(env);
  const verification = await verifyToken<{ email: string; otpHash: string; exp: number }>(
    challengeToken,
    secret
  );

  if (!verification.valid || !verification.payload) {
    return json({ error: verification.error || 'Verification code has expired. Please sign in again.' }, 401);
  }

  if (verification.payload.email !== email) {
    return json({ error: 'Email mismatch for this challenge' }, 401);
  }

  const submittedHash = await sha256Hex(otp + secret);
  if (submittedHash !== verification.payload.otpHash) {
    return json({ error: 'Incorrect 6-digit verification code' }, 401);
  }

  // Issue 24-hour admin session token
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const sessionToken = await signToken(
    {
      email,
      role: 'admin',
      exp,
    },
    secret
  );

  const isHttps = isRequestSecure(request);
  const cookieHeader = makeSessionCookieHeader(sessionToken, isHttps, 86400);

  return json(
    {
      ok: true,
      user: {
        email,
        role: 'admin',
      },
      expiresAt: exp,
    },
    200,
    {
      'Set-Cookie': cookieHeader,
    }
  );
}

// 3. GET /api/admin/session or /api/admin/me
async function handleCheckSession(request: Request, env: AdminEnv): Promise<Response> {
  const token = getSessionToken(request);

  if (!token) {
    return json({ error: 'Authentication required' }, 401);
  }

  const secret = getSecret(env);
  const result = await verifyToken<{ email: string; role: string }>(token, secret);

  if (!result.valid || !result.payload) {
    return json({ error: result.error || 'Session expired or invalid' }, 401);
  }

  return json({
    ok: true,
    user: {
      email: result.payload.email,
      role: result.payload.role,
    },
  });
}

// 4. POST /api/admin/send-email
async function handleSendEmail(request: Request, env: AdminEnv): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = getSessionToken(request);

  if (!token) {
    return json({ error: 'Admin authentication required' }, 401);
  }

  const secret = getSecret(env);
  const auth = await verifyToken<{ email: string; role: string }>(token, secret);
  if (!auth.valid || !auth.payload) {
    return json({ error: 'Session expired or invalid. Please log in again.' }, 401);
  }

  let body: {
    to?: string | string[];
    subject?: string;
    html?: string;
    replyTo?: string;
    senderName?: string;
    wrapTemplate?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON request payload' }, 400);
  }

  const rawTo = body.to;
  let recipients: string[] = [];

  if (Array.isArray(rawTo)) {
    recipients = rawTo.map((r) => String(r).trim()).filter(Boolean);
  } else if (typeof rawTo === 'string') {
    recipients = rawTo
      .split(/[,;\n]/)
      .map((r) => r.trim())
      .filter(Boolean);
  }

  if (recipients.length === 0) {
    return json({ error: 'At least one recipient email address is required.' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const r of recipients) {
    if (!emailRegex.test(r)) {
      return json({ error: `Invalid recipient email address: "${r}"` }, 400);
    }
  }

  const subject = (body.subject || '').trim();
  if (!subject) {
    return json({ error: 'Email subject is required.' }, 400);
  }

  const rawHtml = (body.html || '').trim();
  if (!rawHtml) {
    return json({ error: 'Email content cannot be empty.' }, 400);
  }

  const resendKey = env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return json({ error: 'RESEND_API_KEY is not configured on server.' }, 503);
  }

  const fromName = (body.senderName || 'Bhavna Space').trim();
  const configuredFrom = env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM;
  
  // Format from header e.g. "Bhavna Space <connect@bhavnaspace.com>"
  let finalFrom = configuredFrom;
  if (fromName && !configuredFrom.includes('<')) {
    finalFrom = `${fromName} <${configuredFrom}>`;
  }

  const finalHtml = body.wrapTemplate !== false ? wrapInBhavnaEmailTemplate(rawHtml, subject) : rawHtml;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: finalFrom,
        to: recipients,
        subject,
        html: finalHtml,
        reply_to: body.replyTo ? body.replyTo.trim() : undefined,
      }),
    });

    const resData = (await resendResponse.json()) as { id?: string; message?: string; name?: string };

    if (!resendResponse.ok) {
      console.error('[Resend API Error]', resData);
      return json(
        {
          error: resData.message || resData.name || 'Failed to dispatch email via Resend API.',
          details: resData,
        },
        502
      );
    }

    return json({
      ok: true,
      id: resData.id,
      recipients,
      subject,
      timestamp: new Date().toISOString(),
      message: `Email successfully sent to ${recipients.join(', ')}`,
    });
  } catch (err) {
    console.error('[Resend Dispatch Exception]', err);
    return json({ error: 'Failed to connect to Resend API.' }, 502);
  }
}

export async function handleAdminApi(request: Request, env: AdminEnv): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.pathname === '/api/admin/login') {
    return handleLogin(request, env);
  }
  if (url.pathname === '/api/admin/verify-otp') {
    return handleVerifyOtp(request, env);
  }
  if (url.pathname === '/api/admin/session' || url.pathname === '/api/admin/me') {
    return handleCheckSession(request, env);
  }
  if (url.pathname === '/api/admin/send-email') {
    return handleSendEmail(request, env);
  }
  if (url.pathname === '/api/admin/logout') {
    const isHttps = isRequestSecure(request);
    return json(
      { ok: true, message: 'Logged out successfully' },
      200,
      {
        'Set-Cookie': makeClearSessionCookieHeader(isHttps),
      }
    );
  }

  return null;
}

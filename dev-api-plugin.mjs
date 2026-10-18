import fs from 'node:fs';
import path from 'node:path';

function loadDotenv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

export function devApiPlugin() {
  loadDotenv();
  return {
    name: 'bhavna-dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 0. Quotation Lead API: /api/quote
        const parsedUrl = req.url.split('?')[0];
        if (parsedUrl === '/api/quote' && req.method === 'POST') {
          try {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const bodyBuffer = Buffer.concat(chunks);
            const payload = JSON.parse(bodyBuffer.toString('utf-8') || '{}');

            // Honeypot check
            if (payload.website) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
              return;
            }

            const bhk = String(payload.bhk || '').trim();
            const location = String(payload.location || '').trim();
            const mobile = String(payload.mobile || '').trim();
            const name = String(payload.name || '').trim();

            if (!bhk || !location || !mobile) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Please provide configuration, location, and mobile number.' }));
              return;
            }

            const digits = mobile.replace(/\D/g, '');
            if (digits.length < 10) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Please provide a valid 10-digit mobile number.' }));
              return;
            }

            const cleanPhone = digits.length === 10 ? digits : digits.slice(-10);
            const waLink = `https://wa.me/91${cleanPhone}`;
            const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

            const escapeStr = (s) => String(s).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c] || c);

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
                      <td style="padding: 12px 16px; font-size: 16px; font-weight: bold; color: #8A5420;">${escapeStr(bhk)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E3DCC4;">
                      <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Location / City</td>
                      <td style="padding: 12px 16px; color: #2B2A26;">${escapeStr(location)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E3DCC4;">
                      <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Mobile Number</td>
                      <td style="padding: 12px 16px; color: #2B2A26;">
                        <a href="tel:${escapeStr(mobile)}" style="color: #2B2A26; font-weight: 600; text-decoration: none;">${escapeStr(mobile)}</a>
                        &nbsp;&bull;&nbsp;
                        <a href="${waLink}" style="color: #4F5E38; font-weight: 600; text-decoration: underline;" target="_blank">Open WhatsApp &rarr;</a>
                      </td>
                    </tr>
                    ${name ? `
                    <tr style="border-bottom: 1px solid #E3DCC4;">
                      <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Name</td>
                      <td style="padding: 12px 16px; color: #2B2A26;">${escapeStr(name)}</td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding: 12px 16px; font-weight: bold; background: #F8F5E4; color: #2B2A26;">Received At</td>
                      <td style="padding: 12px 16px; color: #5E5B52; font-size: 13px;">${escapeStr(submittedAt)} IST</td>
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
            const resendApiKey = process.env.RESEND_API_KEY;
            const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Bhavna Space <connect@bhavnaspace.com>';

            if (resendApiKey) {
              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: fromEmail,
                  to: recipients,
                  subject: `✨ Free Quotation Request: ${bhk} in ${location} — ${name || mobile}`,
                  html,
                }),
              });

              if (!resendRes.ok) {
                const errText = await resendRes.text();
                console.warn('[Dev Resend API Error]', errText);
              } else {
                console.log('[Dev Resend Success] Quotation email sent to', recipients);
              }
            } else {
              console.log('[Dev Lead - No RESEND_API_KEY]', { bhk, location, mobile, name, recipients });
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, message: 'Quotation request submitted successfully.' }));
            return;
          } catch (err) {
            console.error('[Dev API Quote Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Server error processing quotation.', details: String(err) }));
            return;
          }
        }

        // 1. API Handlers: /api/admin/*
        if (req.url.startsWith('/api/admin/')) {
          try {
            const { handleAdminApi } = await server.ssrLoadModule('/src/server/admin-api.ts');

            const host = req.headers.host || 'localhost:4321';
            const fullUrl = `http://${host}${req.url}`;

            const chunks = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const bodyBuffer = Buffer.concat(chunks);

            const webHeaders = new Headers();
            for (const [key, val] of Object.entries(req.headers)) {
              if (val !== undefined) {
                if (Array.isArray(val)) {
                  val.forEach((v) => webHeaders.append(key, v));
                } else {
                  webHeaders.set(key, val);
                }
              }
            }

            const webRequest = new Request(fullUrl, {
              method: req.method,
              headers: webHeaders,
              body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
              duplex: 'half',
            });

            const env = {
              RESEND_API_KEY: process.env.RESEND_API_KEY,
              CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
              ADMIN_EMAIL: process.env.ADMIN_EMAIL,
              ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
              ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
              ADMIN_ROUTE_OVERRIDE: process.env.ADMIN_ROUTE_OVERRIDE,
            };

            const webResponse = await handleAdminApi(webRequest, env);
            if (!webResponse) {
              return next();
            }

            res.statusCode = webResponse.status;
            webResponse.headers.forEach((value, header) => {
              res.setHeader(header, value);
            });

            const responseText = await webResponse.text();
            res.end(responseText);
            return;
          } catch (err) {
            console.error('[Dev API Middleware Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal dev server error', details: String(err) }));
            return;
          }
        }

        // 2. Dynamic admin link: domain/ddmmyyyy/login and domain/ddmmyyyy/
        const dynamicAdminMatch = req.url.match(/^\/(\d{8})(\/login|\/)?(\?.*)?$/);
        if (dynamicAdminMatch) {
          const dateSlug = dynamicAdminMatch[1];
          const subPath = dynamicAdminMatch[2] || '';
          const query = dynamicAdminMatch[3] || '';

          try {
            const { isValidAdminDateSlug } = await server.ssrLoadModule('/src/server/admin-path.ts');
            if (!isValidAdminDateSlug(dateSlug, new Date(), process.env.ADMIN_ROUTE_OVERRIDE)) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end('<h1>404 Not Found</h1>');
              return;
            }

            // Mark request as authorized internal rewrite
            req.headers['x-admin-authorized-rewrite'] = 'true';
            if (subPath.startsWith('/login')) {
              req.url = `/admin/login/${query}`;
            } else {
              req.url = `/admin/${query}`;
            }
            return next();
          } catch (err) {
            console.error('[Dev Date Routing Error]', err);
          }
        }

        // 3. Block direct public access to /admin or /admin/* without dynamic date slug
        if (
          (req.url === '/admin' || req.url.startsWith('/admin/') || req.url.startsWith('/admin?')) &&
          req.headers['x-admin-authorized-rewrite'] !== 'true'
        ) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end('<h1>404 Not Found</h1>');
          return;
        }

        return next();
      });
    },
  };
}

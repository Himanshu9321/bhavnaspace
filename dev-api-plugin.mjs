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

import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://bhavnaspace.com');
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', base).toString()}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
};

# Bhavna Space

Premium interior-design portfolio built with Astro SSG, GSAP, and Cloudflare Workers.

## Architecture

- Astro 7 static generation: every page/project is real HTML at build time.
- GSAP + ScrollTrigger: cinematic but restrained animation.
- Cloudflare Worker: serves the static build and owns `/api/contact`.
- Cloudflare Turnstile: bot protection for enquiries; token is always verified server-side.
- Resend REST API: sends enquiry email from the Worker.
- Astro image pipeline: use images under `src/assets` with `astro:assets` when adding production photography so responsive formats/sizes are generated at build time.
- Admin Console & Email Dispatch: complete authentication & Resend flow documented in [`ADMIN-FLOW.md`](file:///var/www/cml-projects/bhavnaspace/ADMIN-FLOW.md).
- R2 is intentionally not required on day one. If the portfolio grows large, move the original photography to R2 and keep the website code unchanged behind a media URL abstraction.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Cloudflare setup

1. Create/import a Worker in Cloudflare Workers & Pages.
2. Connect GitHub repository `Himanshu9321/bhavnaspace` using Workers Builds.
3. Build command: `npm run build`
4. Deploy command: `npx wrangler deploy`
5. Production branch: `main`
6. Attach `bhavnaspace.com` as the Worker custom domain.
7. Create a Turnstile widget restricted to `bhavnaspace.com`.
8. Set Worker secrets:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put CONTACT_FROM_EMAIL
```

9. Set the public build variable `PUBLIC_TURNSTILE_SITE_KEY` in the Workers Builds environment.

## WhatsApp / phone

Update `src/data/site.ts`:

- `whatsappNumber`
- `phone`
- `email`
- `city`
- `instagram`

Use the WhatsApp number in international digits only, without `+` or spaces.

## Projects

Edit `src/data/projects.ts`. Replace the placeholder SVGs with real photography.

For production image optimization, prefer Astro assets:

```text
src/assets/projects/project-name/hero.jpg
src/assets/projects/project-name/01.jpg
```

Then use Astro's `Image`/`Picture` components instead of plain `/public` images. This gives build-time image transformation and responsive output.

## Local SEO checklist

- Replace `Mumbai` with the real service city/areas.
- Add a verified Google Business Profile.
- Add a real business phone/email.
- Add `LocalBusiness` JSON-LD once the legal business name/address/telephone are confirmed.
- Add Search Console and submit the sitemap.
- Create real project-specific OG images for the most important portfolio pages.

## Important

Do not commit `.env` or Cloudflare/Resend secrets. Turnstile's site key is public; its secret key is not.

## When to add R2

If the studio reaches dozens of high-resolution projects, create an R2 bucket such as `bhavna-space-media` and connect a dedicated hostname such as `media.bhavnaspace.com`. Keep originals in R2 and use a media URL helper in the app. Cloudflare can cache R2 content through the custom domain; do not use the `r2.dev` development URL for production traffic.

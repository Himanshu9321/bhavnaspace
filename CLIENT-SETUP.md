# Bhavna Space — client-specific setup

Before production, replace every placeholder below.

## Required

- [ ] Real WhatsApp number in `src/data/site.ts`
- [ ] Real phone number
- [ ] Real enquiry email
- [ ] Real city + service areas
- [ ] Instagram URL
- [ ] Client logo/wordmark if available
- [ ] Hero photography
- [ ] Project photography
- [ ] Project descriptions, areas, years and materials
- [ ] Turnstile widget for `bhavnaspace.com`
- [ ] Resend verified sending domain
- [ ] Resend API key secret in Cloudflare
- [ ] Contact recipient secret in Cloudflare

## SEO

- [ ] Google Business Profile created/verified
- [ ] Google Search Console verified
- [ ] Submit `https://bhavnaspace.com/sitemap.xml`
- [ ] Confirm canonical URLs
- [ ] Add real business address only if the client wants it publicly displayed
- [ ] Add `LocalBusiness`/`ProfessionalService` JSON-LD after the business name, phone, city/address and service area are confirmed
- [ ] Create project-specific OG images for the best portfolio projects

## Content editing model

For now, content is code-managed in `src/data/projects.ts`. This is intentional for launch speed and reliability.

If the client later needs to add projects without GitHub, migrate the project data to a headless CMS. Do not introduce a CMS until the actual content workflow requires it.

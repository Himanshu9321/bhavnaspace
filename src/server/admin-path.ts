/**
 * Bhavna Space — Dynamic Admin Path Utilities
 * Computes and validates rolling daily admin routes in ddmmyyyy format.
 * E.g., for October 13, 2026 => "13102026"
 * Route: domain/13102026/login and domain/13102026/
 */

export function getDdmmyyyy(date: Date, timeZone = 'Asia/Kolkata'): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  });
  const parts = formatter.formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  return `${day}${month}${year}`;
}

export function getValidAdminDateSlugs(now = new Date(), overrideSlug?: string): string[] {
  const slugs = new Set<string>();

  if (overrideSlug && overrideSlug.trim()) {
    slugs.add(overrideSlug.trim());
  }

  // 1. Studio primary timezone (IST / Asia/Kolkata)
  slugs.add(getDdmmyyyy(now, 'Asia/Kolkata'));

  // 2. UTC timezone
  slugs.add(getDdmmyyyy(now, 'UTC'));

  // 3. Grace tolerance: 2 hours around midnight (yesterday or tomorrow IST)
  const twoHoursMs = 2 * 60 * 60 * 1000;
  slugs.add(getDdmmyyyy(new Date(now.getTime() - twoHoursMs), 'Asia/Kolkata'));
  slugs.add(getDdmmyyyy(new Date(now.getTime() + twoHoursMs), 'Asia/Kolkata'));

  return Array.from(slugs).filter((s) => /^\d{8}$/.test(s));
}

export function isValidAdminDateSlug(slug: string, now = new Date(), overrideSlug?: string): boolean {
  if (!/^\d{8}$/.test(slug)) return false;
  const valid = getValidAdminDateSlugs(now, overrideSlug);
  return valid.includes(slug);
}

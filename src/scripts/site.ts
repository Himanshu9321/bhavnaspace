import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Navbar scroll behaviour ────────────────────────────────────────────────
const header     = document.querySelector<HTMLElement>('[data-header]');
const SHRINK_AT  = 40;   // px — switch to compact height
let   lastY      = 0;
let   menuIsOpen = false;
let   isMobile   = window.matchMedia('(max-width: 1023px)').matches;

window.matchMedia('(max-width: 1023px)').addEventListener('change', (e) => {
  isMobile = e.matches;
  // if user resizes to desktop while menu open, close it
  if (!isMobile && menuIsOpen) closeMenu();
});

function onScroll() {
  if (!header) return;
  const y = window.scrollY;

  // Shrink on scroll
  if (y > SHRINK_AT) {
    header.classList.add('is-shrunk');
  } else {
    header.classList.remove('is-shrunk');
  }

  // Hide on scroll-down / show on scroll-up — mobile only, and never when menu open
  if (isMobile && !menuIsOpen && !reducedMotion) {
    if (y > lastY && y > 80) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
  }

  lastY = y;
}

window.addEventListener('scroll', onScroll, { passive: true });

// ─── Mobile menu open / close ───────────────────────────────────────────────
const menuButton  = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const mobileMenu  = document.querySelector<HTMLElement>('[data-mobile-menu]');
const mobileLinks = document.querySelectorAll<HTMLElement>('[data-mobile-link]');

// Focus-trap helpers
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.closest('[inert]'));
}

function trapFocus(e: KeyboardEvent) {
  if (!mobileMenu) return;
  const focusable = getFocusable(mobileMenu);
  if (!focusable.length) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

function openMenu() {
  menuIsOpen = true;
  menuButton?.setAttribute('aria-expanded', 'true');
  mobileMenu?.removeAttribute('inert');
  mobileMenu?.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('menu-open');
  document.body.style.overflow = 'hidden';

  // Always show header when menu is open
  header?.classList.remove('is-hidden');

  // Move focus into the menu
  const firstLink = mobileMenu?.querySelector<HTMLElement>('a, button');
  setTimeout(() => firstLink?.focus(), 50);

  document.addEventListener('keydown', onKeyDown);
}

function closeMenu() {
  menuIsOpen = false;
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('inert', '');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('menu-open');
  document.body.style.overflow = '';

  // Return focus to toggle button
  menuButton?.focus();

  document.removeEventListener('keydown', onKeyDown);
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeMenu();
    return;
  }
  trapFocus(e);
}

menuButton?.addEventListener('click', () => {
  if (menuIsOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

// Close when any mobile link is tapped
mobileLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (menuIsOpen) closeMenu();
  });
});

// ─── GSAP page animations ───────────────────────────────────────────────────
if (!reducedMotion) {
  if (document.querySelector('.hero-title span')) {
    gsap.fromTo(
      '.hero-title span',
      { yPercent: 110 },
      { yPercent: 0, duration: 1.15, stagger: 0.08, ease: 'power4.out', delay: 0.15 }
    );
  }

  if (document.querySelector('.hero-media')) {
    gsap.fromTo(
      '.hero-media',
      { clipPath: 'inset(12% 12% 12% 12%)', scale: 1.05 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'power3.inOut', delay: 0.35 }
    );
  }

  gsap.utils.toArray<HTMLElement>('.reveal-up').forEach((element) => {
    gsap.fromTo(
      element,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 82%', once: true },
      }
    );
  });

  gsap.utils.toArray<HTMLElement>('.image-reveal').forEach((element) => {
    if (element.classList.contains('hero-media')) return;
    gsap.fromTo(
      element,
      { clipPath: 'inset(7% 7% 7% 7%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.2,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: element, start: 'top 85%', once: true },
      }
    );
  });
}

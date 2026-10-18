import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Header Scroll Behavior ────────────────────────────────────────────────
const header = document.querySelector<HTMLElement>('[data-header]');
const SHRINK_AT = 50; // px
let lastY = 0;
let menuIsOpen = false;
let isMobile = window.matchMedia('(max-width: 1023px)').matches;

window.matchMedia('(max-width: 1023px)').addEventListener('change', (e) => {
  isMobile = e.matches;
  if (!isMobile && menuIsOpen) closeMenu();
});

function onScroll() {
  if (!header) return;
  const y = window.scrollY;

  // Shrink height on scroll
  if (y > SHRINK_AT) {
    header.classList.add('is-shrunk');
  } else {
    header.classList.remove('is-shrunk');
  }

  // Mobile scroll hide/reveal
  if (isMobile && !menuIsOpen && !reducedMotion) {
    if (y > lastY && y > 120) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
  }

  lastY = y;
}

window.addEventListener('scroll', onScroll, { passive: true });

// ─── Mobile Menu Drawer Management ─────────────────────────────────────────
const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const mobileMenu = document.querySelector<HTMLElement>('[data-mobile-menu]');
const mobileLinks = document.querySelectorAll<HTMLElement>('[data-mobile-link]');

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
  const last = focusable[focusable.length - 1];

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
  document.body.classList.add('menu-open');

  header?.classList.remove('is-hidden');

  const firstLink = mobileMenu?.querySelector<HTMLElement>('a, button');
  setTimeout(() => firstLink?.focus(), 60);

  document.addEventListener('keydown', onKeyDown);
}

function closeMenu() {
  menuIsOpen = false;
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('inert', '');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-open');

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

mobileLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (menuIsOpen) closeMenu();
  });
});

// ─── Refined GSAP Scroll Animations ────────────────────────────────────────
if (!reducedMotion) {
  // Smooth scroll reveals for text blocks
  gsap.utils.toArray<HTMLElement>('.reveal-up').forEach((elem) => {
    gsap.fromTo(
      elem,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: elem,
          start: 'top 90%',
          once: true,
        },
      }
    );
  });

  // Smooth scroll reveals for imagery
  gsap.utils.toArray<HTMLElement>('.image-reveal').forEach((elem) => {
    const img = elem.querySelector('img');
    if (img) {
      gsap.fromTo(
        img,
        { scale: 1.05, opacity: 0.92 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: elem,
            start: 'top 92%',
            once: true,
          },
        }
      );
    }
  });

  // Refresh ScrollTrigger when window loads (ensures layout dimensions are exact)
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
}

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 767px)').matches;

const header = document.querySelector<HTMLElement>('[data-header]');
const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const mobileMenu = document.querySelector<HTMLElement>('[data-mobile-menu]');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileMenu?.setAttribute('aria-hidden', String(open));
  document.documentElement.classList.toggle('menu-open', !open);
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('menu-open');
}));

if (!reducedMotion) {
  gsap.fromTo('.hero-title span', { yPercent: 110 }, { yPercent: 0, duration: 1.15, stagger: 0.08, ease: 'power4.out', delay: 0.15 });
  gsap.fromTo('.hero-media', { clipPath: 'inset(12% 12% 12% 12%)', scale: 1.05 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'power3.inOut', delay: 0.35 });
  gsap.utils.toArray<HTMLElement>('.reveal-up').forEach((element) => {
    gsap.fromTo(element, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 82%', once: true } });
  });
  gsap.utils.toArray<HTMLElement>('.image-reveal').forEach((element) => {
    if (element.classList.contains('hero-media')) return;
    gsap.fromTo(element, { clipPath: 'inset(7% 7% 7% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: element, start: 'top 85%', once: true } });
  });
  if (!mobile) {
    gsap.to(header, { backgroundColor: 'rgba(243,240,233,.9)', color: '#171714', duration: .25, scrollTrigger: { start: '100px top', end: '99999px top', toggleActions: 'play none none reverse' } });
  }
}

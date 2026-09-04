/* Antônio Chinelato — Portfolio 2026
   Progressive enhancement only: the page is complete without this file. */
(() => {
  'use strict';

  const doc = document;
  const html = doc.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero: split words into letters for the staggered entrance ---- */
  if (!reduceMotion) {
    doc.querySelectorAll('[data-split]').forEach((el) => {
      const text = el.textContent;
      el.textContent = '';
      Array.from(text).forEach((ch, i) => {
        const span = doc.createElement('span');
        span.className = 'ch';
        span.style.setProperty('--i', i);
        span.textContent = ch;
        el.appendChild(span);
      });
      el.classList.add('is-split');
    });
  }

  /* ---- scroll reveal ---- */
  const revealEls = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---- header state ---- */
  const header = doc.querySelector('.site-header');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY > 24;
      header.classList.toggle('is-scrolled', scrolled);
      html.classList.toggle('is-scrolled', scrolled);
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- active section in the nav ---- */
  const links = Array.from(doc.querySelectorAll('.nav__links a[href^="#"]'));
  const sections = links
    .map((a) => doc.getElementById(a.hash.slice(1)))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const setActive = (id) => {
      links.forEach((a) => {
        if (a.hash === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
      // back at the very top: nothing is "current"
      if (window.scrollY < window.innerHeight * 0.5) {
        links.forEach((a) => a.removeAttribute('aria-current'));
      }
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => navObserver.observe(s));
  }
})();

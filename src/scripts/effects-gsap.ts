/* =========================================================================
   Serifa Lab — motion island (GSAP + ScrollTrigger).

   Dynamically imported by Base.astro ONLY when the user allows motion, so
   reduced-motion visitors download zero GSAP. Everything here is ported 1:1
   from the `if(!reduce && hasGSAP)` block of serifa-lab_12.html:

     1. Preloader curtain (the "S" fades in, the curtain lifts).
     2. Hero intro — line by line, waiting on the preloader.
     3. Scroll-scrubbed "pergaminho" reveals (unroll down / re-roll up).
     4. Spine parallax (.amp scrub + mouse-driven X) and closing "S" (.amp2).
   ========================================================================= */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Safety: the loader already gated on reduce, but keep the guard so this
// module is inert if ever imported under reduced motion.
if (!reduce) {
  gsap.registerPlugin(ScrollTrigger);

  /* reveal "pergaminho": o conteúdo se desenrola de cima para baixo,
     a borda inclina e a folha se estica ao abrir. */
  const openFrom = {
    clipPath: 'inset(0% 0% 100% 0%)',
    y: -6,
    rotateX: 12,
    scaleY: 0.94,
    opacity: 0,
    transformPerspective: 1000,
    transformOrigin: 'top center',
  };
  const openTo = {
    clipPath: 'inset(0% 0% 0% 0%)',
    y: 0,
    rotateX: 0,
    scaleY: 1,
    opacity: 1,
    transformPerspective: 1000,
    transformOrigin: 'top center',
  };

  gsap.set('.hero .reveal', openFrom);

  const pre = document.getElementById('preloader');
  // We own the curtain now — cancel the base failsafe.
  if (window.__serifaPreFailsafe) clearTimeout(window.__serifaPreFailsafe);

  if (pre) {
    gsap
      .timeline()
      .to('.pre-s', { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' }, 0.1)
      .to(pre, { yPercent: -101, duration: 0.6, ease: 'power4.inOut' }, '+=.22')
      .set(pre, { display: 'none' });
  }

  gsap
    .timeline({ defaults: { ease: 'power3.out' }, delay: pre ? 1.25 : 0 })
    .to('.hero .eyebrow', { ...openTo, duration: 0.8 }, 0.15)
    .to('.hero h1 .reveal', { ...openTo, duration: 1.2, stagger: 0.2 }, '-=.4')
    .to('.hero .sub', { ...openTo, duration: 0.9 }, '-=.8')
    .to('.hero .hero-cta', { ...openTo, duration: 0.8 }, '-=.65');

  gsap.to('.seal', {
    yPercent: 10,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  gsap.to('.closing-cta .amp2', {
    yPercent: -14,
    ease: 'none',
    scrollTrigger: { trigger: '.closing-cta', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
  });

  const hero = document.querySelector('.hero');
  const seal = document.querySelector('.seal');
  if (hero && seal) {
    hero.addEventListener('mousemove', (e) => {
      const ev = e as MouseEvent;
      const x = (ev.clientX / innerWidth - 0.5) * 2;
      gsap.to(seal, { x: x * 14, duration: 1, ease: 'power2.out' });
    });
  }

  // PERGAMINHO: cada bloco se desenrola PRESO AO SCROLL.
  gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el, openFrom, {
      ...openTo,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 56%', scrub: 0.5 },
    });
  });

}

export {};

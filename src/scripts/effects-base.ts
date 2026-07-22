/* =========================================================================
   Serifa Lab — base effects (NO GSAP, runs immediately).

   This is the always-on, lightweight layer. It contains everything that must
   work even with reduced motion or if the GSAP island fails to load: the
   preloader safety-net, nav solidify, the 3D panel stack, the custom cursor,
   the editorial folio and the FAQ accordion. Ported 1:1 from the guards in
   serifa-lab_12.html.

   GUARDS (identical to the source):
     • prefers-reduced-motion  → no stacking, no cursor; preloader self-removes
     • pointer:fine            → cursor only on fine pointers (no touch)
   ========================================================================= */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer:fine)').matches;

/* -------------------------------------------------------------------------
   PRELOADER safety-net.
   With reduced motion — or if the GSAP island never loads — remove the
   curtain so the page is never stuck. When motion is allowed, effects-gsap
   animates the curtain and clears this failsafe timeout.
   ------------------------------------------------------------------------- */
declare global {
  interface Window {
    __serifaPreFailsafe?: number;
  }
}

const preEl = document.getElementById('preloader');
if (preEl) {
  if (reduce) {
    preEl.remove();
  } else {
    window.__serifaPreFailsafe = window.setTimeout(() => {
      preEl.remove();
    }, 4000);
  }
}

/* ----------------------------- NAV solidify ----------------------------- */
const nav = document.getElementById('nav');
if (nav) {
  const onNav = () => nav.classList.toggle('solid', (window.scrollY || 0) > 60);
  onNav();
  addEventListener('scroll', onNav, { passive: true });
}

/* -------------------- 3D stack of the service panels -------------------- */
const stickies = [...document.querySelectorAll<HTMLElement>('.stack .panel-sticky')];
const panels = stickies.map((s) => s.querySelector<HTMLElement>('.panel')!).filter(Boolean);
function stack() {
  if (reduce) return;
  const vh = innerHeight;
  stickies.forEach((s, i) => {
    if (i === panels.length - 1) {
      panels[i].style.transform = 'none';
      panels[i].style.opacity = '1';
      return;
    }
    const p = Math.min(Math.max(-s.getBoundingClientRect().top / vh, 0), 1);
    panels[i].style.transform = `translateZ(-${p * 40}px) rotateX(${p * 24}deg) scale(${1 - p * 0.055})`;
    panels[i].style.opacity = (1 - p * 0.4).toFixed(3);
  });
}
addEventListener('scroll', stack, { passive: true });
addEventListener('resize', stack);
stack();

/* ------------------- Custom cursor (fine pointer only) ------------------ */
if (fine && !reduce) {
  document.documentElement.classList.add('has-cursor');
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  if (dot && ring) {
    let mx = innerWidth / 2;
    let my = innerHeight / 2;
    let rx = mx;
    let ry = my;
    addEventListener(
      'mousemove',
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      },
      { passive: true }
    );
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
    document.addEventListener('mouseover', (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      document.documentElement.classList.toggle('cur-view', !!t.closest('.pcard'));
      document.documentElement.classList.toggle('cur-link', !!t.closest('a,button') && !t.closest('.pcard'));
    });
  }
}

/* --------------------------- Editorial folio ---------------------------- */
(function () {
  const folio = document.querySelector<HTMLElement>('.folio');
  const fn = document.getElementById('folio-n');
  const ft = document.getElementById('folio-t');
  if (!folio || !fn || !ft) return;

  const map: Array<[string, string, string]> = [
    ['.manifesto', '01', 'Manifesto'],
    ['.stats', '01', 'Manifesto'],
    ['#servicos', '02', 'Serviços'],
    ['#trabalho', '03', 'Trabalho'],
    ['.quote', '03', 'Trabalho'],
    ['#processo', '04', 'Processo'],
    ['#faq', '05', 'Perguntas'],
    ['.palette', '05', 'Perguntas'],
    ['#tipografia', '05', 'Tipografia'],
    ['#contato', '06', 'Contato'],
  ];

  const lookup = new Map<Element, [string, string]>();
  map.forEach(([sel, n, t]) => {
    const el = document.querySelector(sel);
    if (el) lookup.set(el, [n, t]);
  });

  const hero = document.querySelector('.hero');

  // The line-sidebar TOC (Toc.astro) shares this observer: it fades in with the
  // folio (off on the hero) and highlights the link whose data-n matches the
  // current editorial number.
  const toc = document.querySelector('.toc');
  const tocLinks = toc ? Array.from(toc.querySelectorAll<HTMLElement>('.toc-link')) : [];
  const setToc = (on: boolean, n?: string) => {
    if (!toc) return;
    toc.classList.toggle('on', on);
    if (on && n) tocLinks.forEach((l) => l.classList.toggle('active', l.dataset.n === n));
  };

  const swap = (n: string, t: string) => {
    if (fn.textContent === n && ft.textContent === t) return;
    folio.style.opacity = '0';
    setTimeout(() => {
      fn.textContent = n;
      ft.textContent = t;
      folio.style.opacity = '';
    }, 180);
  };

  const io = new IntersectionObserver(
    (es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        if (en.target === hero) {
          folio.classList.remove('on');
          setToc(false);
          return;
        }
        const d = lookup.get(en.target);
        if (!d) return;
        folio.classList.add('on');
        swap(d[0], d[1]);
        setToc(true, d[0]);
      });
    },
    { rootMargin: '-42% 0px -42% 0px' }
  );
  if (hero) io.observe(hero);
  lookup.forEach((_, el) => io.observe(el));
})();

/* ------------------------ FAQ accordion (a11y) -------------------------- */
document.querySelectorAll<HTMLElement>('.faq-item').forEach((item) => {
  const q = item.querySelector<HTMLButtonElement>('.faq-q');
  const a = item.querySelector<HTMLElement>('.faq-a');
  if (!q || !a) return;
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll<HTMLElement>('.faq-item.open').forEach((o) => {
      if (o !== item) {
        o.classList.remove('open');
        const oa = o.querySelector<HTMLElement>('.faq-a');
        if (oa) oa.style.maxHeight = '';
        const oq = o.querySelector<HTMLElement>('.faq-q');
        if (oq) oq.setAttribute('aria-expanded', 'false');
      }
    });
    if (isOpen) {
      item.classList.remove('open');
      a.style.maxHeight = '';
      q.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
      q.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ------------- Specular buttons (highlight follows the cursor) ---------- */
// Fine pointer only. Without JS (or on touch) the CSS :hover still shows a
// centred specular highlight, so buttons never look broken.
if (fine && !reduce) {
  document.querySelectorAll<HTMLElement>('.specular').forEach((el) => {
    el.addEventListener(
      'mousemove',
      (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      },
      { passive: true }
    );
  });
}

/* ---------------- Tilted cards (Trabalho selecionado) ------------------- */
// React Bits "Tilted Card" portado para vanilla: cada .pcard inclina em 3D na
// direção do cursor (com mola), sobe de leve (escala) e revela um brilho que
// segue o ponteiro (--gx/--gy → glare no CSS). Fine + motion apenas; em
// touch/reduced-motion os cartões ficam planos (o transform nunca é aplicado).
if (fine && !reduce) {
  const MAX = 8; // graus máximos de inclinação
  const LIFT = 1.03; // escala no hover
  document.querySelectorAll<HTMLElement>('.pcard').forEach((card) => {
    let tx = 0;
    let ty = 0; // alvo (rotX/rotY em graus)
    let cx = 0;
    let cy = 0; // atual (mola)
    let scT = 1;
    let sc = 1; // escala alvo/atual
    let raf = 0;
    let active = false;

    const render = () => {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      sc += (scT - sc) * 0.14;
      const settled =
        Math.abs(tx - cx) < 0.02 && Math.abs(ty - cy) < 0.02 && Math.abs(scT - sc) < 0.002;
      if (settled) {
        raf = 0;
        // Em repouso e fora do cartão, devolve o transform ao CSS (identidade).
        card.style.transform = active
          ? `perspective(900px) rotateX(${tx.toFixed(2)}deg) rotateY(${ty.toFixed(2)}deg) scale(${scT})`
          : '';
        return;
      }
      card.style.transform = `perspective(900px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      raf = requestAnimationFrame(render);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    card.addEventListener('mouseenter', () => {
      active = true;
      scT = LIFT;
      kick();
    });
    card.addEventListener(
      'mousemove',
      (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        ty = px * 2 * MAX; // mouse à direita → inclina p/ direita
        tx = -py * 2 * MAX; // mouse acima → inclina p/ cima
        card.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
        card.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
        kick();
      },
      { passive: true }
    );
    card.addEventListener('mouseleave', () => {
      active = false;
      tx = ty = 0;
      scT = 1;
      kick();
    });
  });
}

export {};

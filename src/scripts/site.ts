import { getScene } from './scene';
import { subscribe } from './clock';
import { createDecoder } from './decode';
import { revealText } from './text-motion';
import { heroVisibility } from './surface-motion';
let cleanup = () => {};
function setup() {
  cleanup();
  const controller = new AbortController();
  const { signal } = controller;
  const disposers: (() => void)[] = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = getScene();
  const decoder = createDecoder(reduced);
  const closeMenus = () => {
    document
      .querySelectorAll<HTMLButtonElement>('[aria-expanded]')
      .forEach((b) => {
        b.setAttribute('aria-expanded', 'false');
        const id = b.getAttribute('aria-controls');
        if (id) document.getElementById(id)?.setAttribute('hidden', '');
      });
  };
  const contact = document.querySelector<HTMLDialogElement>('#contact-dialog');
  document.addEventListener(
    'click',
    (event) => {
      const trigger = (event.target as Element).closest<HTMLElement>(
        '[data-contact]',
      );
      if (!trigger || !contact) return;
      closeMenus();
      contact.querySelector('#contact-title')!.textContent =
        trigger.dataset.contact === 'application'
          ? contact.dataset.applicationTitle!
          : contact.dataset.hireTitle!;
      contact.showModal();
      if (!reduced.matches)
        contact.querySelector('.contact-options')?.animate(
          [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 320, easing: 'ease-out' },
        );
    },
    { signal },
  );
  contact?.addEventListener(
    'click',
    (event) => {
      if (event.target !== contact) return;
      const b = contact.getBoundingClientRect();
      if (
        event.clientX < b.left ||
        event.clientX > b.right ||
        event.clientY < b.top ||
        event.clientY > b.bottom
      )
        contact.close();
    },
    { signal },
  );
  document
    .querySelectorAll<HTMLButtonElement>('[aria-expanded]')
    .forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          const was = button.getAttribute('aria-expanded') === 'true';
          closeMenus();
          if (!was) {
            button.setAttribute('aria-expanded', 'true');
            const panel = document.getElementById(
              button.getAttribute('aria-controls')!,
            );
            panel?.removeAttribute('hidden');
            panel?.animate(
              reduced.matches
                ? []
                : [
                    { opacity: 0, transform: 'translateY(-6px)' },
                    { opacity: 1, transform: 'translateY(0)' },
                  ],
              { duration: 180, easing: 'ease-out' },
            );
            panel
              ?.querySelectorAll<HTMLElement>('[data-decode]')
              .forEach((label) => decoder.run(label, 400));
          }
        },
        { signal },
      );
      button.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (button.getAttribute('aria-expanded') !== 'true') button.click();
            document
              .getElementById(button.getAttribute('aria-controls')!)
              ?.querySelector<HTMLElement>('a')
              ?.focus();
          }
        },
        { signal },
      );
    });
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element;
      if (!target.closest('.dropdown,.menu-toggle,.mobile-menu')) closeMenus();
      if (target.closest('.mobile-menu a')) closeMenus();
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        const expanded = document.querySelector<HTMLButtonElement>(
          '[aria-expanded=true]',
        );
        closeMenus();
        expanded?.focus();
      }
    },
    { signal },
  );
  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target as Element;
      document
        .querySelectorAll<HTMLButtonElement>(
          '.dropdown > button[aria-expanded=true]',
        )
        .forEach((b) => {
          if (!b.parentElement?.contains(target)) {
            b.setAttribute('aria-expanded', 'false');
            document
              .getElementById(b.getAttribute('aria-controls')!)
              ?.setAttribute('hidden', '');
          }
        });
    },
    { signal },
  );
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          reveal.unobserve(e.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll('.reveal').forEach((el) => {
    if (!reduced.matches) el.classList.add('js-reveal');
    reveal.observe(el);
  });
  const legacyAnchors: Record<string, string> = {
    '#skill-0': '#mobile',
    '#skill-1': '#systems',
    '#skill-2': '#craft',
    '#skill-3': '#systems',
    '#lab': '#systems',
  };
  if (legacyAnchors[location.hash]) {
    const target = legacyAnchors[location.hash];
    history.replaceState(history.state, '', target);
    document.querySelector(target)?.scrollIntoView();
  }
  const animateContent = (root: Element) => {
    if (reduced.matches) return;
    root.querySelectorAll<HTMLElement>('[data-decode]').forEach((el) => {
      decoder.forget(el);
      decoder.run(el, 400);
    });
    root
      .querySelectorAll<HTMLElement>('[data-reveal-text]')
      .forEach((el) => revealText(el, reduced.matches));
  };
  document.addEventListener(
    'content:reveal',
    (event) => {
      const root = (event as CustomEvent<{ root: Element }>).detail.root;
      animateContent(root);
    },
    { signal },
  );
  const paragraphObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealText(entry.target as HTMLElement, reduced.matches);
          paragraphObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.18 },
  );
  document
    .querySelectorAll('[data-reveal-text]')
    .forEach((el) => paragraphObserver.observe(el));
  const languageLink =
    document.querySelector<HTMLAnchorElement>('[data-language]');
  const updateLanguageLink = () => {
    if (!languageLink || document.body.dataset.page !== 'home') return;
    const section = ['connect', 'skills'].find(
      (id) =>
        (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <
        innerHeight * 0.45,
    );
    const open = [
      ...document.querySelectorAll<HTMLElement>('[data-capability]'),
    ].find((el) => {
      const bounds = el.getBoundingClientRect();
      return bounds.top < innerHeight * 0.45 && bounds.bottom > 140;
    });
    languageLink.hash =
      section === 'skills' && open
        ? `#${open.id}`
        : section
          ? `#${section}`
          : location.hash;
  };
  window.addEventListener('hashchange', updateLanguageLink, { signal });
  languageLink?.addEventListener('pointerdown', updateLanguageLink, { signal });
  languageLink?.addEventListener('focus', updateLanguageLink, { signal });
  updateLanguageLink();
  const updateScene = () => {
    const hero = document.querySelector<HTMLElement>('.identity');
    if (!hero) {
      scene?.setVisibility(0);
      scene?.setActive(false);
      return;
    }
    const bounds = hero.getBoundingClientRect();
    const header =
      document.querySelector('.header')?.getBoundingClientRect().height ?? 72;
    const coding = document.querySelector<HTMLElement>('[data-coding-region]');
    scene?.setCodingRegion(coding);
    const codingBounds = coding?.getBoundingClientRect();
    const codingVisible = Boolean(
      codingBounds && codingBounds.bottom > 0 && codingBounds.top < innerHeight,
    );
    scene?.setScene('intro');
    scene?.setVisibility(heroVisibility(bounds.bottom, innerHeight, header));
    // Do not use the next section's midpoint as a renderer shutdown boundary.
    scene?.setActive(
      (bounds.bottom > 0 && bounds.top < innerHeight) || codingVisible,
    );
  };
  let scrollPending = false;
  const identity = document.querySelector<HTMLElement>('.identity');
  let smoothScroll = window.scrollY;
  const motionPanels = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-motion-panel],.craft-stage',
    ),
  ];
  const panelObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('panel-entered');
          if (!reduced.matches)
            entry.target.animate(
              [
                { opacity: 0.35, clipPath: 'inset(7% 0 0 0)' },
                { opacity: 1, clipPath: 'inset(0 0 0 0)' },
              ],
              { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' },
            );
          panelObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  motionPanels.forEach((panel) => panelObserver.observe(panel));
  const drawScroll = () => {
    const progress = Math.min(1.3, smoothScroll / Math.max(1, innerHeight));
    document.documentElement.style.setProperty(
      '--page-scroll',
      String(progress),
    );
    document.documentElement.style.setProperty(
      '--identity-shift',
      `${-progress * 105}px`,
    );
    document.documentElement.style.setProperty(
      '--identity-fade',
      String(Math.max(0, 1 - progress * 1.2)),
    );
    if (identity)
      identity.style.setProperty('--profile-shift', `${progress * 32}px`);
    scene?.setScroll(progress);
    if (!reduced.matches)
      motionPanels.forEach((panel) => {
        const r = panel.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight)
          panel.style.setProperty(
            '--motion-progress',
            String(
              Math.max(
                -1,
                Math.min(
                  1,
                  (innerHeight * 0.5 - r.top - r.height * 0.5) / innerHeight,
                ),
              ),
            ),
          );
      });
  };
  let stopScroll: (() => void) | undefined;
  const animateScroll = () => {
    if (reduced.matches || stopScroll) return;
    stopScroll = subscribe((dt) => {
      const difference = window.scrollY - smoothScroll;
      if (Math.abs(difference) < 0.2) {
        stopScroll?.();
        stopScroll = undefined;
        return;
      }
      smoothScroll += difference * Math.min(1, dt * 12);
      drawScroll();
    });
  };
  window.addEventListener(
    'scroll',
    () => {
      if (scrollPending) return;
      scrollPending = true;
      requestAnimationFrame(() => {
        scrollPending = false;
        updateScene();
        updateLanguageLink();
        animateScroll();
        if (reduced.matches) {
          smoothScroll = window.scrollY;
          scene?.setScroll(0);
        }
      });
    },
    { signal, passive: true },
  );
  window.addEventListener(
    'resize',
    () => {
      decoder.refresh();
      updateScene();
      drawScroll();
    },
    { signal },
  );
  updateScene();
  drawScroll();
  const textObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          decoder.run(entry.target as HTMLElement);
          textObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.35 },
  );
  document.querySelectorAll<HTMLElement>('[data-decode]').forEach((el) => {
    if (!el.closest('.dropdown-panel')) textObserver.observe(el);
    if (el.matches('.contact-links a'))
      el.addEventListener('pointerenter', () => decoder.run(el, 550), {
        signal,
      });
  });
  // Font metrics are stable before building fixed-width character slots.
  document.fonts.ready.then(() => {
    if (signal.aborted) return;
    decoder.refresh();
    document
      .querySelectorAll<HTMLElement>('.identity [data-decode]')
      .forEach((el) => decoder.run(el, 600));
  });
  const ambient = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) =>
        entry.target.classList.toggle('motion-idle', !entry.isIntersecting),
      ),
    { rootMargin: '50px' },
  );
  document
    .querySelectorAll('.coding-experience,.systems-showcase,.craft-stage')
    .forEach((el) => ambient.observe(el));
  const visibility = () =>
    document.body.classList.toggle('motion-hidden', document.hidden);
  document.addEventListener('visibilitychange', visibility, { signal });
  cleanup = () => {
    contact?.close();
    panelObserver.disconnect();
    ambient.disconnect();
    paragraphObserver.disconnect();
    textObserver.disconnect();
    stopScroll?.();
    decoder.dispose();
    controller.abort();
    reveal.disconnect();
    disposers.forEach((d) => d());
  };
}
document.addEventListener('astro:before-swap', () => cleanup());
document.addEventListener('astro:page-load', setup);

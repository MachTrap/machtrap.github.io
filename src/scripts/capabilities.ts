import { createArchitecture } from './architecture';
import { capabilityData } from '../data/capabilities';
import { createCodingScene } from './coding-controller';
let dispose = () => {};
function setup() {
  dispose();
  const root = document.querySelector<HTMLElement>('.workbench');
  if (!root) return;
  const lang = document.body.dataset.locale === 'ru' ? 'ru' : 'en';
  const c = capabilityData(lang);
  const abort = new AbortController(),
    { signal } = abort;
  const stops: (() => void)[] = [];
  const reveal = (element: Element) =>
    document.dispatchEvent(
      new CustomEvent('content:reveal', { detail: { root: element } }),
    );
  const text = (selector: string, value: string) => {
    root.querySelector(selector)!.textContent = value;
  };
  const fill = (selector: string, items: readonly string[], tag = 'span') => {
    root.querySelector(selector)!.replaceChildren(
      ...items.map((value) => {
        const el = document.createElement(tag);
        el.textContent = value;
        if (tag === 'p') el.dataset.revealText = '';
        return el;
      }),
    );
  };
  root
    .querySelectorAll<HTMLButtonElement>('[data-mobile-switch]')
    .forEach((button) =>
      button.addEventListener(
        'click',
        () => {
          const native = button.dataset.mobileSwitch === 'native';
          root.querySelector<HTMLElement>(
            '.mobile-showcase',
          )!.dataset.mobileMode = native ? 'native' : 'react';
          root
            .querySelectorAll('[data-mobile-switch]')
            .forEach((b) =>
              b.setAttribute('aria-pressed', String(b === button)),
            );
          text(
            '[data-mobile-description]',
            native ? c.nativeText : c.reactText,
          );
          fill(
            '[data-mobile-technologies]',
            native
              ? [
                  'Swift',
                  'SwiftUI',
                  'UIKit',
                  'Objective-C',
                  'Combine / RxSwift',
                ]
              : [
                  'React Native',
                  'TypeScript',
                  'iOS',
                  'Android',
                  'Native modules',
                ],
          );
          reveal(root.querySelector('.mobile-mode-copy')!);
        },
        { signal },
      ),
    );
  root
    .querySelectorAll<HTMLButtonElement>('[data-specialty]')
    .forEach((button) =>
      button.addEventListener(
        'click',
        () => {
          root
            .querySelectorAll('[data-specialty]')
            .forEach((b) =>
              b.setAttribute('aria-pressed', String(b === button)),
            );
          fill(
            '#specialty-content',
            c.specialtyRows[Number(button.dataset.specialty)],
            'p',
          );
          reveal(root.querySelector('#specialty-content')!);
        },
        { signal },
      ),
    );
  // Both sets of tabs follow the ARIA manual activation and arrow-key pattern.
  const bindTabs = (selector: string, choose: (i: number) => void) => {
    const tabs = [...root.querySelectorAll<HTMLButtonElement>(selector)];
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => choose(i), { signal });
      tab.addEventListener(
        'keydown',
        (e) => {
          const index =
            e.key === 'ArrowRight'
              ? (i + 1) % tabs.length
              : e.key === 'ArrowLeft'
                ? (i + tabs.length - 1) % tabs.length
                : e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? tabs.length - 1
                    : -1;
          if (index < 0) return;
          e.preventDefault();
          choose(index);
          tabs[index].focus();
        },
        { signal },
      );
    });
  };
  const selectTabs = (selector: string, index: number) =>
    root.querySelectorAll<HTMLButtonElement>(selector).forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
  const system = root.querySelector<HTMLElement>('.systems-showcase')!;
  const architecture = createArchitecture(root, lang);
  stops.push(() => architecture.dispose());
  bindTabs('[data-scenario-tab]', (i) => {
    system.dataset.scenario = String(i);
    selectTabs('[data-scenario-tab]', i);
    root
      .querySelector('#scenario-content')!
      .setAttribute('aria-labelledby', `scenario-tab-${i}`);
    const data = c.scenarios[i];
    text('[data-scenario-title]', data.title);
    text('[data-scenario-description]', data.description);
    fill('[data-scenario-tags]', data.tags);
    architecture.chooseScenario(i);
    reveal(root.querySelector('.scenario-intro')!);
  });
  bindTabs('[data-stage]', (i) => {
    root.querySelector<HTMLElement>('.craft-stage')!.dataset.craftStage =
      String(i);
    selectTabs('[data-stage]', i);
    text('[data-stage-title]', c.stageTitles[i]);
    text('[data-stage-description]', c.stageText[i]);
    text(
      '[data-stage-counter]',
      `${c.stages[i]} / ${String(i + 1).padStart(2, '0')}`,
    );
    root
      .querySelector('#stage-content')!
      .setAttribute('aria-labelledby', `stage-tab-${i}`);
    fill('[data-stage-tools]', c.stageTools[i]);
    reveal(root.querySelector('.craft-text')!);
  });
  stops.push(
    createCodingScene(
      root.querySelector<HTMLElement>('[data-coding-region]')!,
      lang,
    ),
  );
  dispose = () => {
    abort.abort();
    stops.forEach((stop) => stop());
  };
}
document.addEventListener('astro:before-swap', () => dispose());
document.addEventListener('astro:page-load', setup);

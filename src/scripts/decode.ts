import { subscribe } from './clock';

// Fixed character slots avoid reflow while noise resolves from left to right.
// Screen readers see the original string throughout the animation.
export function createDecoder(reduced: MediaQueryList) {
  const prepared = new Map<
    HTMLElement,
    { cells: HTMLElement[]; chars: string[]; stop?: () => void }
  >();
  function prepare(element: HTMLElement) {
    let state = prepared.get(element);
    if (state) return state;
    const text = element.textContent?.trim() ?? '';
    const stable = document.createElement('span');
    stable.className = 'sr-only';
    stable.textContent = text;
    const visual = document.createElement('span');
    visual.className = 'decode-visual';
    visual.setAttribute('aria-hidden', 'true');
    const cells: HTMLElement[] = [];
    const chars: string[] = [];
    for (const word of text.split(/(\s+)/)) {
      const wrapper = document.createElement('span');
      wrapper.className = /^\s+$/.test(word) ? 'decode-space' : 'decode-word';
      for (const char of word) {
        const cell = document.createElement('span');
        cell.className = 'decode-cell';
        cell.textContent = char === ' ' ? '\u00a0' : char;
        wrapper.append(cell);
        cells.push(cell);
        chars.push(char);
      }
      visual.append(wrapper);
    }
    element.replaceChildren(stable, visual);
    // Reserve each glyph's actual proportional width, including Cyrillic glyphs.
    for (const cell of cells)
      cell.style.width = `${cell.getBoundingClientRect().width}px`;
    state = { cells, chars };
    prepared.set(element, state);
    return state;
  }
  function run(element: HTMLElement, duration = 760) {
    if (reduced.matches) return;
    const state = prepare(element);
    state.stop?.();
    let elapsed = 0;
    let lastFrame = -1;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_<>/\\[]{}+*';
    state.stop = subscribe((dt) => {
      elapsed += dt * 1000;
      const frame = Math.floor(elapsed / 35);
      if (frame === lastFrame) return;
      lastFrame = frame;
      const progress = elapsed / duration;
      state.cells.forEach((cell, i) => {
        const char = state.chars[i];
        const threshold =
          0.18 + (i / Math.max(1, state.chars.length - 1)) * 0.65;
        const resolved = progress > threshold || /\s/.test(char);
        cell.textContent = resolved
          ? char === ' '
            ? '\u00a0'
            : char
          : alphabet[(frame * 7 + i * 13) % alphabet.length];
        cell.classList.toggle('decode-noise', !resolved);
      });
      if (progress >= 1) {
        state.stop?.();
        state.stop = undefined;
      }
    });
  }
  function refresh() {
    for (const [element, state] of prepared) {
      state.stop?.();
      element.textContent = state.chars.join('');
    }
    prepared.clear();
  }
  function forget(element: HTMLElement) {
    const state = prepared.get(element);
    state?.stop?.();
    prepared.delete(element);
  }
  const onPreference = () => {
    if (reduced.matches) refresh();
  };
  reduced.addEventListener('change', onPreference);
  function dispose() {
    refresh();
    reduced.removeEventListener('change', onPreference);
  }
  return { run, dispose, refresh, forget };
}

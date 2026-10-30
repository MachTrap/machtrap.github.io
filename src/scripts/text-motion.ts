/** Word entrances preserve normal wrapping and expose one stable string to assistive tech. */
export function revealText(element: HTMLElement, reduced: boolean) {
  if (reduced) return;
  const value = element.innerText?.trim() ?? '';
  if (!value) return;
  // A dynamic region may have replaced the old spans; prepare it from its new copy.
  if (!element.querySelector(':scope > .text-visual')) {
    const stable = document.createElement('span');
    stable.className = 'sr-only';
    stable.textContent = value;
    const visual = document.createElement('span');
    visual.className = 'text-visual';
    visual.setAttribute('aria-hidden', 'true');
    value.split(/(\s+)/).forEach((part) => {
      if (/^\s+$/.test(part)) visual.append(document.createTextNode(' '));
      else {
        const word = document.createElement('span');
        word.className = 'text-word';
        word.textContent = part;
        visual.append(word);
      }
    });
    element.replaceChildren(stable, visual);
  }
  const words = [...element.querySelectorAll<HTMLElement>('.text-word')];
  words.forEach((word, i) => {
    word.getAnimations().forEach((a) => a.cancel());
    word.animate(
      [
        {
          opacity: 0,
          transform: 'translateY(.8em) rotateX(-18deg)',
          filter: 'blur(4px)',
        },
        {
          opacity: 1,
          transform: 'translateY(0) rotateX(0)',
          filter: 'blur(0)',
        },
      ],
      {
        duration: 650,
        delay: Math.min(i * 22, 270),
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'backwards',
      },
    );
  });
}

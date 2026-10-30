import {
  architectureGraph,
  connectedNodes,
  type NodeId,
} from '../data/architecture';
import type { Locale } from '../data/site';
export function createArchitecture(root: HTMLElement, locale: Locale) {
  const map = root.querySelector<HTMLElement>('.service-map')!;
  const svg = map.querySelector<SVGSVGElement>('.service-wires')!;
  const layer = svg.querySelector('[data-edges]')!;
  const panel = root.querySelector<HTMLElement>('.node-explanation')!;
  const announcement = root.querySelector<HTMLElement>(
    '[data-node-announcement]',
  )!;
  const buttons = [...map.querySelectorAll<HTMLButtonElement>('[data-node]')];
  const abort = new AbortController(),
    { signal } = abort;
  let graph = architectureGraph(locale, 0),
    pinned: NodeId = 'service',
    preview: NodeId | null = null,
    frame = 0;
  const ns = 'http://www.w3.org/2000/svg';
  const show = (id: NodeId, announce = false) => {
    const node = graph.nodes.find((n) => n.id === id)!;
    const connected = connectedNodes(graph, id);
    buttons.forEach((button) => {
      const own = button.dataset.node as NodeId;
      button.classList.toggle('is-selected', own === id);
      button.classList.toggle('is-related', connected.has(own));
      const receiving = graph.edges.findIndex(
        (edge) => edge.to === own && (edge.from === id || edge.to === id),
      );
      button.classList.toggle('is-receiving', receiving >= 0);
      button.style.setProperty(
        '--receive-delay',
        `${-Math.max(0, receiving) * 0.7}s`,
      );
      button.setAttribute('aria-pressed', String(own === pinned));
      if (own === id)
        button.setAttribute(
          'aria-describedby',
          'architecture-node-description',
        );
      else button.removeAttribute('aria-describedby');
    });
    layer
      .querySelectorAll<SVGGElement>('[data-edge]')
      .forEach((g) =>
        g.classList.toggle(
          'is-highlighted',
          g.dataset.from === id || g.dataset.to === id,
        ),
      );
    panel.querySelector('[data-node-title]')!.textContent =
      `${node.label} · ${node.detail}`;
    panel.querySelector('[data-node-description]')!.textContent =
      node.description;
    panel.querySelector('[data-node-technologies]')!.replaceChildren(
      ...node.technologies.map((t) => {
        const el = document.createElement('span');
        el.textContent = t;
        return el;
      }),
    );
    if (announce)
      announcement.textContent = `${node.label}. ${node.description}`;
  };
  const measure = () => {
    frame = 0;
    const bounds = map.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const mobile = matchMedia('(max-width: 700px)').matches;
    const positions = new Map(
      buttons.map((button) => [
        button.dataset.node,
        button.getBoundingClientRect(),
      ]),
    );
    const paths = graph.edges.map((edge, i) => {
      const a = positions.get(edge.from)!,
        b = positions.get(edge.to)!;
      let d = '';
      if (mobile) {
        const x1 = a.left + a.width / 2 - bounds.left,
          y1 = a.bottom - bounds.top;
        const x2 = b.left + b.width / 2 - bounds.left,
          y2 = b.top - bounds.top;
        const skip = edge.from === 'service' && edge.to === 'data';
        d = skip
          ? `M ${a.right - bounds.left} ${a.top + a.height / 2 - bounds.top} H ${bounds.width - 5} V ${b.top + b.height / 2 - bounds.top} H ${b.right - bounds.left}`
          : `M ${x1} ${y1} V ${(y1 + y2) / 2} H ${x2} V ${y2}`;
      } else if (edge.from === 'worker' && edge.to === 'data') {
        const x1 = a.left + a.width / 2 - bounds.left,
          y1 = a.bottom - bounds.top,
          x2 = b.left + b.width / 2 - bounds.left,
          y2 = b.top - bounds.top;
        d = `M ${x1} ${y1} V ${(y1 + y2) / 2} H ${x2} V ${y2}`;
      } else {
        const x1 = a.right - bounds.left,
          y1 = a.top + a.height / 2 - bounds.top,
          x2 = b.left - bounds.left,
          y2 = b.top + b.height / 2 - bounds.top;
        const mid = (x1 + x2) / 2;
        d = `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`;
      }
      const group = document.createElementNS(ns, 'g');
      group.dataset.edge = String(i);
      group.dataset.from = edge.from;
      group.dataset.to = edge.to;
      if (edge.optional) group.classList.add('is-optional');
      ['edge-halo', 'edge-track', 'edge-signal'].forEach((className) => {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', className);
        if (className === 'edge-track')
          path.setAttribute('marker-end', 'url(#service-arrow)');
        path.style.animationDelay = `${-i * 0.7}s`;
        group.append(path);
      });
      return group;
    });
    layer.replaceChildren(...paths);
    show(preview ?? pinned);
  };
  const queueMeasure = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };
  const chooseScenario = (index: number) => {
    graph = architectureGraph(locale, index);
    announcement.textContent = '';
    preview = null;
    graph.nodes.forEach((node) => {
      const button = buttons.find((b) => b.dataset.node === node.id)!;
      button.querySelector('[data-node-label]')!.textContent = node.label;
      button.querySelector('[data-node-detail]')!.textContent = node.detail;
    });
    show(pinned);
    queueMeasure();
  };
  buttons.forEach((button) => {
    const id = button.dataset.node as NodeId;
    button.addEventListener(
      'pointerenter',
      (e) => {
        if (e.pointerType !== 'touch') {
          preview = id;
          show(id);
        }
      },
      { signal },
    );
    button.addEventListener(
      'pointerleave',
      () => {
        preview = null;
        show(pinned);
      },
      { signal },
    );
    button.addEventListener(
      'focus',
      () => {
        preview = id;
        show(id);
      },
      { signal },
    );
    button.addEventListener(
      'blur',
      () => {
        preview = null;
        show(pinned);
      },
      { signal },
    );
    button.addEventListener(
      'click',
      () => {
        pinned = id;
        preview = null;
        show(id, true);
      },
      { signal },
    );
  });
  const observer = new ResizeObserver(queueMeasure);
  observer.observe(map);
  buttons.forEach((b) => observer.observe(b));
  document.fonts.ready.then(() => {
    if (!signal.aborted) queueMeasure();
  });
  window.addEventListener('resize', queueMeasure, { signal });
  chooseScenario(0);
  return {
    chooseScenario,
    dispose() {
      abort.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
    },
  };
}

/** One retained CPU atlas is reused by both locales and re-uploaded after context restoration. */
export const CODING_COLUMNS = 40;
export const CODING_ROWS = 8;
const documents = [
  [
    'workspace {',
    '  header(title)',
    '  summary(progress)',
    '  cards(tasks)',
    '  navigation(routes)',
    '}',
    '',
    '// interface',
  ],
  [
    'selection {',
    '  open(task)',
    '  detail(task)',
    '  complete(task)',
    '  sync(summary)',
    '}',
    '',
    '// behavior',
  ],
  [
    'transition {',
    '  source(card)',
    '  shared(bounds)',
    '  curve(easeOut)',
    '  settle(workspace)',
    '}',
    '',
    '// polish',
  ],
];
export const codingLabels = {
  en: [
    'Workspace',
    'Overview',
    'Design review',
    'Build interface',
    'Release checks',
    'Project details',
    'In progress',
    'Complete',
    'Today',
    'Components',
    'State',
    'Transition',
    'workspace.view',
    'MOBILE / PREVIEW',
    '2 / 3',
    '3 / 3',
  ],
  ru: [
    'Мои задачи',
    'Обзор',
    'Проверить дизайн',
    'Собрать интерфейс',
    'Проверить релиз',
    'Детали задачи',
    'В работе',
    'Готово',
    'Сегодня',
    'Компоненты',
    'Состояние',
    'Переход',
    'workspace.view',
    'MOBILE / PREVIEW',
    '2 / 3',
    '3 / 3',
  ],
};
export interface CodingAtlas {
  canvas: HTMLCanvasElement;
  code: Uint8Array;
}
let cached: Promise<CodingAtlas> | undefined;
export function getCodingAtlas(): Promise<CodingAtlas> {
  if (cached) return cached;
  cached = (async () => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.allSettled([
          document.fonts.load('22px PlexMono', 'workspace'),
          document.fonts.load('24px Plex', 'Workspace'),
          document.fonts.load('24px Plex', 'Мои задачи'),
        ]),
        new Promise((resolve) => {
          timeout = setTimeout(resolve, 1600);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#fff';
    context.textBaseline = 'alphabetic';
    context.font = '22px PlexMono, monospace';
    for (let i = 0; i < 95; i++)
      context.fillText(
        String.fromCharCode(i + 32),
        (i % 16) * 32 + 2,
        Math.floor(i / 16) * 32 + 25,
      );
    context.font = '24px Plex, sans-serif';
    [...codingLabels.en, ...codingLabels.ru].forEach((label, i) =>
      context.fillText(
        label,
        (i % 4) * 256 + 5,
        192 + Math.floor(i / 4) * 40 + 29,
        246,
      ),
    );
    const code = new Uint8Array(CODING_COLUMNS * CODING_ROWS * 3);
    code.fill(32);
    documents.forEach((lines, group) =>
      lines.forEach((line, row) => {
        [...line].forEach((char, column) => {
          code[(group * CODING_ROWS + row) * CODING_COLUMNS + column] =
            char.charCodeAt(0);
        });
        code[(group * CODING_ROWS + row) * CODING_COLUMNS + 39] = line.length;
      }),
    );
    return { canvas, code };
  })();
  return cached;
}

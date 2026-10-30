import type { Locale } from './site';
export const nodeIds = [
  'client',
  'gateway',
  'service',
  'worker',
  'data',
] as const;
export type NodeId = (typeof nodeIds)[number];
export interface ArchitectureNode {
  id: NodeId;
  label: string;
  detail: string;
  description: string;
  technologies: readonly string[];
}
export interface ArchitectureEdge {
  from: NodeId;
  to: NodeId;
  optional?: boolean;
}
export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
const labels = {
  en: ['Client', 'Gateway', 'Service', 'AI / Worker', 'Storage'],
  ru: ['Клиент', 'Gateway', 'Сервис', 'AI / Worker', 'Хранение'],
};
const details = [
  [
    'Telegram / MAX',
    'Auth · Routes',
    'Tools · Context',
    'Model APIs',
    'PostgreSQL',
  ],
  [
    'iOS / Android',
    'API contracts',
    'Java · Go · TS',
    'Background jobs',
    'PostgreSQL',
  ],
  [
    'Application / Bot',
    'Validate · Queue',
    'Go · TS · Rust',
    'ComfyUI · OpenCV',
    'Jobs · Assets',
  ],
];
const descriptions = {
  en: [
    [
      'A conversation starts in Telegram or MAX. Messages and actions become structured events for the backend.',
      'Verify the webhook, identify the user, and enforce access before routing an event.',
      'Retrieve context, coordinate tool calls, and validate model output before taking action.',
      'Connect a model to explicit application tools and stream the result back through the service.',
      'Keep conversation context and application data in PostgreSQL, behind the service’s access rules.',
    ],
    [
      'The mobile app sends typed requests and receives predictable responses without depending on internal service details.',
      'Validate API contracts and authentication at the boundary, with consistent errors and access checks.',
      'Execute business rules, coordinate transactions, and keep domain logic separate from transport.',
      'Move optional long-running work off the request path; process jobs with safe retries.',
      'Model relational data and commit changes transactionally, with indexes and queries suited to the application.',
    ],
    [
      'An app or bot submits a media task and can continue working while processing runs.',
      'Validate the input and enqueue a job; return an identifier for tracking progress.',
      'Coordinate job state, choose a workflow, and deliver progress or results to the client.',
      'Run ComfyUI custom nodes and OpenCV processing as an isolated worker workflow.',
      'Store job metadata and result references so progress and output can be retrieved later.',
    ],
  ],
  ru: [
    [
      'Диалог начинается в Telegram или MAX. Сообщения и действия превращаются в структурированные события для backend.',
      'Проверка webhook, идентификация пользователя и прав доступа перед маршрутизацией события.',
      'Поиск контекста, координация tool calls и проверка ответа модели до выполнения действий.',
      'Подключение модели к конкретным функциям приложения и потоковый ответ через сервис.',
      'Контекст диалога и данные приложения в PostgreSQL, с проверкой прав на уровне сервиса.',
    ],
    [
      'Приложение отправляет типизированные запросы и получает предсказуемые ответы, не завися от внутреннего устройства сервиса.',
      'Валидация API-контрактов и авторизация на входе, единые ошибки и проверка доступа.',
      'Бизнес-правила, транзакции и отделение логики приложения от протокола передачи данных.',
      'Долгие задачи выполняются вне основного запроса; для фоновых задач предусмотрены безопасные повторы.',
      'Реляционная модель данных, транзакции, индексы и запросы под задачи приложения.',
    ],
    [
      'Приложение или бот отправляет медиазадачу и продолжает работать, пока идёт обработка.',
      'Проверка входных данных, очередь задач и идентификатор для отслеживания прогресса.',
      'Управление состоянием задачи, выбор workflow и доставка прогресса или результата клиенту.',
      'Custom nodes в ComfyUI и обработка OpenCV в отдельном worker-процессе.',
      'Метаданные задач и ссылки на результаты позволяют получить прогресс и готовые материалы позже.',
    ],
  ],
};
const technologies = [
  [
    ['Telegram', 'MAX'],
    ['Webhooks', 'OAuth 2.0 / OIDC'],
    ['Tool calling', 'Context retrieval'],
    ['Model APIs', 'Streaming'],
    ['PostgreSQL', 'Access control'],
  ],
  [
    ['Swift / React Native', 'REST'],
    ['OpenAPI / Swagger', 'OAuth 2.0 / OIDC'],
    ['Java / Go / TS', 'GraphQL / gRPC'],
    ['Queues', 'Retries'],
    ['PostgreSQL', 'Transactions'],
  ],
  [
    ['Application APIs', 'Webhooks'],
    ['Validation', 'Job queue'],
    ['Go / TS / Rust', 'Job state'],
    ['ComfyUI / Python', 'OpenCV', 'Custom nodes'],
    ['PostgreSQL', 'Result references'],
  ],
];
export function architectureGraph(
  locale: Locale,
  scenario: number,
): ArchitectureGraph {
  const index = Math.max(0, Math.min(2, scenario));
  return {
    nodes: nodeIds.map((id, i) => ({
      id,
      label:
        i === 3
          ? index === 0
            ? 'Model / Tools'
            : 'Worker'
          : labels[locale][i],
      detail: details[index][i],
      description: descriptions[locale][index][i],
      technologies: technologies[index][i],
    })),
    edges:
      index === 2
        ? [
            { from: 'client', to: 'gateway' },
            { from: 'gateway', to: 'service' },
            { from: 'service', to: 'worker' },
            { from: 'worker', to: 'data' },
          ]
        : [
            { from: 'client', to: 'gateway' },
            { from: 'gateway', to: 'service' },
            { from: 'service', to: 'worker', optional: index === 1 },
            { from: 'service', to: 'data' },
          ],
  };
}
export function connectedNodes(graph: ArchitectureGraph, id: NodeId) {
  return new Set([
    id,
    ...graph.edges
      .filter((e) => e.from === id || e.to === id)
      .flatMap((e) => [e.from, e.to]),
  ]);
}

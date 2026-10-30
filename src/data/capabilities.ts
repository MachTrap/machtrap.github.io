import type { Locale } from './site';
export const capabilityIds = ['mobile', 'systems', 'craft'] as const;
export const capabilityCopy = {
  en: {
    mobileLabel: 'MOBILE APPLICATIONS',
    mobileTitle: 'Native iOS.\nReact Native.',
    mobileIntro:
      'I develop native iOS and cross-platform applications, from the first screen to the App Store. I also integrate AI into apps: assistants, content generation, and image processing.',
    mobileModes: ['Native iOS', 'React Native'],
    nativeText:
      'SwiftUI for new interfaces, UIKit for precise control, and Objective-C for existing codebases. Native APIs, structured concurrency, and responsive interfaces on every screen.',
    reactText:
      'Shared application logic and interfaces across iOS and Android, with native modules where the platform needs its own approach.',
    specialtyTitle: 'IOS TOOLKIT',
    specialtyTabs: [
      'Swift & architecture',
      'Platform capabilities',
      'Data & networking',
    ],
    specialtyRows: [
      [
        'Swift Concurrency, async/await, actors',
        'Dependency injection, protocol-oriented programming',
        'Swift Package Manager (SPM), CocoaPods',
      ],
      [
        'APNs / push notifications, background tasks',
        'WidgetKit, Live Activities, App Intents',
        'Deep linking, Universal Links, StoreKit / subscriptions',
      ],
      [
        'Core Data, SwiftData, SQLite, Realm',
        'URLSession, REST, WebSockets',
        'Offline synchronization, caching',
      ],
    ],
    apiSkills: [
      'OpenAPI / Swagger',
      'GraphQL / gRPC',
      'Webhooks',
      'OAuth 2.0 / OIDC',
    ],
    systemTechnologies: ['Java', 'Go', 'TypeScript', 'Rust', 'PostgreSQL'],
    systemsLabel: 'BOTS & BACKEND',
    systemsTitle: 'Beyond applications.',
    systemsIntro:
      'Telegram & MAX bots. Backend for your applications and services. AI integration that connects models to useful actions.',
    mobileFoundation:
      'Algorithms and data structures for responsive apps. Networking, secure storage, OAuth, and AppSec for the data they handle.',
    mobileFoundationLabel: 'Under the interface',
    additionalLabel: 'Additional skills',
    mobileAdditional: [
      'Algorithms & data structures',
      'AppSec / Keychain',
      'Reverse engineering',
      'Performance profiling',
    ],
    systemsModes: ['AI assistant', 'Application API', 'Media workflow'],
    scenarios: [
      {
        title: 'An assistant that can act.',
        description:
          'A Telegram or MAX bot connects a conversation to application tools. Validate tool calls, check access, retrieve context, and stream a useful response.',
        tags: ['Webhooks', 'OAuth 2.0 / OIDC', 'Model APIs', 'Tool calling'],
      },
      {
        title: 'The backend behind the app.',
        description:
          'Typed API contracts, authorization, business logic, and PostgreSQL. A clear request lifecycle, with transactions, safe retries, and observable failures.',
        tags: [
          'OpenAPI / Swagger',
          'GraphQL / gRPC',
          'PostgreSQL',
          'REST / WebSockets',
        ],
      },
      {
        title: 'AI workflows, connected.',
        description:
          'Connect an app or bot to ComfyUI and image-processing pipelines. Queue a job, run custom nodes, track progress, and return the result without blocking the interface.',
        tags: [
          'ComfyUI / Python',
          'Custom nodes',
          'Diffusion workflows',
          'OpenCV',
        ],
      },
    ],
    nodeLabels: ['Client', 'Gateway', 'Service', 'AI / Worker', 'PostgreSQL'],
    infrastructure: [
      [
        'AI integration',
        'Generative-model APIs, tool calling, custom ComfyUI nodes, and diffusion workflows. OpenCV for image-processing pipelines.',
      ],
      [
        'Services & environments',
        'Java, Go, TypeScript, and Rust. Docker / Docker Compose, Linux, and Nginx for reproducible service environments.',
      ],
      [
        'Reliability & security',
        'Algorithms & data structures, networking / OSI, AppSec, OAuth 2.0 / OIDC, and careful validation at service boundaries.',
      ],
    ],
    demoLabel: 'CODE → APPLICATION',
    craftLabel: 'DESIGN → DEVELOPMENT → RELEASE',
    craftTitle: 'Full development cycle.',
    craftIntro: 'From UX/UI design to release.',
    stages: ['Design', 'Architecture', 'Verification', 'Delivery'],
    stageTitles: [
      'Make the interaction clear.',
      'Give complexity a structure.',
      'Test what users actually do.',
      'Make releases repeatable.',
    ],
    stageText: [
      'Use Figma to explore interface structure, flows, and interaction details before those decisions become code.',
      'Apply MVVM, VIPER, modular boundaries, and clear data contracts to keep interface, domain, and platform responsibilities understandable.',
      'Native testing with XCTest, Swift Testing, XCUITest and snapshots. Instruments and memory debugging support performance work; VoiceOver, accessibility and localization are part of interface quality. Selenium and Playwright cover browser flows.',
      'GitHub Actions and TeamCity for CI/CD; Fastlane, TestFlight and App Store Connect for distribution. Code signing and provisioning, release automation, and reproducible Docker / Docker Compose services on Linux with Nginx.',
    ],
    stageTools: [
      ['Figma', 'Interaction design', 'Prototyping'],
      ['MVVM', 'VIPER', 'Modularization', 'Clean Architecture'],
      [
        'XCTest / Swift Testing',
        'XCUITest / snapshots',
        'Instruments / memory debugging',
        'VoiceOver / localization',
        'Selenium / Playwright',
      ],
      [
        'GitHub Actions / TeamCity',
        'Fastlane / TestFlight',
        'App Store Connect',
        'Code signing / provisioning',
        'Linux / Nginx',
        'Docker / Docker Compose',
      ],
    ],
  },
  ru: {
    mobileLabel: 'МОБИЛЬНЫЕ ПРИЛОЖЕНИЯ',
    mobileTitle: 'iOS.\nReact Native.',
    mobileIntro:
      'Разрабатываю нативные iOS- и кроссплатформенные приложения — от первого экрана до публикации. Интегрирую AI: ассистентов, генерацию контента и обработку изображений.',
    mobileModes: ['iOS', 'React Native'],
    nativeText:
      'SwiftUI для новых интерфейсов, UIKit для точного контроля, Objective-C для работы с существующим кодом. Нативные API, Swift Concurrency и адаптивные экраны.',
    reactText:
      'Общая логика и интерфейсы для iOS и Android. Нативные модули там, где платформе нужен собственный подход.',
    specialtyTitle: 'ИНСТРУМЕНТЫ IOS',
    specialtyTabs: ['Swift & Architecture', 'iOS SDK', 'Data & Networking'],
    specialtyRows: [
      [
        'Swift Concurrency, async/await, actors',
        'Dependency injection, protocol-oriented programming',
        'Swift Package Manager (SPM), CocoaPods',
      ],
      [
        'APNs / push-уведомления, фоновые задачи',
        'WidgetKit, Live Activities, App Intents',
        'Deep linking, Universal Links, StoreKit / подписки',
      ],
      [
        'Core Data, SwiftData, SQLite, Realm',
        'URLSession, REST, WebSockets',
        'Офлайн-синхронизация, кэширование',
      ],
    ],
    apiSkills: [
      'OpenAPI / Swagger',
      'GraphQL / gRPC',
      'Webhooks',
      'OAuth 2.0 / OIDC',
    ],
    systemTechnologies: ['Java', 'Go', 'TypeScript', 'Rust', 'PostgreSQL'],
    systemsLabel: 'БОТЫ И БЭКЕНД',
    systemsTitle: 'За пределами приложений.',
    systemsIntro:
      'Боты Telegram и MAX. Backend для ваших приложений и сервисов. Интеграция AI — от работы с моделями до выполнения задач.',
    mobileFoundation:
      'Алгоритмы и структуры данных — для отзывчивых приложений. Networking, безопасное хранение, OAuth и AppSec — для работы с данными.',
    mobileFoundationLabel: 'За интерфейсом',
    additionalLabel: 'Дополнительные навыки',
    mobileAdditional: [
      'Алгоритмы и структуры данных',
      'AppSec / Keychain',
      'Reverse engineering',
      'Performance profiling',
    ],
    systemsModes: ['AI-ассистент', 'API приложения', 'Медиапайплайн'],
    scenarios: [
      {
        title: 'Ассистент, который умеет действовать.',
        description:
          'Бот в Telegram или MAX связывает диалог с функциями приложения. Проверка вызовов инструментов и прав доступа, поиск контекста и потоковый ответ.',
        tags: ['Webhooks', 'OAuth 2.0 / OIDC', 'Model APIs', 'Tool calling'],
      },
      {
        title: 'Backend вашего приложения.',
        description:
          'API-контракты, авторизация, бизнес-логика и PostgreSQL. Понятный путь запроса: транзакции, безопасные повторы и обработка ошибок.',
        tags: [
          'OpenAPI / Swagger',
          'GraphQL / gRPC',
          'PostgreSQL',
          'REST / WebSockets',
        ],
      },
      {
        title: 'AI-пайплайны в приложении.',
        description:
          'Подключение ComfyUI и обработки изображений к приложению или боту. Очередь задач, custom nodes, отслеживание прогресса и результат без блокировки интерфейса.',
        tags: [
          'ComfyUI / Python',
          'Custom nodes',
          'Diffusion workflows',
          'OpenCV',
        ],
      },
    ],
    nodeLabels: ['Клиент', 'Gateway', 'Сервис', 'AI / Worker', 'PostgreSQL'],
    infrastructure: [
      [
        'Интеграция AI',
        'API генеративных моделей, tool calling, custom nodes в ComfyUI и diffusion workflows. OpenCV для обработки изображений.',
      ],
      [
        'Сервисы и окружение',
        'Java, Go, TypeScript и Rust. Docker / Docker Compose, Linux и Nginx для воспроизводимого окружения сервисов.',
      ],
      [
        'Надёжность и безопасность',
        'Алгоритмы и структуры данных, networking / OSI, AppSec, OAuth 2.0 / OIDC и валидация на границах сервисов.',
      ],
    ],
    demoLabel: 'CODE → APPLICATION',
    craftLabel: 'DESIGN → DEVELOPMENT → RELEASE',
    craftTitle: 'Полный цикл разработки.',
    craftIntro: 'От UX/UI-дизайна до релиза.',
    stages: ['Дизайн', 'Архитектура', 'Тестирование', 'Релиз'],
    stageTitles: [
      'Сделать взаимодействие ясным.',
      'Придать сложности структуру.',
      'Проверить реальные действия.',
      'Сделать релизы повторяемыми.',
    ],
    stageText: [
      'Исследую структуру интерфейса, пользовательские сценарии и детали взаимодействия в Figma до того, как решения превратятся в код.',
      'Использую MVVM, VIPER, границы модулей и понятные контракты данных, чтобы разделять ответственность интерфейса, предметной области и платформы.',
      'Нативные проверки: XCTest, Swift Testing, XCUITest и snapshot-тесты. Instruments и отладка памяти помогают с производительностью; VoiceOver, доступность и локализация — с качеством интерфейса. Для браузерных сценариев — Selenium и Playwright.',
      'GitHub Actions и TeamCity для CI/CD; Fastlane, TestFlight и App Store Connect для публикации. Подпись кода и provisioning, автоматизация релизов и воспроизводимые сервисы Docker / Docker Compose на Linux с Nginx.',
    ],
    stageTools: [
      ['Figma', 'Interaction design', 'Prototyping'],
      ['MVVM', 'VIPER', 'Modularization', 'Clean Architecture'],
      [
        'XCTest / Swift Testing',
        'XCUITest / snapshots',
        'Instruments / memory debugging',
        'VoiceOver / localization',
        'Selenium / Playwright',
      ],
      [
        'GitHub Actions / TeamCity',
        'Fastlane / TestFlight',
        'App Store Connect',
        'Code signing / provisioning',
        'Linux / Nginx',
        'Docker / Docker Compose',
      ],
    ],
  },
};
export const capabilityData = (locale: Locale) => capabilityCopy[locale];

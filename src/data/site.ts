export type Locale = 'en' | 'ru';
export const theme = {
  background: '#0B0C0B',
  foreground: '#E7E6D9',
  accent: '#9AF3C5',
  muted: '#A4A69C',
};
export const links = {
  github: 'https://github.com/MachTrap',
  linkedin: 'https://www.linkedin.com/in/iosartdev',
  email: 'glookerg@gmail.com',
  telegram: 'https://t.me/lucky117',
};
export const home = (lang: Locale) => (lang === 'en' ? '/' : '/ru/');
export const copy = {
  en: {
    skills: 'Skills',
    connect: 'Connect',
    applicationCta: 'I want an application',
    hireCta: 'Hire me',
    applicationTitle: 'Let’s build your application.',
    hireTitle: 'Let’s work together.',
    contactDescription: 'Choose where to start the conversation.',
    professionalContact: 'Professional profile',
    menu: 'Menu',
    close: 'Close',
    language: 'Switch to Russian',
    skip: 'Skip to content',
    title: 'machtrap — mobile engineering in motion',
    description:
      'Senior software engineer focused on mobile development. Native iOS, React Native, bots, backend, and AI integration.',
    introLabel: '// SOFTWARE DEVELOPMENT',
    heroTitle: 'I build\napplications.',
    heroDescription:
      'Mobile applications, bots, backend. Built with care, from idea to release.',
    interactionHint: 'Touch, drag, or scroll',
    scroll: 'SCROLL TO EXPLORE',
    homeLabel: 'Home',
    external: 'opens in a new tab',
  },
  ru: {
    skills: 'Навыки',
    connect: 'Связаться',
    applicationCta: 'Хочу приложение',
    hireCta: 'Нанять меня',
    applicationTitle: 'Обсудим ваше приложение.',
    hireTitle: 'Давайте работать вместе.',
    contactDescription: 'Выберите, где начать разговор.',
    professionalContact: 'Профессиональный профиль',
    menu: 'Меню',
    close: 'Закрыть',
    language: 'Switch to English',
    skip: 'Перейти к содержимому',
    title: 'machtrap — мобильная разработка в движении',
    description:
      'Senior Software Engineer. iOS, React Native, боты, backend и интеграция AI.',
    introLabel: '// РАЗРАБОТКА ПО',
    heroTitle: 'Разрабатываю\nприложения.',
    heroDescription:
      'Мобильные приложения, боты, backend. От идеи до работающего продукта.',
    interactionHint: 'Коснитесь, потяните или прокрутите',
    scroll: 'ЛИСТАЙТЕ ДАЛЬШЕ',
    homeLabel: 'Главная',
    external: 'откроется в новой вкладке',
  },
};

import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Главная',
  'nav.solutions': 'Решения',
  'nav.tools': 'Инструменты',
  'nav.industries': 'Отрасли',
  'nav.platform': 'Платформа',
  'nav.materials': 'Материалы',
  'nav.resources': 'Ресурсы',
  'nav.dashboards': 'Панели',
  'nav.providerConsole': 'Консоль поставщика',
  'nav.providerStorefront': 'Витрина и объявления',
  'nav.enterpriseAnalytics': 'Аналитика предприятия',
  'nav.businessFronts': 'Бизнес-витрины',
  'nav.geoMatching': 'Геосопоставление',
  'nav.communications': 'Коммуникации',
  'nav.login': 'Войти',
  'nav.register': 'Регистрация',
  'nav.getStarted': 'Начать',
  'nav.languageSelector': 'Язык'
};

export const ruRU = {
  metadata: {
    ...enGB.metadata,
    id: 'ru-RU',
    name: 'Русский (Россия)',
    htmlLang: 'ru-RU',
    direction: 'ltr',
    currency: 'RUB',
    numberLocale: 'ru-RU',
    dateLocale: 'ru-RU'
  },
  messages
};

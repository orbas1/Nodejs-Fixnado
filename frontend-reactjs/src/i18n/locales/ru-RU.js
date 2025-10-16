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
  'nav.languageSelector': 'Язык',

  'errors.unexpected.title': 'Критический инцидент',
  'errors.unexpected.headline': 'Во время загрузки произошла ошибка.',
  'errors.unexpected.inlineHeadline': 'Не удалось загрузить этот раздел',
  'errors.unexpected.inlineDescription': 'Обновите страницу или попробуйте позже; мы уже разбираемся с проблемой.',
  'errors.unexpected.description':
    'При загрузке рабочей области возникла ошибка. Мы зафиксировали инцидент и уведомили инженерную команду.',
  'errors.unexpected.reference': 'Идентификатор ссылки',
  'errors.unexpected.actions.retry': 'Перезагрузить Fixnado',
  'errors.unexpected.actions.contactSupport': 'Написать в поддержку',
  'errors.unexpected.actions.statusPage': 'Открыть страницу статуса',
  'errors.unexpected.actions.copyDetails': 'Скопировать диагностику',
  'errors.unexpected.actions.copied': 'Диагностика скопирована',
  'errors.unexpected.detailsToggle': 'Показать технические детали',

  'notFound.code': '404 — Страница не найдена',
  'notFound.title': 'Мы не смогли найти эту страницу.',
  'notFound.description': 'Адрес {path} недоступен или был перемещён.',
  'notFound.reference': 'Код отслеживания',
  'notFound.actions.dashboard': 'Открыть панели',
  'notFound.actions.supportCentre': 'Перейти в центр коммуникаций',
  'notFound.actions.home': 'Вернуться на главную',
  'notFound.actions.explore': 'Просмотреть услуги',
  'notFound.secondary.title': 'Нужно что-то ещё?',
  'notFound.secondary.description': 'Ознакомьтесь с юридическими документами или напишите на {email}, чтобы получить помощь.',
  'notFound.secondary.privacy': 'Политика конфиденциальности',
  'notFound.secondary.terms': 'Условия обслуживания',
  'notFound.secondary.contact': 'Связаться с поддержкой',
  'notFound.auditTrail.title': 'Что мы зафиксировали',
  'notFound.auditTrail.copy':
    'Мы записали этот сбой в журнал аудита. Передайте код службе поддержки, чтобы ускорить проверку.'
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

import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Strona główna',
  'nav.menu.search': 'Szukaj',
  'nav.solutions': 'Rozwiązania',
  'nav.tools': 'Narzędzia',
  'nav.industries': 'Branże',
  'nav.platform': 'Platforma',
  'nav.materials': 'Materiały',
  'nav.resources': 'Zasoby',
  'nav.dashboards': 'Panele',
  'nav.providerConsole': 'Konsola dostawcy',
  'nav.providerStorefront': 'Witryna i ogłoszenia',
  'nav.enterpriseAnalytics': 'Analityka enterprise',
  'nav.businessFronts': 'Fronty biznesowe',
  'nav.geoMatching': 'Dopasowanie geograficzne',
  'nav.communications': 'Komunikacja',
  'nav.login': 'Zaloguj się',
  'nav.register': 'Zarejestruj się',
  'nav.providerRegister': 'Dostawca',
  'nav.getStarted': 'Zacznij',
  'nav.languageSelector': 'Język',

  'errors.unexpected.title': 'Incydent krytyczny',
  'errors.unexpected.headline': 'W trakcie ładowania wystąpił problem.',
  'errors.unexpected.inlineHeadline': 'Nie udało się załadować tej sekcji',
  'errors.unexpected.inlineDescription': 'Odśwież widok lub spróbuj ponownie później; nasz zespół już analizuje sytuację.',
  'errors.unexpected.description':
    'Podczas ładowania przestrzeni roboczej wystąpił błąd. Zdarzenie zostało zapisane, a zespół inżynierów otrzymał powiadomienie.',
  'errors.unexpected.reference': 'Identyfikator referencyjny',
  'errors.unexpected.actions.retry': 'Przeładuj Fixnado',
  'errors.unexpected.actions.contactSupport': 'Napisz do wsparcia',
  'errors.unexpected.actions.statusPage': 'Zobacz stronę statusu',
  'errors.unexpected.actions.copyDetails': 'Skopiuj diagnostykę',
  'errors.unexpected.actions.copied': 'Diagnostyka skopiowana',
  'errors.unexpected.detailsToggle': 'Pokaż szczegóły techniczne',

  'notFound.code': '404 — Nie znaleziono strony',
  'notFound.title': 'Nie możemy znaleźć tej strony.',
  'notFound.description': 'Adres {path} jest niedostępny lub został przeniesiony.',
  'notFound.reference': 'Kod śledzenia',
  'notFound.actions.dashboard': 'Otwórz pulpity',
  'notFound.actions.supportCentre': 'Przejdź do centrum komunikacji',
  'notFound.actions.home': 'Wróć na stronę główną',
  'notFound.actions.explore': 'Przeglądaj usługi',
  'notFound.secondary.title': 'Potrzebujesz czegoś więcej?',
  'notFound.secondary.description': 'Sprawdź dokumenty prawne lub napisz na {email}, aby uzyskać pomoc.',
  'notFound.secondary.privacy': 'Polityka prywatności',
  'notFound.secondary.terms': 'Regulamin',
  'notFound.secondary.contact': 'Kontakt ze wsparciem',
  'notFound.auditTrail.title': 'Co zapisaliśmy',
  'notFound.auditTrail.copy':
    'Zarejestrowaliśmy to zdarzenie w dzienniku audytu. Przekaż kod wsparciu, aby przyspieszyć diagnozę.'
};

export const plPL = {
  metadata: {
    ...enGB.metadata,
    id: 'pl-PL',
    name: 'Polski',
    htmlLang: 'pl-PL',
    direction: 'ltr',
    currency: 'PLN',
    numberLocale: 'pl-PL',
    dateLocale: 'pl-PL'
  },
  messages
};

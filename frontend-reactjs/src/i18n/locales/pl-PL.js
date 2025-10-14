import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Strona główna',
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
  'nav.getStarted': 'Zacznij',
  'nav.languageSelector': 'Język'
};

export const plPL = {
  metadata: {
    ...enGB.metadata,
    id: 'pl-PL',
    name: 'Polski (Polska)',
    htmlLang: 'pl-PL',
    direction: 'ltr',
    currency: 'PLN',
    numberLocale: 'pl-PL',
    dateLocale: 'pl-PL'
  },
  messages
};

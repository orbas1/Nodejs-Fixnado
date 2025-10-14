import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Startseite',
  'nav.solutions': 'Lösungen',
  'nav.tools': 'Werkzeuge',
  'nav.industries': 'Branchen',
  'nav.platform': 'Plattform',
  'nav.materials': 'Materialien',
  'nav.resources': 'Ressourcen',
  'nav.dashboards': 'Dashboards',
  'nav.providerConsole': 'Anbieter-Konsole',
  'nav.providerStorefront': 'Schaufenster & Anzeigen',
  'nav.enterpriseAnalytics': 'Enterprise-Analysen',
  'nav.businessFronts': 'Business-Fronts',
  'nav.geoMatching': 'Geo-Matching',
  'nav.communications': 'Kommunikation',
  'nav.login': 'Anmelden',
  'nav.register': 'Registrieren',
  'nav.getStarted': 'Loslegen',
  'nav.languageSelector': 'Sprache'
};

export const deDE = {
  metadata: {
    ...enGB.metadata,
    id: 'de-DE',
    name: 'Deutsch (Deutschland)',
    htmlLang: 'de-DE',
    direction: 'ltr',
    currency: 'EUR',
    numberLocale: 'de-DE',
    dateLocale: 'de-DE'
  },
  messages
};

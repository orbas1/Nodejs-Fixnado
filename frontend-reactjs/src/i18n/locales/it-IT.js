import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Home',
  'nav.solutions': 'Soluzioni',
  'nav.tools': 'Strumenti',
  'nav.industries': 'Settori',
  'nav.platform': 'Piattaforma',
  'nav.materials': 'Materiali',
  'nav.resources': 'Risorse',
  'nav.dashboards': 'Dashboard',
  'nav.providerConsole': 'Console fornitori',
  'nav.providerStorefront': 'Vetrina e annunci',
  'nav.enterpriseAnalytics': 'Analisi enterprise',
  'nav.businessFronts': 'Vetrine business',
  'nav.geoMatching': 'Geolocalizzazione',
  'nav.communications': 'Comunicazioni',
  'nav.login': 'Accedi',
  'nav.register': 'Registrati',
  'nav.getStarted': 'Inizia',
  'nav.languageSelector': 'Lingua'
};

export const itIT = {
  metadata: {
    ...enGB.metadata,
    id: 'it-IT',
    name: 'Italiano (Italia)',
    htmlLang: 'it-IT',
    direction: 'ltr',
    currency: 'EUR',
    numberLocale: 'it-IT',
    dateLocale: 'it-IT'
  },
  messages
};

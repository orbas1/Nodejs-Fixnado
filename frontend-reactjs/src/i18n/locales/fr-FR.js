import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Accueil',
  'nav.solutions': 'Solutions',
  'nav.tools': 'Outils',
  'nav.industries': 'Secteurs',
  'nav.platform': 'Plateforme',
  'nav.materials': 'Matériaux',
  'nav.resources': 'Ressources',
  'nav.dashboards': 'Tableaux de bord',
  'nav.providerConsole': 'Console fournisseurs',
  'nav.providerStorefront': 'Vitrine & annonces',
  'nav.enterpriseAnalytics': 'Analytique entreprise',
  'nav.businessFronts': 'Vitrines',
  'nav.geoMatching': 'Appariement géographique',
  'nav.communications': 'Communications',
  'nav.login': 'Se connecter',
  'nav.register': "S'inscrire",
  'nav.getStarted': 'Commencer',
  'nav.languageSelector': 'Langue'
};

export const frFR = {
  metadata: {
    ...enGB.metadata,
    id: 'fr-FR',
    name: 'Français (France)',
    htmlLang: 'fr-FR',
    direction: 'ltr',
    currency: 'EUR',
    numberLocale: 'fr-FR',
    dateLocale: 'fr-FR'
  },
  messages
};

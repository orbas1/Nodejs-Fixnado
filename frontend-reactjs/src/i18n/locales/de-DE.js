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
  'nav.languageSelector': 'Sprache',

  'errors.unexpected.title': 'Kritischer Vorfall',
  'errors.unexpected.headline': 'Uns ist mitten im Vorgang ein Fehler passiert.',
  'errors.unexpected.inlineHeadline': 'Dieser Bereich konnte nicht geladen werden',
  'errors.unexpected.inlineDescription': 'Aktualisieren Sie die Ansicht. Wir analysieren den Vorfall bereits.',
  'errors.unexpected.description':
    'Beim Laden des Arbeitsbereichs ist ein Fehler aufgetreten. Wir haben den Vorfall protokolliert und das Engineering-Team informiert.',
  'errors.unexpected.reference': 'Referenz-ID',
  'errors.unexpected.actions.retry': 'Fixnado neu laden',
  'errors.unexpected.actions.contactSupport': 'Support per E-Mail',
  'errors.unexpected.actions.statusPage': 'Statusseite öffnen',
  'errors.unexpected.actions.copyDetails': 'Diagnosedaten kopieren',
  'errors.unexpected.actions.copied': 'Diagnosedaten kopiert',
  'errors.unexpected.detailsToggle': 'Technische Details anzeigen',

  'notFound.code': '404 — Seite nicht gefunden',
  'notFound.title': 'Diese Seite konnten wir nicht finden.',
  'notFound.description': 'Die Adresse {path} ist nicht verfügbar oder wurde verschoben.',
  'notFound.reference': 'Tracking-Code',
  'notFound.actions.dashboard': 'Dashboards öffnen',
  'notFound.actions.supportCentre': 'Zum Kommunikationsbereich',
  'notFound.actions.home': 'Zur Startseite',
  'notFound.actions.explore': 'Services entdecken',
  'notFound.secondary.title': 'Weitere Optionen',
  'notFound.secondary.description': 'Prüfen Sie unsere Richtlinien oder schreiben Sie {email} für Unterstützung.',
  'notFound.secondary.privacy': 'Datenschutzerklärung',
  'notFound.secondary.terms': 'Nutzungsbedingungen',
  'notFound.secondary.contact': 'Support kontaktieren',
  'notFound.auditTrail.title': 'Was wir protokolliert haben',
  'notFound.auditTrail.copy':
    'Wir haben dieses Ereignis im Audit-Trail erfasst. Teilen Sie den Tracking-Code mit dem Support, damit wir schneller helfen können.'
};

export const deDE = {
  metadata: {
    ...enGB.metadata,
    id: 'de-DE',
    name: 'Deutsch (Deutschland)',
    language: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    htmlLang: 'de-DE',
    direction: 'ltr',
    currency: 'EUR',
    numberLocale: 'de-DE',
    dateLocale: 'de-DE'
  },
  messages
};

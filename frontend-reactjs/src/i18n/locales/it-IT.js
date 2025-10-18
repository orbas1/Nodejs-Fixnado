import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Home',
  'nav.menu.search': 'Cerca',
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
  'nav.providerRegister': 'Fornitore',
  'nav.getStarted': 'Inizia',
  'nav.languageSelector': 'Lingua',

  'errors.unexpected.title': 'Incidente critico',
  'errors.unexpected.headline': 'Si è verificato un problema durante il caricamento.',
  'errors.unexpected.inlineHeadline': 'Impossibile caricare questa sezione',
  'errors.unexpected.inlineDescription': 'Aggiorna la vista o riprova più tardi; il nostro team sta già analizzando l’incidente.',
  'errors.unexpected.description':
    "Si è verificato un errore durante il caricamento dell'area di lavoro. L'incidente è stato registrato e il team di ingegneria è stato avvisato.",
  'errors.unexpected.reference': 'ID di riferimento',
  'errors.unexpected.actions.retry': 'Ricarica Fixnado',
  'errors.unexpected.actions.contactSupport': 'Contatta il supporto',
  'errors.unexpected.actions.statusPage': 'Apri la pagina di stato',
  'errors.unexpected.actions.copyDetails': 'Copia diagnostica',
  'errors.unexpected.actions.copied': 'Diagnostica copiata',
  'errors.unexpected.detailsToggle': 'Mostra dettagli tecnici',

  'notFound.code': '404 — Pagina non trovata',
  'notFound.title': 'Non riusciamo a trovare questa pagina.',
  'notFound.description': 'L’indirizzo {path} non è disponibile o è stato spostato.',
  'notFound.reference': 'Codice di tracciamento',
  'notFound.actions.dashboard': 'Apri dashboard',
  'notFound.actions.supportCentre': 'Vai al centro comunicazioni',
  'notFound.actions.home': 'Torna alla home',
  'notFound.actions.explore': 'Esplora i servizi',
  'notFound.secondary.title': 'Serve altro?',
  'notFound.secondary.description': 'Consulta la documentazione legale o scrivi a {email} per ricevere assistenza.',
  'notFound.secondary.privacy': 'Informativa privacy',
  'notFound.secondary.terms': 'Termini di servizio',
  'notFound.secondary.contact': 'Contatta il supporto',
  'notFound.auditTrail.title': 'Cosa abbiamo registrato',
  'notFound.auditTrail.copy':
    'Abbiamo registrato questo accesso errato nel registro di audit. Condividi il codice con il supporto per velocizzare le verifiche.'
};

export const itIT = {
  metadata: {
    ...enGB.metadata,
    id: 'it-IT',
    name: 'Italiano',
    htmlLang: 'it-IT',
    direction: 'ltr',
    currency: 'EUR',
    numberLocale: 'it-IT',
    dateLocale: 'it-IT'
  },
  messages
};

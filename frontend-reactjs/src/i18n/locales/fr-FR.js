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
  'nav.languageSelector': 'Langue',

  'errors.unexpected.title': 'Incident critique',
  'errors.unexpected.headline': 'Un incident est survenu en plein chargement.',
  'errors.unexpected.inlineHeadline': 'Cette section n’a pas pu être chargée',
  'errors.unexpected.inlineDescription': 'Actualisez la vue ou réessayez plus tard ; nos équipes analysent déjà l’incident.',
  'errors.unexpected.description':
    'Une erreur s’est produite lors du chargement de l’espace de travail. L’incident a été journalisé et notre équipe d’ingénierie a été alertée.',
  'errors.unexpected.reference': 'Identifiant de référence',
  'errors.unexpected.actions.retry': 'Recharger Fixnado',
  'errors.unexpected.actions.contactSupport': 'Contacter le support',
  'errors.unexpected.actions.statusPage': 'Consulter la page d’état',
  'errors.unexpected.actions.copyDetails': 'Copier les diagnostics',
  'errors.unexpected.actions.copied': 'Diagnostics copiés',
  'errors.unexpected.detailsToggle': 'Afficher les détails techniques',

  'notFound.code': '404 — Page introuvable',
  'notFound.title': 'Nous n’avons pas trouvé cette page.',
  'notFound.description': 'L’adresse {path} n’est plus disponible ou a été déplacée.',
  'notFound.reference': 'Code de suivi',
  'notFound.actions.dashboard': 'Ouvrir les tableaux de bord',
  'notFound.actions.supportCentre': 'Accéder au centre de communications',
  'notFound.actions.home': 'Retourner à l’accueil',
  'notFound.actions.explore': 'Explorer les services',
  'notFound.secondary.title': 'Besoin d’autre chose ?',
  'notFound.secondary.description': 'Consultez notre documentation légale ou écrivez à {email} pour obtenir de l’aide.',
  'notFound.secondary.privacy': 'Politique de confidentialité',
  'notFound.secondary.terms': 'Conditions d’utilisation',
  'notFound.secondary.contact': 'Contacter le support',
  'notFound.auditTrail.title': 'Ce que nous avons enregistré',
  'notFound.auditTrail.copy':
    'Nous avons consigné cet accès manqué dans l’audit trail. Communiquez le code de suivi au support pour accélérer nos recherches.'
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

import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'Início',
  'nav.solutions': 'Soluções',
  'nav.tools': 'Ferramentas',
  'nav.industries': 'Indústrias',
  'nav.platform': 'Plataforma',
  'nav.materials': 'Materiais',
  'nav.resources': 'Recursos',
  'nav.dashboards': 'Painéis',
  'nav.providerConsole': 'Console do fornecedor',
  'nav.providerStorefront': 'Vitrine e anúncios',
  'nav.enterpriseAnalytics': 'Análises empresariais',
  'nav.businessFronts': 'Frentes comerciais',
  'nav.geoMatching': 'Correspondência geográfica',
  'nav.communications': 'Comunicações',
  'nav.login': 'Entrar',
  'nav.register': 'Registrar',
  'nav.getStarted': 'Começar',
  'nav.languageSelector': 'Idioma'
};

export const ptBR = {
  metadata: {
    ...enGB.metadata,
    id: 'pt-BR',
    name: 'Português (Brasil)',
    htmlLang: 'pt-BR',
    direction: 'ltr',
    currency: 'BRL',
    numberLocale: 'pt-BR',
    dateLocale: 'pt-BR'
  },
  messages
};

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
  'nav.languageSelector': 'Idioma',

  'errors.unexpected.title': 'Incidente crítico',
  'errors.unexpected.headline': 'Ocorreu um problema durante o carregamento.',
  'errors.unexpected.inlineHeadline': 'Não foi possível carregar esta seção',
  'errors.unexpected.inlineDescription': 'Atualize a visualização ou tente novamente mais tarde; nossa equipe já está investigando.',
  'errors.unexpected.description':
    'Ocorreu um erro ao carregar o workspace. Registramos o incidente e a equipe de engenharia foi acionada.',
  'errors.unexpected.reference': 'ID de referência',
  'errors.unexpected.actions.retry': 'Recarregar o Fixnado',
  'errors.unexpected.actions.contactSupport': 'Enviar e-mail para o suporte',
  'errors.unexpected.actions.statusPage': 'Ver página de status',
  'errors.unexpected.actions.copyDetails': 'Copiar diagnóstico',
  'errors.unexpected.actions.copied': 'Diagnóstico copiado',
  'errors.unexpected.detailsToggle': 'Mostrar detalhes técnicos',

  'notFound.code': '404 — Página não encontrada',
  'notFound.title': 'Não conseguimos localizar essa página.',
  'notFound.description': 'O endereço {path} não está disponível ou foi movido.',
  'notFound.reference': 'Código de rastreamento',
  'notFound.actions.dashboard': 'Abrir painéis',
  'notFound.actions.supportCentre': 'Ir para o hub de comunicações',
  'notFound.actions.home': 'Voltar para o início',
  'notFound.actions.explore': 'Explorar serviços',
  'notFound.secondary.title': 'Precisa de algo mais?',
  'notFound.secondary.description': 'Confira nossa documentação legal ou escreva para {email} para obter ajuda.',
  'notFound.secondary.privacy': 'Política de privacidade',
  'notFound.secondary.terms': 'Termos de serviço',
  'notFound.secondary.contact': 'Falar com o suporte',
  'notFound.auditTrail.title': 'O que registramos',
  'notFound.auditTrail.copy':
    'Registramos essa falha no registro de auditoria. Compartilhe o código com o suporte para agilizar a análise.'
};

export const ptBR = {
  metadata: {
    ...enGB.metadata,
    id: 'pt-BR',
    name: 'Português (Brasil)',
    language: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    htmlLang: 'pt-BR',
    direction: 'ltr',
    currency: 'BRL',
    numberLocale: 'pt-BR',
    dateLocale: 'pt-BR'
  },
  messages
};

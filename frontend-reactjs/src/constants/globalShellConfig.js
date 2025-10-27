import {
  BoltIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  HomeIcon,
  MagnifyingGlassCircleIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export const buildCommandSuggestions = (t) => [
  {
    id: 'services',
    label: t('nav.command.suggestion.services'),
    query: 'HVAC compliance audit'
  },
  {
    id: 'providers',
    label: t('nav.command.suggestion.providers'),
    query: 'Tier 1 crane operators'
  },
  {
    id: 'jobs',
    label: t('nav.command.suggestion.jobs'),
    query: 'Custom jobs in London'
  },
  {
    id: 'finance',
    label: t('nav.command.suggestion.finance'),
    query: 'Escrow release FNA-372'
  }
];

export const buildQuickLinks = ({ t, isAuthenticated }) => {
  const baseLinks = [
    {
      id: 'feed',
      title: t('nav.feed'),
      description: t('nav.quickLinks.feedDescription'),
      href: '/feed',
      activeMatch: '/feed',
      icon: BoltIcon,
      accentBackground: 'bg-gradient-to-br from-amber-50 to-white text-amber-600'
    },
    {
      id: 'search',
      title: t('nav.search'),
      description: t('nav.quickLinks.searchDescription'),
      href: '/search',
      activeMatch: '/search',
      icon: MagnifyingGlassCircleIcon,
      accentBackground: 'bg-gradient-to-br from-sky-50 to-white text-sky-600'
    },
    {
      id: 'providers',
      title: t('nav.explorerProviders'),
      description: t('nav.quickLinks.providersDescription'),
      href: '/providers',
      activeMatch: '/providers',
      icon: UserGroupIcon,
      accentBackground: 'bg-gradient-to-br from-emerald-50 to-white text-emerald-600'
    }
  ];

  const communicationsLink = {
    id: 'communications',
    title: t('nav.communications'),
    description: t('nav.quickLinks.communicationsDescription'),
    href: '/communications',
    activeMatch: '/communications',
    icon: ChatBubbleOvalLeftEllipsisIcon,
    accentBackground: 'bg-gradient-to-br from-indigo-50 to-white text-indigo-600',
    matchPaths: ['/messages']
  };

  const workspaceLink = isAuthenticated
    ? {
        id: 'dashboards',
        title: t('nav.dashboards'),
        description: t('nav.quickLinks.dashboardsDescription'),
        href: '/dashboards',
        activeMatch: '/dashboards',
        icon: Squares2X2Icon,
        accentBackground: 'bg-gradient-to-br from-rose-50 to-white text-rose-600'
      }
    : {
        id: 'login',
        title: t('nav.login'),
        description: t('nav.workspacesDescription'),
        href: '/login',
        activeMatch: '/login',
        icon: Squares2X2Icon,
        accentBackground: 'bg-gradient-to-br from-slate-100 to-white text-slate-600'
      };

  return [...baseLinks, communicationsLink, workspaceLink];
};

export const buildMobileDockLinks = ({ t, isAuthenticated }) => {
  const links = [
    {
      id: 'home',
      label: t('nav.mobileDock.home'),
      href: '/',
      activeMatch: '/',
      icon: HomeIcon
    },
    {
      id: 'feed',
      label: t('nav.mobileDock.feed'),
      href: '/feed',
      activeMatch: '/feed',
      icon: BoltIcon
    },
    {
      id: 'search',
      label: t('nav.mobileDock.search'),
      href: '/search',
      activeMatch: '/search',
      icon: MagnifyingGlassCircleIcon
    }
  ];

  if (isAuthenticated) {
    links.push(
      {
        id: 'messages',
        label: t('nav.mobileDock.messages'),
        href: '/communications',
        activeMatch: '/communications',
        icon: ChatBubbleOvalLeftEllipsisIcon
      },
      {
        id: 'hub',
        label: t('nav.mobileDock.hub'),
        href: '/dashboards',
        activeMatch: '/dashboards',
        icon: Squares2X2Icon
      }
    );
  } else {
    links.push(
      {
        id: 'providers',
        label: t('nav.explorerProviders'),
        href: '/providers',
        activeMatch: '/providers',
        icon: UserGroupIcon
      },
      {
        id: 'login',
        label: t('nav.login'),
        href: '/login',
        activeMatch: '/login',
        icon: UserCircleIcon
      }
    );
  }

  return links;
};

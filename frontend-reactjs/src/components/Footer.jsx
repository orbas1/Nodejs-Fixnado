import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { LOGO_URL } from '../constants/branding';
import { useLocale } from '../hooks/useLocale.js';
import { useSession } from '../hooks/useSession.js';

const buildFooterColumns = (t, { isAuthenticated }) => [
  {
    id: 'solutions',
    title: t('nav.solutions'),
    links: [
      { id: 'solutions-dashboards', label: t('nav.dashboards'), href: '/dashboards' },
      { id: 'solutions-storefront', label: t('nav.providerStorefront'), href: '/provider/storefront' },
      { id: 'solutions-business-fronts', label: t('nav.businessFronts'), href: '/providers' },
      { id: 'solutions-geo', label: t('nav.geoMatching'), href: '/operations/geo-matching' }
    ]
  },
  {
    id: 'resources',
    title: t('nav.resources'),
    links: [
      { id: 'resources-blog', label: t('nav.blog'), href: '/blog' },
      { id: 'resources-feed', label: t('nav.feed'), href: '/feed' },
      { id: 'resources-materials', label: t('nav.materials'), href: '/materials' },
      { id: 'resources-communications', label: t('nav.communications'), href: '/communications' }
    ]
  },
  {
    id: 'company',
    title: t('nav.company'),
    links: [
      { id: 'company-about', label: t('nav.about'), href: '/about' },
      { id: 'company-trust', label: t('nav.trustCentre'), href: '/privacy#trust' },
      { id: 'company-careers', label: t('nav.careers'), href: '/about#careers' },
      { id: 'company-contact', label: t('footer.contact'), href: '/communications' }
    ]
  },
  {
    id: 'accounts',
    title: t('nav.workspaces'),
    links: isAuthenticated
      ? [
          { id: 'accounts-dashboard', label: t('nav.viewDashboard'), href: '/dashboards' },
          { id: 'accounts-register', label: t('nav.providerConsole'), href: '/register/company' },
          { id: 'accounts-login', label: t('nav.login'), href: '/login' },
          { id: 'accounts-privacy', label: t('footer.privacy'), href: '/privacy' }
        ]
      : [
          { id: 'accounts-register', label: t('nav.register'), href: '/register' },
          { id: 'accounts-login', label: t('nav.login'), href: '/login' },
          { id: 'accounts-provider', label: t('nav.providerConsole'), href: '/register/company' },
          { id: 'accounts-terms', label: t('footer.terms'), href: '/legal/terms' }
        ]
  }
];

function FooterLink({ link }) {
  return (
    <li>
      <Link
        to={link.href}
        className="text-sm text-slate-500 transition hover:text-accent"
      >
        {link.label}
      </Link>
    </li>
  );
}

FooterLink.propTypes = {
  link: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired
  }).isRequired
};

export default function Footer() {
  const { t } = useLocale();
  const session = useSession();
  const columns = buildFooterColumns(t, session);

  return (
    <footer className="border-t border-slate-200 bg-slate-50/60 text-slate-600">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:gap-16">
        <div className="max-w-sm space-y-4">
          <img src={LOGO_URL} alt="Fixnado" className="h-12 w-auto" />
          <p className="text-sm text-slate-500">{t('footer.tagline')}</p>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-slate-400">
            <span>GDPR READY</span>
            <span>ESCROW SAFE</span>
            <span>AI ASSIST</span>
          </div>
        </div>
        <div className="grid flex-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <FooterLink key={link.id} link={link} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-accent">
              {t('footer.privacy')}
            </Link>
            <Link to="/legal/terms" className="hover:text-accent">
              {t('footer.terms')}
            </Link>
            <Link to="/privacy#cookies" className="hover:text-accent">
              {t('footer.cookies')}
            </Link>
            <Link to="/upload" className="hover:text-accent">
              {t('footer.press')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

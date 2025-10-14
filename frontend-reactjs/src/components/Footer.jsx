import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding';
import { useLocale } from '../hooks/useLocale.js';

const footerConfig = [
  {
    key: 'company',
    titleKey: 'footer.company',
    items: ['footer.about', 'footer.careers', 'footer.press', 'footer.contact']
  },
  {
    key: 'support',
    titleKey: 'footer.support',
    items: ['footer.helpCenter', 'footer.safety', 'footer.escrow', 'footer.disputes']
  },
  {
    key: 'marketplace',
    titleKey: 'footer.marketplace',
    items: ['footer.services', 'footer.liveFeed', 'footer.toolRentals', 'footer.materials']
  }
];

export default function Footer() {
  const { t } = useLocale();

  const footerLinks = useMemo(
    () =>
      footerConfig.map((column) => ({
        ...column,
        title: t(column.titleKey),
        items: column.items.map((itemKey) => ({
          key: itemKey,
          label: t(itemKey),
          href:
            itemKey === 'footer.about'
              ? '/about'
              : itemKey === 'footer.careers'
              ? '/about#careers'
              : itemKey === 'footer.press'
              ? '/communications'
              : itemKey === 'footer.contact'
              ? '/communications'
              : itemKey === 'footer.services'
              ? '/services'
              : itemKey === 'footer.liveFeed'
              ? '/feed'
              : itemKey === 'footer.toolRentals'
              ? '/services#rentals'
              : itemKey === 'footer.materials'
              ? '/materials'
              : '#'
        }))
      })),
    [t]
  );

  return (
    <footer className="bg-white text-slate-700 border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <img
            src={LOGO_URL}
            alt="Fixnado"
            className="h-[3.75rem] w-auto object-contain"
            loading="lazy"
          />
          <p className="mt-4 text-sm text-slate-500">
            {t('footer.tagline')}
          </p>
        </div>
        {footerLinks.map((column) => (
          <div key={column.key}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{column.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {column.items.map((item) => (
                <li key={item.key}>
                  <Link to={item.href} className="hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-accent">{t('footer.privacy')}</Link>
            <Link to="#" className="hover:text-accent">{t('footer.terms')}</Link>
            <Link to="#" className="hover:text-accent">{t('footer.cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

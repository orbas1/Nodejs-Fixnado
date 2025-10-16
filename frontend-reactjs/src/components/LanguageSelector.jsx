import { useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../hooks/useLocale.js';

const VARIANT_STYLES = {
  header: {
    container:
      'relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur',
    select:
      'bg-transparent pr-6 text-xs font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
  },
  hero: {
    container:
      'relative inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-primary/5 sm:w-auto',
    select:
      'bg-transparent pr-7 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
  },
  mobile: {
    container:
      'relative inline-flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm',
    select:
      'w-full bg-transparent pr-7 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
  },
  menu: {
    container:
      'relative flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur',
    select:
      'w-full bg-transparent pr-7 text-xs font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
  }
};

export default function LanguageSelector({ variant, className }) {
  const id = useId();
  const { locale, setLocale, availableLocales, t } = useLocale();
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.header;

  return (
    <div className={clsx('group/language-selector', styles.container, className)}>
      <GlobeAltIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {t('nav.languageSelector')}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className={clsx(
          'appearance-none bg-transparent outline-none transition-colors',
          styles.select,
          locale?.startsWith('ar') ? 'text-right' : 'text-left'
        )}
        dir={locale?.startsWith('ar') ? 'rtl' : 'ltr'}
      >
        {availableLocales.map((entry) => (
          <option key={entry.id} value={entry.id} className="text-slate-700">
            {entry.name}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-xs font-semibold text-slate-400 group-hover/language-selector:text-primary"
      >
        ▾
      </span>
    </div>
  );
}

LanguageSelector.propTypes = {
  variant: PropTypes.oneOf(['header', 'hero', 'mobile', 'menu']),
  className: PropTypes.string
};

LanguageSelector.defaultProps = {
  variant: 'header',
  className: undefined
};

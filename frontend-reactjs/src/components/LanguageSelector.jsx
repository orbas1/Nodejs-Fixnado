import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Listbox, Transition } from '@headlessui/react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../hooks/useLocale.js';

const VARIANT_STYLES = {
  header: {
    container:
      'relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur',
    trigger:
      'text-xs font-semibold text-slate-600',
    button: '',
    language: 'text-xs font-semibold',
    native: 'text-[0.65rem]',
    dropdown: 'min-w-[12rem]'
  },
  hero: {
    container:
      'relative inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-primary/5 sm:w-auto',
    trigger:
      'text-sm font-semibold text-slate-700',
    button: 'w-full sm:w-auto',
    language: 'text-sm font-semibold',
    native: 'text-xs',
    dropdown: 'sm:min-w-[16rem]'
  },
  mobile: {
    container:
      'relative inline-flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm',
    trigger:
      'text-sm font-semibold text-slate-600',
    button: 'w-full',
    language: 'text-sm font-semibold',
    native: 'text-xs',
    dropdown: 'w-full'
  },
  menu: {
    container:
      'relative flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur',
    trigger:
      'text-xs font-semibold text-slate-600',
    button: 'w-full',
    language: 'text-xs font-semibold',
    native: 'text-[0.65rem]',
    dropdown: 'w-full'
  }
};

export default function LanguageSelector({ variant, className }) {
  const { locale, setLocale, availableLocales, t } = useLocale();
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.header;
  const selectedLocale = useMemo(
    () => availableLocales.find((entry) => entry.id === locale) ?? availableLocales[0],
    [availableLocales, locale]
  );
  const selectedDirection = selectedLocale?.direction === 'rtl' ? 'rtl' : 'ltr';
  const alignmentClass = selectedDirection === 'rtl' ? 'items-end text-right' : 'items-start text-left';

  if (!selectedLocale) {
    return null;
  }

  return (
    <Listbox value={locale} onChange={setLocale}>
      {() => (
        <div className={clsx('relative', className)}>
          <Listbox.Label className="sr-only">{t('nav.languageSelector')}</Listbox.Label>
          <div className={clsx('group/language-selector', styles.container)}>
            <GlobeAltIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <Listbox.Button
              type="button"
              className={clsx(
                'flex items-center gap-3 bg-transparent pe-6 outline-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                styles.button,
                styles.trigger
              )}
              dir={selectedDirection}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl leading-none" aria-hidden="true">
                  {selectedLocale?.flag ?? '🏳️'}
                </span>
                <span className={clsx('flex flex-col', alignmentClass)}>
                  <span className={clsx(styles.language, 'text-slate-700')}>
                    {selectedLocale?.language}
                  </span>
                  <span className={clsx(styles.native, 'italic text-slate-400')}>
                    {selectedLocale?.nativeName}
                  </span>
                </span>
              </span>
            </Listbox.Button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 text-xs font-semibold text-slate-400 transition-colors group-hover/language-selector:text-primary"
            >
              ▾
            </span>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Listbox.Options
              className={clsx(
                'absolute right-0 top-full z-10 mt-2 max-h-64 w-full min-w-[12rem] overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl focus:outline-none',
                styles.dropdown
              )}
            >
              {availableLocales.map((entry) => {
                const optionDirection = entry.direction === 'rtl' ? 'rtl' : 'ltr';
                const optionAlignmentClass = optionDirection === 'rtl' ? 'items-end text-right' : 'items-start text-left';

                return (
                  <Listbox.Option
                    key={entry.id}
                    value={entry.id}
                    dir={optionDirection}
                    className={({ active }) =>
                      clsx(
                        'cursor-pointer select-none px-3 py-2 transition-colors',
                        active ? 'bg-primary/10 text-primary' : 'text-slate-700'
                      )
                    }
                  >
                    {({ selected }) => (
                      <div className="flex w-full items-center gap-3">
                        <span className="text-xl leading-none" aria-hidden="true">
                          {entry.flag ?? '🏳️'}
                        </span>
                        <span className={clsx('flex flex-col', optionAlignmentClass)}>
                          <span
                            className={clsx(
                              styles.language,
                              selected ? 'text-primary' : 'text-slate-700'
                            )}
                          >
                            {entry.language}
                          </span>
                          <span className={clsx(styles.native, 'italic text-slate-400')}>
                            {entry.nativeName}
                          </span>
                        </span>
                      </div>
                    )}
                  </Listbox.Option>
                );
              })}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
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

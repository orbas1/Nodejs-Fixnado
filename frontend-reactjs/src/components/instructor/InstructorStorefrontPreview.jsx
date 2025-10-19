import { useState } from 'react';
import PropTypes from 'prop-types';
import { useLocale } from '../../hooks/useLocale.js';
import StatusPill from '../ui/StatusPill.jsx';

const themeOptions = [
  { id: 'light', labelKey: 'instructor.storefront.theme.light' },
  { id: 'dark', labelKey: 'instructor.storefront.theme.dark' },
  { id: 'photo', labelKey: 'instructor.storefront.theme.photo' }
];

export default function InstructorStorefrontPreview({ storefront, onSave, saving }) {
  const { t } = useLocale();
  const [formState, setFormState] = useState(() => ({
    heroHeadline: storefront.heroHeadline,
    heroSubheadline: storefront.heroSubheadline,
    theme: storefront.theme,
    isPublished: storefront.isPublished
  }));

  const handleChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    await onSave({ ...storefront, ...formState });
  };

  return (
    <section className="space-y-6" aria-labelledby="instructor-storefront">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.storefront.eyebrow')}</p>
        <h2 id="instructor-storefront" className="text-2xl font-semibold text-primary">
          {t('instructor.storefront.title')}
        </h2>
        <p className="text-sm text-slate-600">{t('instructor.storefront.description')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={formState.isPublished}
              onChange={(event) => handleChange('isPublished', event.target.checked)}
              disabled={saving}
            />
            <span className="font-semibold text-primary">{t('instructor.storefront.publishToggle')}</span>
          </label>

          <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {t('instructor.storefront.headlineLabel')}
            <input
              type="text"
              className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
              value={formState.heroHeadline}
              onChange={(event) => handleChange('heroHeadline', event.target.value)}
              maxLength={160}
              placeholder={t('instructor.storefront.headlinePlaceholder')}
              disabled={saving}
            />
          </label>

          <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {t('instructor.storefront.subheadlineLabel')}
            <textarea
              rows={3}
              className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
              value={formState.heroSubheadline}
              onChange={(event) => handleChange('heroSubheadline', event.target.value)}
              maxLength={240}
              placeholder={t('instructor.storefront.subheadlinePlaceholder')}
              disabled={saving}
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.storefront.themeLabel')}
            </legend>
            <div className="grid gap-3 md:grid-cols-3">
              {themeOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm ${formState.theme === option.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600'}`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={option.id}
                    checked={formState.theme === option.id}
                    onChange={(event) => handleChange('theme', event.target.value)}
                    className="hidden"
                    disabled={saving}
                  />
                  <span className="font-semibold">{t(option.labelKey)}</span>
                  <span className="text-xs text-slate-500">{t(`instructor.storefront.themeDescription.${option.id}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              className="rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? t('instructor.storefront.saving') : t('instructor.storefront.saveChanges')}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('instructor.storefront.previewEyebrow')}</p>
              <h3 className="text-lg font-semibold text-primary">{formState.heroHeadline || t('instructor.storefront.previewTitle')}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {formState.heroSubheadline || t('instructor.storefront.previewDescription')}
              </p>
            </div>
            <StatusPill tone={formState.isPublished ? 'success' : 'neutral'}>
              {formState.isPublished ? t('instructor.storefront.statusLive') : t('instructor.storefront.statusDraft')}
            </StatusPill>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-inner">
            <p>{t('instructor.storefront.previewHint')}</p>
            {storefront.featuredProductIds?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5">
                {storefront.featuredProductIds.map((id) => (
                  <li key={id} className="text-xs text-slate-500">
                    {t('instructor.storefront.featuredProduct', { id })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs text-slate-400">{t('instructor.storefront.noFeaturedProducts')}</p>
            )}
            {storefront.conversionRate != null ? (
              <p className="mt-4 text-xs text-primary">{t('instructor.storefront.conversionRate', { value: (storefront.conversionRate * 100).toFixed(1) })}</p>
            ) : null}
            {storefront.url ? (
              <a
                href={storefront.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                {t('instructor.storefront.openStorefront')}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

InstructorStorefrontPreview.propTypes = {
  storefront: PropTypes.shape({
    heroHeadline: PropTypes.string,
    heroSubheadline: PropTypes.string,
    theme: PropTypes.string,
    isPublished: PropTypes.bool,
    featuredProductIds: PropTypes.arrayOf(PropTypes.string),
    conversionRate: PropTypes.number,
    url: PropTypes.string
  }).isRequired,
  onSave: PropTypes.func,
  saving: PropTypes.bool
};

InstructorStorefrontPreview.defaultProps = {
  onSave: undefined,
  saving: false
};

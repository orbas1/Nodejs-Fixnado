import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, TextInput } from '../../../../components/ui/index.js';
import FormStatus from './FormStatus.jsx';

function BrandingForm({
  form,
  onFieldChange,
  onAddMedia,
  onMediaChange,
  onRemoveMedia,
  onSubmit,
  saving,
  status
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Branding</p>
        <h3 className="mt-1 text-2xl font-semibold text-primary">Visual identity & gallery</h3>
        <p className="mt-2 text-sm text-slate-600">
          Control how the Fixnado marketplace and dashboards present your brand. Changes propagate to storefronts, quotes, and
          dispatch notifications immediately.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TextInput
          label="Logo URL"
          value={form.logoUrl}
          onChange={(event) => onFieldChange('logoUrl', event.target.value)}
          placeholder="https://cdn.fixnado.com/logo.png"
        />
        <TextInput
          label="Hero image URL"
          value={form.heroImageUrl}
          onChange={(event) => onFieldChange('heroImageUrl', event.target.value)}
          placeholder="https://cdn.fixnado.com/hero.jpg"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <TextInput
          label="Primary colour"
          value={form.brandPrimaryColor ?? ''}
          onChange={(event) => onFieldChange('brandPrimaryColor', event.target.value)}
          placeholder="#0f172a"
        />
        <TextInput
          label="Secondary colour"
          value={form.brandSecondaryColor ?? ''}
          onChange={(event) => onFieldChange('brandSecondaryColor', event.target.value)}
          placeholder="#38bdf8"
        />
        <TextInput
          label="Brand font"
          value={form.brandFont ?? ''}
          onChange={(event) => onFieldChange('brandFont', event.target.value)}
          placeholder="Manrope"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-primary">Media gallery</h4>
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddMedia}>
            Add media
          </Button>
        </div>
        {form.mediaGallery.length === 0 ? (
          <p className="text-sm text-slate-500">No gallery items yet. Add high-impact visuals to showcase your crews and work.</p>
        ) : (
          <div className="space-y-4">
            {form.mediaGallery.map((item, index) => (
              <div
                key={item.id || index}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-[1fr,1fr,auto]"
              >
                <TextInput
                  label="Label"
                  value={item.label ?? ''}
                  onChange={(event) => onMediaChange(index, 'label', event.target.value)}
                  placeholder="Crew at work"
                />
                <TextInput
                  label="URL"
                  value={item.url ?? ''}
                  onChange={(event) => onMediaChange(index, 'url', event.target.value)}
                  placeholder="https://"
                />
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={TrashIcon}
                    onClick={() => onRemoveMedia(index)}
                    className="text-rose-600"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatus status={status} />
        <Button type="submit" loading={saving} disabled={saving} className="sm:w-auto">
          Save branding
        </Button>
      </div>
    </form>
  );
}

BrandingForm.propTypes = {
  form: PropTypes.shape({
    logoUrl: PropTypes.string,
    heroImageUrl: PropTypes.string,
    brandPrimaryColor: PropTypes.string,
    brandSecondaryColor: PropTypes.string,
    brandFont: PropTypes.string,
    mediaGallery: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        url: PropTypes.string
      })
    )
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onAddMedia: PropTypes.func.isRequired,
  onMediaChange: PropTypes.func.isRequired,
  onRemoveMedia: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  })
};

BrandingForm.defaultProps = {
  status: null
};

export default BrandingForm;

import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, TextInput, TextArea } from '../../../components/ui/index.js';

export default function LegalCreateModal({
  open,
  form,
  onFieldChange,
  onClose,
  onSubmit,
  creating,
  slugPreview
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Create legal policy</h2>
            <p className="text-sm text-slate-500">Provision a new managed policy surface with default governance.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <XMarkIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Policy title"
              required
              value={form.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              disabled={creating}
            />
            <TextInput
              label="Policy slug"
              hint={slugPreview ? `Preview: /legal/${slugPreview}` : 'Auto-generated if left blank'}
              value={form.slug}
              onChange={(event) => onFieldChange('slug', event.target.value)}
              disabled={creating}
            />
          </div>
          <TextArea
            label="Summary"
            rows={3}
            value={form.summary}
            onChange={(event) => onFieldChange('summary', event.target.value)}
            disabled={creating}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Policy owner"
              value={form.owner}
              onChange={(event) => onFieldChange('owner', event.target.value)}
              disabled={creating}
            />
            <TextInput
              label="Review cadence"
              value={form.reviewCadence}
              onChange={(event) => onFieldChange('reviewCadence', event.target.value)}
              disabled={creating}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Contact email"
              value={form.contactEmail}
              onChange={(event) => onFieldChange('contactEmail', event.target.value)}
              disabled={creating}
            />
            <TextInput
              label="Contact phone"
              value={form.contactPhone}
              onChange={(event) => onFieldChange('contactPhone', event.target.value)}
              disabled={creating}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Contact URL"
              value={form.contactUrl}
              onChange={(event) => onFieldChange('contactUrl', event.target.value)}
              disabled={creating}
            />
            <TextInput
              label="Hero image URL"
              value={form.heroImageUrl}
              onChange={(event) => onFieldChange('heroImageUrl', event.target.value)}
              disabled={creating}
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={creating}>
              Create policy
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

LegalCreateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  form: PropTypes.shape({
    title: PropTypes.string,
    slug: PropTypes.string,
    summary: PropTypes.string,
    owner: PropTypes.string,
    reviewCadence: PropTypes.string,
    contactEmail: PropTypes.string,
    contactPhone: PropTypes.string,
    contactUrl: PropTypes.string,
    heroImageUrl: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  creating: PropTypes.bool,
  slugPreview: PropTypes.string
};

LegalCreateModal.defaultProps = {
  creating: false,
  slugPreview: ''
};

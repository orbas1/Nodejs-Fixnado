import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  Select,
  StatusPill,
  TextInput,
  Textarea
} from '../../../components/ui/index.js';
import { CREATIVE_FORMAT_OPTIONS, CREATIVE_STATUS_OPTIONS } from '../constants.js';
import { formatDate, formatStatus } from '../utils/formatters.js';

const STATUS_TONES = {
  active: 'success',
  in_review: 'info',
  paused: 'warning',
  retired: 'neutral',
  draft: 'neutral'
};

const EMPTY_FORM = {
  name: '',
  format: 'image',
  status: 'draft',
  headline: '',
  description: '',
  callToAction: '',
  assetUrl: '',
  thumbnailUrl: ''
};

function CreativeForm({ form, onChange, onSubmit, submitLabel, disabled }) {
  const handleChange = (field) => (event) => onChange(field, event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <TextInput label="Name" value={form.name} onChange={handleChange('name')} required placeholder="Rapid response hero" />
      <Select label="Format" value={form.format} onChange={handleChange('format')} options={CREATIVE_FORMAT_OPTIONS} />
      <Select label="Status" value={form.status} onChange={handleChange('status')} options={CREATIVE_STATUS_OPTIONS} />
      <TextInput
        label="Call to action"
        value={form.callToAction}
        onChange={handleChange('callToAction')}
        placeholder="Book now"
      />
      <TextInput
        label="Headline"
        value={form.headline}
        onChange={handleChange('headline')}
        required
        placeholder="Need critical repairs in under 2 hours?"
      />
      <TextInput
        label="Asset URL"
        value={form.assetUrl}
        onChange={handleChange('assetUrl')}
        placeholder="https://cdn.fixnado.com/assets/fixnado/banner.jpg"
      />
      <TextInput
        label="Thumbnail URL"
        value={form.thumbnailUrl}
        onChange={handleChange('thumbnailUrl')}
        optionalLabel="optional"
        placeholder="https://cdn.fixnado.com/assets/fixnado/thumbnail.jpg"
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={handleChange('description')}
        rows={3}
        optionalLabel="optional"
      />
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

CreativeForm.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string,
    format: PropTypes.string,
    status: PropTypes.string,
    headline: PropTypes.string,
    description: PropTypes.string,
    callToAction: PropTypes.string,
    assetUrl: PropTypes.string,
    thumbnailUrl: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

CreativeForm.defaultProps = {
  disabled: false
};

export default function CreativesPanel({ creatives, onAddCreative, onUpdateCreative, onRemoveCreative, saving }) {
  const [creationForm, setCreationForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [editingForm, setEditingForm] = useState(null);

  const handleCreationChange = (field, value) => {
    setCreationForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async () => {
    if (!creationForm.name || !creationForm.headline) {
      return;
    }
    await onAddCreative(creationForm);
    setCreationForm(EMPTY_FORM);
  };

  const startEditing = (creative) => {
    setEditing(creative.id);
    setEditingForm({
      name: creative.name ?? '',
      format: creative.format ?? 'image',
      status: creative.status ?? 'draft',
      headline: creative.headline ?? '',
      description: creative.description ?? '',
      callToAction: creative.callToAction ?? '',
      assetUrl: creative.assetUrl ?? '',
      thumbnailUrl: creative.thumbnailUrl ?? ''
    });
  };

  const handleEditingChange = (field, value) => {
    setEditingForm((current) => ({ ...current, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!editing || !editingForm) {
      return;
    }
    await onUpdateCreative(editing, editingForm);
    setEditing(null);
    setEditingForm(null);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditingForm(null);
  };

  return (
    <Card padding="lg" className="border border-slate-200 bg-white/70 shadow-sm">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Creatives</p>
        <h3 className="text-xl font-semibold text-primary">Asset library</h3>
        <p className="mt-2 text-sm text-slate-600">
          Upload variations for different placements. Assets are stored with Fixnado creative approvals and synced to the
          marketing API.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/90 p-5">
        <h4 className="text-sm font-semibold text-primary">Add new creative</h4>
        <p className="mt-1 text-sm text-slate-500">
          Provide at least a headline and asset link. Newly added creatives appear below for further QA and approvals.
        </p>
        <div className="mt-4">
          <CreativeForm
            form={creationForm}
            onChange={handleCreationChange}
            onSubmit={handleCreate}
            submitLabel="Create creative"
            disabled={saving}
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {creatives.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No creatives uploaded yet. Add an asset above to populate the campaign rotation.
          </p>
        ) : (
          creatives.map((creative) => {
            const isEditing = editing === creative.id;
            const tone = STATUS_TONES[creative.status] || 'neutral';
            return (
              <article key={creative.id} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-primary">{creative.name}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                      <span>{formatStatus(creative.format)}</span>
                      <StatusPill tone={tone}>{formatStatus(creative.status)}</StatusPill>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {creative.assetUrl ? (
                      <Button to={creative.assetUrl} target="_blank" rel="noreferrer" variant="ghost" size="sm">
                        Preview asset
                      </Button>
                    ) : null}
                    <Button variant="secondary" size="sm" onClick={() => startEditing(creative)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveCreative(creative.id)} disabled={saving}>
                      Remove
                    </Button>
                  </div>
                </div>

                {creative.thumbnailUrl ? (
                  <img
                    src={creative.thumbnailUrl}
                    alt={creative.name}
                    className="mt-4 h-32 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}

                <p className="mt-4 text-sm text-slate-600">{creative.description || 'No description provided.'}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Last updated {creative.updatedAt ? formatDate(creative.updatedAt) : 'pending sync'}
                </p>

                {isEditing ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <CreativeForm
                      form={editingForm}
                      onChange={handleEditingChange}
                      onSubmit={handleUpdate}
                      submitLabel="Save creative"
                      disabled={saving}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button type="button" variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                        Cancel edit
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </Card>
  );
}

CreativesPanel.propTypes = {
  creatives: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      status: PropTypes.string,
      format: PropTypes.string,
      headline: PropTypes.string,
      description: PropTypes.string,
      callToAction: PropTypes.string,
      assetUrl: PropTypes.string,
      thumbnailUrl: PropTypes.string,
      updatedAt: PropTypes.string
    })
  ),
  onAddCreative: PropTypes.func.isRequired,
  onUpdateCreative: PropTypes.func.isRequired,
  onRemoveCreative: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

CreativesPanel.defaultProps = {
  creatives: [],
  saving: false
};

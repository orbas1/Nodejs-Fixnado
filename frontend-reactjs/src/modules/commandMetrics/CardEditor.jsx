import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button, Checkbox, TextInput } from '../../components/ui/index.js';

function buildInitialLocalState(card) {
  return {
    title: card.title,
    tone: card.tone,
    detailsText: (card.details ?? []).join('\n'),
    displayOrder: String(card.displayOrder ?? ''),
    isActive: card.isActive,
    mediaUrl: card.mediaUrl ?? '',
    mediaAlt: card.mediaAlt ?? '',
    ctaLabel: card.cta?.label ?? '',
    ctaHref: card.cta?.href ?? '',
    ctaExternal: Boolean(card.cta?.external)
  };
}

export default function CardEditor({ card, tones, onSave, onDelete, busy }) {
  const [local, setLocal] = useState(() => buildInitialLocalState(card));

  useEffect(() => {
    setLocal(buildInitialLocalState(card));
  }, [card]);

  const handleInputChange = useCallback((field) => (event) => {
    const { value } = event.target;
    setLocal((current) => ({ ...current, [field]: value }));
  }, []);

  const handleCheckboxChange = useCallback((field) => (event) => {
    const { checked } = event.target;
    setLocal((current) => ({ ...current, [field]: checked }));
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const details = local.detailsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const payload = {
        title: local.title,
        tone: local.tone,
        details,
        displayOrder: Number.parseInt(local.displayOrder ?? '0', 10),
        isActive: local.isActive,
        mediaUrl: local.mediaUrl,
        mediaAlt: local.mediaAlt,
        cta: local.ctaLabel && local.ctaHref
          ? { label: local.ctaLabel, href: local.ctaHref, external: local.ctaExternal }
          : null
      };
      onSave(card, payload);
    },
    [card, local, onSave]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{card.title || 'New dashboard card'}</p>
          {card.updatedAt ? (
            <p className="text-xs text-slate-500">Last updated {new Date(card.updatedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Checkbox label="Visible" checked={local.isActive} onChange={handleCheckboxChange('isActive')} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={TrashIcon}
            onClick={() => onDelete(card)}
            disabled={busy}
            aria-label="Remove card"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Card title"
          value={local.title}
          onChange={handleInputChange('title')}
          required
          placeholder="Dispute escalation readiness"
        />
        <div>
          <label className="fx-field__label">Tone</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={local.tone}
            onChange={handleInputChange('tone')}
          >
            {tones.map((tone) => (
              <option key={tone.value} value={tone.value}>
                {tone.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="fx-field__label">Card details</label>
        <textarea
          value={local.detailsText}
          onChange={handleInputChange('detailsText')}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          rows={4}
          placeholder={`Each line becomes a bullet\nEscalations triaged within 15 minutes`}
        />
        <p className="mt-1 text-xs text-slate-500">Use line breaks to add bullet points.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          label="Display order"
          type="number"
          value={local.displayOrder}
          onChange={handleInputChange('displayOrder')}
          min="0"
          placeholder="100"
        />
        <TextInput
          label="Image URL"
          value={local.mediaUrl}
          onChange={handleInputChange('mediaUrl')}
          placeholder="https://..."
        />
        <TextInput
          label="Image alt text"
          value={local.mediaAlt}
          onChange={handleInputChange('mediaAlt')}
          placeholder="Optional description"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          label="CTA label"
          value={local.ctaLabel}
          onChange={handleInputChange('ctaLabel')}
          placeholder="Open dispute console"
        />
        <TextInput
          label="CTA link"
          value={local.ctaHref}
          onChange={handleInputChange('ctaHref')}
          placeholder="/admin/operations"
        />
        <div className="flex items-center pt-6">
          <Checkbox
            label="Open in new tab"
            checked={local.ctaExternal}
            onChange={handleCheckboxChange('ctaExternal')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="primary" type="submit" size="sm" loading={busy}>
          Save card
        </Button>
      </div>
    </form>
  );
}

CardEditor.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    tone: PropTypes.string,
    details: PropTypes.arrayOf(PropTypes.string),
    displayOrder: PropTypes.number,
    isActive: PropTypes.bool,
    mediaUrl: PropTypes.string,
    mediaAlt: PropTypes.string,
    cta: PropTypes.shape({
      label: PropTypes.string,
      href: PropTypes.string,
      external: PropTypes.bool
    }),
    updatedAt: PropTypes.string,
    isNew: PropTypes.bool
  }).isRequired,
  tones: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  busy: PropTypes.bool
};

CardEditor.defaultProps = {
  busy: false
};

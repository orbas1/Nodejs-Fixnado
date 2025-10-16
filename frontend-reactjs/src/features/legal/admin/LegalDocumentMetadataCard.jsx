import PropTypes from 'prop-types';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Card, TextInput, TextArea, Button } from '../../../components/ui/index.js';

export default function LegalDocumentMetadataCard({
  form,
  onFieldChange,
  onSave,
  onDelete,
  disableSave,
  disableDelete,
  disableFields,
  showDeleteWarning
}) {
  return (
    <Card>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">Document metadata</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Document title"
            value={form.title}
            onChange={(event) => onFieldChange('title', event.target.value)}
            disabled={disableFields}
          />
          <TextInput
            label="Policy owner"
            hint="Accountable team or steward"
            value={form.owner}
            onChange={(event) => onFieldChange('owner', event.target.value)}
            disabled={disableFields}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Review cadence"
            hint="e.g. Quarterly, Bi-annual"
            value={form.reviewCadence}
            onChange={(event) => onFieldChange('reviewCadence', event.target.value)}
            disabled={disableFields}
          />
          <TextInput
            label="Contact URL"
            hint="Public-facing link for enquiries"
            value={form.contactUrl}
            onChange={(event) => onFieldChange('contactUrl', event.target.value)}
            disabled={disableFields}
          />
        </div>
        <TextArea
          label="Document summary"
          rows={4}
          value={form.summary}
          onChange={(event) => onFieldChange('summary', event.target.value)}
          disabled={disableFields}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Hero image URL"
            value={form.heroImageUrl}
            onChange={(event) => onFieldChange('heroImageUrl', event.target.value)}
            disabled={disableFields}
          />
          <TextInput
            label="Contact email"
            value={form.contactEmail}
            onChange={(event) => onFieldChange('contactEmail', event.target.value)}
            disabled={disableFields}
          />
          <TextInput
            label="Contact phone"
            value={form.contactPhone}
            onChange={(event) => onFieldChange('contactPhone', event.target.value)}
            disabled={disableFields}
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onSave} disabled={disableSave}>
            Sync metadata
          </Button>
          <Button
            type="button"
            variant="danger"
            icon={TrashIcon}
            iconPosition="start"
            onClick={onDelete}
            disabled={disableDelete}
          >
            Delete policy
          </Button>
        </div>
        {showDeleteWarning ? (
          <p className="text-xs text-slate-500">Unpublish or supersede the live version before deleting.</p>
        ) : null}
      </div>
    </Card>
  );
}

LegalDocumentMetadataCard.propTypes = {
  form: PropTypes.shape({
    title: PropTypes.string,
    owner: PropTypes.string,
    reviewCadence: PropTypes.string,
    contactUrl: PropTypes.string,
    summary: PropTypes.string,
    heroImageUrl: PropTypes.string,
    contactEmail: PropTypes.string,
    contactPhone: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  disableSave: PropTypes.bool,
  disableDelete: PropTypes.bool,
  disableFields: PropTypes.bool,
  showDeleteWarning: PropTypes.bool
};

LegalDocumentMetadataCard.defaultProps = {
  disableSave: false,
  disableDelete: false,
  disableFields: false,
  showDeleteWarning: false
};

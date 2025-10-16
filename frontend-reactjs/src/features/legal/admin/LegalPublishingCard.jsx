import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Card, Button, TextInput, TextArea } from '../../../components/ui/index.js';

export default function LegalPublishingCard({
  form,
  onFieldChange,
  onSaveDraft,
  onPublish,
  onReset,
  onDiscard,
  disableActions,
  disablePublish,
  showDiscard,
  previewHref,
  previewLabel
}) {
  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">Review &amp; publish</h2>
          <p className="text-sm text-slate-500">
            Save your draft before publishing. Set an effective date to schedule when the policy goes live.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            type="datetime-local"
            label="Effective from"
            value={form.effectiveAt}
            onChange={(event) => onFieldChange('effectiveAt', event.target.value)}
            disabled={disableActions}
          />
          <TextArea
            label="Change notes"
            rows={3}
            value={form.changeNotes}
            onChange={(event) => onFieldChange('changeNotes', event.target.value)}
            disabled={disableActions}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onSaveDraft} disabled={disableActions}>
            Save draft
          </Button>
          <Button type="button" variant="primary" onClick={onPublish} disabled={disablePublish}>
            Publish
          </Button>
          <Button type="button" variant="ghost" onClick={onReset} disabled={disableActions}>
            Reset changes
          </Button>
          {previewHref ? (
            <Button
              type="button"
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              icon={ArrowTopRightOnSquareIcon}
              iconPosition="end"
            >
              {previewLabel}
            </Button>
          ) : null}
          {showDiscard ? (
            <Button type="button" variant="danger" onClick={onDiscard} disabled={disableActions}>
              Discard draft
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

LegalPublishingCard.propTypes = {
  form: PropTypes.shape({
    effectiveAt: PropTypes.string,
    changeNotes: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
  disableActions: PropTypes.bool,
  disablePublish: PropTypes.bool,
  showDiscard: PropTypes.bool,
  previewHref: PropTypes.string,
  previewLabel: PropTypes.string
};

LegalPublishingCard.defaultProps = {
  disableActions: false,
  disablePublish: false,
  showDiscard: false,
  previewHref: undefined,
  previewLabel: 'Preview live policy'
};

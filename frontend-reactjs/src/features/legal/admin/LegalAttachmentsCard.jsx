import PropTypes from 'prop-types';
import {
  PaperClipIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Card, Button, TextInput, TextArea } from '../../../components/ui/index.js';

export default function LegalAttachmentsCard({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onMoveAttachment,
  onDuplicateAttachment,
  onAttachmentChange,
  disabled
}) {
  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Supporting attachments</h2>
            <p className="text-sm text-slate-500">Link reference PDFs, regulatory notices, or hosted files.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddAttachment}
            icon={PaperClipIcon}
            disabled={disabled}
          >
            Add attachment
          </Button>
        </div>
        <div className="space-y-6">
          {attachments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-white/70 p-6 text-center text-sm text-slate-500">
              No attachments yet. Link supporting artefacts or compliance PDFs here.
            </div>
          ) : null}
          {attachments.map((attachment, index) => (
            <div key={`attachment-${attachment.id || index}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">Attachment {index + 1}</p>
                  <p className="text-xs text-slate-500">Provide a descriptive label and secure URL.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={ArrowUpIcon}
                    onClick={() => onMoveAttachment(index, -1)}
                    disabled={disabled || index === 0}
                    aria-label={`Move attachment ${index + 1} up`}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={ArrowDownIcon}
                    onClick={() => onMoveAttachment(index, 1)}
                    disabled={disabled || index === attachments.length - 1}
                    aria-label={`Move attachment ${index + 1} down`}
                  >
                    Move down
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={DocumentDuplicateIcon}
                    onClick={() => onDuplicateAttachment(index)}
                    disabled={disabled}
                    aria-label={`Duplicate attachment ${index + 1}`}
                  >
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={TrashIcon}
                    onClick={() => onRemoveAttachment(index)}
                    disabled={disabled}
                    aria-label={`Remove attachment ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Label"
                  value={attachment.label}
                  onChange={(event) => onAttachmentChange(index, 'label', event.target.value)}
                  disabled={disabled}
                />
                <TextInput
                  label="Type"
                  hint="e.g. PDF, External link"
                  value={attachment.type}
                  onChange={(event) => onAttachmentChange(index, 'type', event.target.value)}
                  disabled={disabled}
                />
              </div>
              <TextInput
                className="mt-4"
                label="URL"
                value={attachment.url}
                onChange={(event) => onAttachmentChange(index, 'url', event.target.value)}
                disabled={disabled}
              />
              <TextArea
                className="mt-4"
                label="Description"
                rows={3}
                value={attachment.description}
                onChange={(event) => onAttachmentChange(index, 'description', event.target.value)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

LegalAttachmentsCard.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      url: PropTypes.string,
      description: PropTypes.string,
      type: PropTypes.string
    })
  ).isRequired,
  onAddAttachment: PropTypes.func.isRequired,
  onRemoveAttachment: PropTypes.func.isRequired,
  onMoveAttachment: PropTypes.func.isRequired,
  onDuplicateAttachment: PropTypes.func.isRequired,
  onAttachmentChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

LegalAttachmentsCard.defaultProps = {
  disabled: false
};

import PropTypes from 'prop-types';
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Card, Button, TextInput, TextArea } from '../../../components/ui/index.js';

export default function LegalSectionsCard({
  sections,
  onAddSection,
  onRemoveSection,
  onMoveSection,
  onDuplicateSection,
  onSectionChange,
  disabled
}) {
  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Sections</h2>
            <p className="text-sm text-slate-500">Each section becomes an anchor in the public policy page.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddSection}
            icon={PlusIcon}
            disabled={disabled}
          >
            Add section
          </Button>
        </div>
        <div className="space-y-8">
          {sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-white/70 p-6 text-center text-sm text-slate-500">
              No sections yet. Add your first section to begin editing the policy body.
            </div>
          ) : null}
          {sections.map((section, index) => (
            <div key={`section-${section.id || index}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-primary">Section {index + 1}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={ArrowUpIcon}
                    onClick={() => onMoveSection(index, -1)}
                    disabled={disabled || index === 0}
                    aria-label={`Move section ${index + 1} up`}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={ArrowDownIcon}
                    onClick={() => onMoveSection(index, 1)}
                    disabled={disabled || index === sections.length - 1}
                    aria-label={`Move section ${index + 1} down`}
                  >
                    Move down
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={DocumentDuplicateIcon}
                    onClick={() => onDuplicateSection(index)}
                    disabled={disabled}
                    aria-label={`Duplicate section ${index + 1}`}
                  >
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={TrashIcon}
                    onClick={() => onRemoveSection(index)}
                    disabled={disabled}
                    aria-label={`Remove section ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Section ID"
                  value={section.id}
                  onChange={(event) => onSectionChange(index, 'id', event.target.value)}
                  hint="Used for internal references"
                  disabled={disabled}
                />
                <TextInput
                  label="Anchor"
                  value={section.anchor}
                  onChange={(event) => onSectionChange(index, 'anchor', event.target.value)}
                  hint="Optional override for the URL hash"
                  disabled={disabled}
                />
              </div>
              <TextInput
                className="mt-4"
                label="Heading"
                value={section.title}
                onChange={(event) => onSectionChange(index, 'title', event.target.value)}
                disabled={disabled}
              />
              <TextInput
                className="mt-4"
                label="Summary (optional)"
                value={section.summary}
                onChange={(event) => onSectionChange(index, 'summary', event.target.value)}
                disabled={disabled}
              />
              <TextArea
                className="mt-4"
                label="Body"
                rows={8}
                hint="Separate paragraphs with blank lines."
                value={section.body}
                onChange={(event) => onSectionChange(index, 'body', event.target.value)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

LegalSectionsCard.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      anchor: PropTypes.string,
      title: PropTypes.string,
      summary: PropTypes.string,
      body: PropTypes.string
    })
  ).isRequired,
  onAddSection: PropTypes.func.isRequired,
  onRemoveSection: PropTypes.func.isRequired,
  onMoveSection: PropTypes.func.isRequired,
  onDuplicateSection: PropTypes.func.isRequired,
  onSectionChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

LegalSectionsCard.defaultProps = {
  disabled: false
};

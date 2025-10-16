import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, TextInput } from '../../components/ui/index.js';

const SummaryHighlightsPanel = forwardRef(function SummaryHighlightsPanel(
  { notes, onAdd, onChange, onRemove, isFocused },
  ref
) {
  return (
    <section
      ref={ref}
      className={`rounded-2xl border ${isFocused ? 'border-primary' : 'border-slate-200'} bg-slate-50/50 p-5 transition-colors`}
    >
      <h3 className="text-lg font-semibold text-primary">Operating window highlights</h3>
      <p className="mt-1 text-sm text-slate-600">
        These notes appear alongside the operating window summary to guide administrators on key focus areas.
      </p>
      <div className="mt-4 space-y-3">
        {notes.map((note, index) => (
          <div key={`note-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <TextInput
              label={`Highlight ${index + 1}`}
              value={note}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder="Escalations under control across UK regions"
              className="flex-1"
            />
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              icon={TrashIcon}
              onClick={() => onRemove(index)}
              disabled={notes.length === 1}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" size="sm" icon={PlusIcon} className="mt-4" onClick={onAdd}>
        Add highlight
      </Button>
    </section>
  );
});

SummaryHighlightsPanel.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAdd: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  isFocused: PropTypes.bool
};

SummaryHighlightsPanel.defaultProps = {
  isFocused: false
};

export default SummaryHighlightsPanel;

import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/index.js';
import CardEditor from './CardEditor.jsx';

const CustomCardsPanel = forwardRef(function CustomCardsPanel(
  { cards, onAdd, onSave, onDelete, busyId, tones, isFocused },
  ref
) {
  return (
    <section
      ref={ref}
      className={`rounded-2xl border ${isFocused ? 'border-primary' : 'border-slate-200'} bg-slate-50/50 p-5 transition-colors`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Custom dashboard cards</h3>
          <p className="text-sm text-slate-600">
            Add or edit callouts that appear alongside the default command metrics. Each card can link to deeper workflows.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" icon={PlusIcon} onClick={onAdd}>
          New dashboard card
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        {cards.length === 0 ? (
          <p className="text-sm text-slate-500">No additional cards configured yet.</p>
        ) : (
          cards.map((card) => (
            <CardEditor
              key={card.id}
              card={card}
              tones={tones}
              onSave={onSave}
              onDelete={onDelete}
              busy={busyId === card.id}
            />
          ))
        )}
      </div>
    </section>
  );
});

CustomCardsPanel.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
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
    }).isRequired
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  busyId: PropTypes.string,
  tones: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  isFocused: PropTypes.bool
};

CustomCardsPanel.defaultProps = {
  busyId: null,
  isFocused: false
};

export default CustomCardsPanel;

import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/index.js';
import CardEditor from '../commandMetrics/CardEditor.jsx';

const CrewCustomCardsPanel = forwardRef(function CrewCustomCardsPanel(
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
          <h3 className="text-lg font-semibold text-primary">Crew dashboard cards</h3>
          <p className="text-sm text-slate-600">
            Configure spotlight cards that surface on the crew control centre. Use these to link into rosters, safety workflows,
            or deep analytics views.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" icon={PlusIcon} onClick={onAdd}>
          Add crew card
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        {cards.length === 0 ? (
          <p className="text-sm text-slate-500">No additional crew cards configured yet.</p>
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

CrewCustomCardsPanel.propTypes = {
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

CrewCustomCardsPanel.defaultProps = {
  busyId: null,
  isFocused: false
};

export default CrewCustomCardsPanel;

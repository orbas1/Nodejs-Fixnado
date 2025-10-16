import PropTypes from 'prop-types';
import {
  ArchiveBoxArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import StatusPill from '../../ui/StatusPill.jsx';
import Spinner from '../../ui/Spinner.jsx';
import { CARD_CLASS, CARD_GRID_CLASS } from './constants.js';
import { formatDate, toCurrency, toneForRisk } from './utils.js';

export default function AutomationBacklogGrid({ loading, error, items, onEdit, onDetail, onArchive }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700">
        <p className="font-semibold">{error}</p>
        <p className="mt-2 text-sm">Try refreshing or check your network connection.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-secondary/60 p-12 text-center text-slate-600">
        <p className="text-lg font-semibold text-primary">No automation initiatives match your filters.</p>
        <p className="mt-2 text-sm">Create a new initiative or adjust the filters to see archived work.</p>
      </div>
    );
  }

  return (
    <div className={CARD_GRID_CLASS}>
      {items.map((item) => (
        <article key={item.id} className={CARD_CLASS}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">{item.name}</h3>
              <p className="mt-1 text-sm text-slate-600 line-clamp-3">{item.summary}</p>
            </div>
            <StatusPill tone={toneForRisk(item.riskLevel)}>{item.status.replace(/_/g, ' ')}</StatusPill>
          </div>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-primary/70">Owner</dt>
              <dd>{item.owner || 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary/70">Stage & readiness</dt>
              <dd>
                {item.stage} • {item.readinessScore ?? 0}% ready
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-primary/70">Next milestone</dt>
              <dd>{formatDate(item.nextMilestoneOn)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary/70">Estimated savings</dt>
              <dd>{toCurrency(item.estimatedSavings, item.savingsCurrency || 'GBP')}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={PencilSquareIcon} iconPosition="start" onClick={() => onEdit(item)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowTopRightOnSquareIcon}
              iconPosition="end"
              onClick={() => onDetail(item)}
            >
              View details
            </Button>
            {!item.archivedAt ? (
              <Button
                variant="ghost"
                size="sm"
                icon={ArchiveBoxArrowDownIcon}
                iconPosition="start"
                onClick={() => onArchive(item)}
              >
                Archive
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

AutomationBacklogGrid.propTypes = {
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDetail: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired
};

AutomationBacklogGrid.defaultProps = {
  error: null
};

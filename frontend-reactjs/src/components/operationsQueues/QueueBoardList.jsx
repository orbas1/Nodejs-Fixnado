import PropTypes from 'prop-types';
import clsx from 'clsx';
import { QueueListIcon, PencilSquareIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/index.js';
import { STATUS_BADGE_CLASSES } from './constants.js';
import { formatTimestamp } from './formUtils.js';

function QueueCard({ board, isActive, onSelect, onViewDetail, onOpenWorkspace }) {
  const badgeClass = STATUS_BADGE_CLASSES[board.status] ?? STATUS_BADGE_CLASSES.operational;
  return (
    <div
      className={clsx(
        'flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition',
        isActive
          ? 'border-accent bg-white shadow-glow'
          : 'border-accent/10 bg-white/80 hover:border-accent/40 hover:shadow-md'
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Queue</p>
            <h3 className="text-xl font-semibold text-primary">{board.title}</h3>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
            {board.status ?? 'operational'}
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-600">{board.summary || 'No summary provided yet.'}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div>
            <dt className="font-medium text-slate-600">Owner</dt>
            <dd className="mt-1">{board.owner || 'Unassigned'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Priority</dt>
            <dd className="mt-1">{board.priority ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Last update</dt>
            <dd className="mt-1">{formatTimestamp(board.updatedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Watchers</dt>
            <dd className="mt-1">{(board.metadata?.watchers ?? []).join(', ') || 'None'}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          icon={PencilSquareIcon}
          iconPosition="start"
          onClick={() => {
            onSelect(board.id);
            onOpenWorkspace();
          }}
        >
          Manage queue
        </Button>
        <Button
          type="button"
          variant="secondary"
          icon={ArrowTopRightOnSquareIcon}
          iconPosition="start"
          onClick={() => onViewDetail(board.id)}
        >
          View queue detail
        </Button>
      </div>
    </div>
  );
}

QueueCard.propTypes = {
  board: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    summary: PropTypes.string,
    owner: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.number,
    updatedAt: PropTypes.string,
    metadata: PropTypes.shape({
      watchers: PropTypes.arrayOf(PropTypes.string)
    })
  }).isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onViewDetail: PropTypes.func.isRequired,
  onOpenWorkspace: PropTypes.func.isRequired
};

QueueCard.defaultProps = {
  isActive: false
};

export default function QueueBoardList({ boards, selectedBoardId, onSelect, onViewDetail, onOpenWorkspace }) {
  if (!boards.length) {
    return (
      <div className="rounded-3xl border border-dashed border-accent/30 bg-white/70 p-10 text-center">
        <QueueListIcon className="mx-auto h-12 w-12 text-accent" />
        <h3 className="mt-4 text-lg font-semibold text-primary">No operations queues yet</h3>
        <p className="mt-2 text-sm text-slate-600">
          Create your first queue to orchestrate verifications, dispute workflows, or insurance badge reviews.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {boards.map((board) => (
        <QueueCard
          key={board.id}
          board={board}
          isActive={board.id === selectedBoardId}
          onSelect={onSelect}
          onViewDetail={onViewDetail}
          onOpenWorkspace={onOpenWorkspace}
        />
      ))}
    </div>
  );
}

QueueBoardList.propTypes = {
  boards: PropTypes.arrayOf(QueueCard.propTypes.board).isRequired,
  selectedBoardId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onViewDetail: PropTypes.func.isRequired,
  onOpenWorkspace: PropTypes.func.isRequired
};

QueueBoardList.defaultProps = {
  selectedBoardId: null
};

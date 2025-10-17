import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Button, Card, SegmentedControl, StatusPill } from '../../../components/ui/index.js';
import {
  STATUS_FILTERS,
  STATUS_SHORT_LABELS,
  getStatusLabel,
  getStatusTone,
  formatCurrency,
  formatDate
} from '../utils.js';

function CaseCard({ disputeCase, selected, onSelect }) {
  const amount = formatCurrency(disputeCase.amountDisputed, disputeCase.currency);
  const dueLabel = formatDate(disputeCase.dueAt);
  const slaLabel = formatDate(disputeCase.slaDueAt);
  const statusLabel = STATUS_SHORT_LABELS[disputeCase.status] || getStatusLabel(disputeCase.status);
  const tone = getStatusTone(disputeCase.status);

  return (
    <Card
      as="button"
      type="button"
      interactive
      onClick={() => onSelect(disputeCase)}
      className={clsx(
        'h-full w-full text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected ? 'border-primary shadow-lg shadow-primary/10' : 'border-slate-200 hover:border-primary/40'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{disputeCase.caseNumber}</p>
          <h3 className="text-lg font-semibold text-primary">{disputeCase.title}</h3>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{disputeCase.category}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill tone={tone}>{statusLabel}</StatusPill>
          {disputeCase.requiresFollowUp ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Follow</span>
          ) : null}
        </div>
      </div>

      <dl className="mt-6 grid gap-3 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Due</dt>
          <dd className="text-sm font-medium text-primary">{dueLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">SLA</dt>
          <dd className="text-sm font-medium text-primary">{slaLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Amount</dt>
          <dd className="text-sm font-semibold text-primary">{amount}</dd>
        </div>
        {disputeCase.assignedOwner ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Owner</dt>
            <dd className="text-sm font-medium text-primary">{disputeCase.assignedOwner}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}

CaseCard.propTypes = {
  disputeCase: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    category: PropTypes.string,
    caseNumber: PropTypes.string,
    amountDisputed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    dueAt: PropTypes.string,
    slaDueAt: PropTypes.string,
    assignedOwner: PropTypes.string,
    requiresFollowUp: PropTypes.bool
  }).isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired
};

CaseCard.defaultProps = {
  selected: false
};

function filterCases(cases, filter) {
  if (!Array.isArray(cases)) {
    return [];
  }
  if (!filter || filter === 'all') {
    return cases;
  }
  return cases.filter((entry) => entry.status === filter);
}

export default function CaseList({ cases, filter, onFilterChange, onSelect, selectedCaseId, onCreate }) {
  const filtered = filterCases(cases, filter);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl name="Dispute status" value={filter} options={STATUS_FILTERS} onChange={onFilterChange} />
        <Button variant="secondary" size="sm" onClick={onCreate}>
          New
        </Button>
      </header>

      {filtered.length === 0 ? (
        <Card className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center">
          <p className="text-base font-semibold text-primary">No cases yet</p>
          <p className="text-sm text-slate-500">Create your first dispute case to start tracking actions and files.</p>
          <Button onClick={onCreate}>Create</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((disputeCase) => (
            <CaseCard
              key={disputeCase.id}
              disputeCase={disputeCase}
              selected={disputeCase.id === selectedCaseId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}

CaseList.propTypes = {
  cases: PropTypes.arrayOf(CaseCard.propTypes.disputeCase).isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedCaseId: PropTypes.string,
  onCreate: PropTypes.func.isRequired
};

CaseList.defaultProps = {
  selectedCaseId: null
};

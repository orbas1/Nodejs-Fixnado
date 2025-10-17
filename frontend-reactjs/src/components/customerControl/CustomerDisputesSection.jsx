import PropTypes from 'prop-types';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CurrencyPoundIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { InlineBanner } from './FormControls.jsx';
import DisputeCaseModal from './DisputeCaseModal.jsx';
import DisputeTaskModal from './DisputeTaskModal.jsx';
import DisputeNoteModal from './DisputeNoteModal.jsx';
import DisputeEvidenceModal from './DisputeEvidenceModal.jsx';

const statusColours = {
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-emerald-100 text-emerald-700',
  under_review: 'bg-amber-100 text-amber-700',
  awaiting_customer: 'bg-sky-100 text-sky-700',
  resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  closed: 'bg-slate-200 text-slate-600'
};

const severityColours = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
  critical: 'bg-rose-200 text-rose-800 font-semibold'
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const formatCurrency = (amount, currency) => {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'GBP',
      currencyDisplay: 'symbol'
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || 'GBP'}`;
  }
};

const MetricsSummary = ({ metrics }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-3xl border border-accent/10 bg-white/95 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-primary/60">Open cases</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{metrics.statusCounts.open + metrics.statusCounts.under_review}</p>
      <p className="text-xs text-slate-500">Includes open and under review cases.</p>
    </div>
    <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-amber-600">Follow-ups</p>
      <p className="mt-2 text-2xl font-semibold text-amber-700">{metrics.requiresFollowUp}</p>
      <p className="text-xs text-amber-700">Cases flagged for manual follow-up.</p>
    </div>
    <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-sky-700">Active tasks</p>
      <p className="mt-2 text-2xl font-semibold text-sky-800">{metrics.activeTasks}</p>
      <p className="text-xs text-sky-700">Cases with outstanding checklist items.</p>
    </div>
    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-emerald-600">Amount in dispute</p>
      <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-emerald-700">
        <CurrencyPoundIcon className="h-5 w-5" />
        {formatCurrency(metrics.totalDisputedAmount, 'GBP')}
      </p>
      <p className="text-xs text-emerald-700">Across {metrics.totalCases} case{metrics.totalCases === 1 ? '' : 's'}.</p>
    </div>
  </div>
);

MetricsSummary.propTypes = {
  metrics: PropTypes.shape({
    statusCounts: PropTypes.shape({
      draft: PropTypes.number,
      open: PropTypes.number,
      under_review: PropTypes.number,
      awaiting_customer: PropTypes.number,
      resolved: PropTypes.number,
      closed: PropTypes.number
    }).isRequired,
    requiresFollowUp: PropTypes.number.isRequired,
    activeTasks: PropTypes.number.isRequired,
    totalDisputedAmount: PropTypes.number.isRequired,
    totalCases: PropTypes.number.isRequired
  }).isRequired
};

const DisputeCaseCard = ({
  dispute,
  onEditCase,
  onDeleteCase,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onOpenNote,
  onEditNote,
  onDeleteNote,
  onOpenEvidence,
  onEditEvidence,
  onDeleteEvidence
}) => {
  const statusClass = statusColours[dispute.status] || 'bg-slate-100 text-slate-600';
  const severityClass = severityColours[dispute.severity] || 'bg-slate-100 text-slate-600';
  const viewFinance = () => {
    const reference = dispute.caseNumber || dispute.id;
    window.open(`/dashboards/finance/disputes/${reference}`, '_blank', 'noopener');
  };

  return (
    <article className="space-y-4 rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold text-primary">{dispute.title || 'Untitled dispute'}</h4>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
              {dispute.status.replace('_', ' ')}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClass}`}>
              {dispute.severity}
            </span>
          </div>
          <p className="text-xs uppercase tracking-wide text-primary/50">Case {dispute.caseNumber || 'not assigned'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={viewFinance}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary hover:border-slate-300"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Finance console
          </button>
          <button
            type="button"
            onClick={() => onEditCase(dispute)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary hover:border-slate-300"
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDeleteCase(dispute.id)}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-300"
          >
            <TrashIcon className="h-4 w-4" /> Remove
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-primary">
          <p className="text-xs uppercase tracking-wide text-primary/60">Amount in dispute</p>
          <p className="mt-1 text-base font-semibold text-primary">
            {formatCurrency(Number.parseFloat(dispute.amountDisputed), dispute.currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-primary">
          <p className="text-xs uppercase tracking-wide text-primary/60">Opened</p>
          <p className="mt-1 text-base font-semibold text-primary">{formatDateTime(dispute.openedAt)}</p>
        </div>
        <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-primary">
          <p className="text-xs uppercase tracking-wide text-primary/60">Due next</p>
          <p className="mt-1 text-base font-semibold text-primary">{formatDateTime(dispute.dueAt)}</p>
        </div>
        <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-primary">
          <p className="text-xs uppercase tracking-wide text-primary/60">Next step</p>
          <p className="mt-1 text-sm text-primary">{dispute.nextStep || 'No next action defined.'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="space-y-3 rounded-2xl border border-accent/10 bg-white p-4 shadow-inner">
          <header className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-primary">Follow-up checklist</h5>
            <button
              type="button"
              onClick={() => onOpenTask(dispute)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Task
            </button>
          </header>
          {dispute.tasks.length === 0 ? (
            <p className="text-xs text-slate-500">No tasks yet. Create actionable steps to keep the case moving.</p>
          ) : (
            <ul className="space-y-2">
              {dispute.tasks.map((task) => (
                <li key={task.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-primary">{task.label}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Due {formatDateTime(task.dueAt)}</p>
                  {task.assignedTo ? (
                    <p className="text-[11px] text-slate-500">Owner: {task.assignedTo}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEditTask(dispute, task)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-primary hover:border-slate-300"
                    >
                      <PencilSquareIcon className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(dispute.id, task.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-600 hover:border-rose-300"
                    >
                      <TrashIcon className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-accent/10 bg-white p-4 shadow-inner">
          <header className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-primary">Case notes</h5>
            <button
              type="button"
              onClick={() => onOpenNote(dispute)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Note
            </button>
          </header>
          {dispute.notes.length === 0 ? (
            <p className="text-xs text-slate-500">Capture decision logs, escalations, and customer updates here.</p>
          ) : (
            <ul className="space-y-2">
              {dispute.notes.map((note) => (
                <li key={note.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                        {note.noteType}
                      </span>
                      <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary/60">
                        {note.visibility}
                      </span>
                      {note.pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          <ExclamationTriangleIcon className="h-3 w-3" /> Pinned
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500">{formatDateTime(note.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-primary">{note.body}</p>
                  {note.nextSteps ? (
                    <p className="mt-1 text-[11px] text-slate-500">Next steps: {note.nextSteps}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEditNote(dispute, note)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-primary hover:border-slate-300"
                    >
                      <PencilSquareIcon className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(dispute.id, note.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-600 hover:border-rose-300"
                    >
                      <TrashIcon className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-accent/10 bg-white p-4 shadow-inner">
          <header className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-primary">Evidence & files</h5>
            <button
              type="button"
              onClick={() => onOpenEvidence(dispute)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Evidence
            </button>
          </header>
          {dispute.evidence.length === 0 ? (
            <p className="text-xs text-slate-500">Attach photos, invoices, and documents supporting the dispute.</p>
          ) : (
            <ul className="space-y-2">
              {dispute.evidence.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                  <p className="font-semibold text-primary">{item.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>{item.fileType || 'File'}</span>
                    <button
                      type="button"
                      onClick={() => window.open(item.fileUrl, '_blank', 'noopener')}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-primary hover:border-slate-300"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3" /> View file
                    </button>
                  </div>
                  {item.notes ? <p className="mt-1 text-[11px] text-slate-500">{item.notes}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEditEvidence(dispute, item)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-primary hover:border-slate-300"
                    >
                      <PencilSquareIcon className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEvidence(dispute.id, item.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-600 hover:border-rose-300"
                    >
                      <TrashIcon className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {dispute.summary ? (
        <div className="rounded-2xl bg-secondary/60 p-4 text-sm text-primary">
          <p className="text-xs uppercase tracking-wide text-primary/60">Summary</p>
          <p className="mt-1 text-sm text-primary">{dispute.summary}</p>
        </div>
      ) : null}
      {dispute.resolutionNotes ? (
        <div className="rounded-2xl bg-secondary/60 p-4 text-sm text-primary">
          <p className="text-xs uppercase tracking-wide text-primary/60">Resolution notes</p>
          <p className="mt-1 text-sm text-primary">{dispute.resolutionNotes}</p>
        </div>
      ) : null}
    </article>
  );
};

DisputeCaseCard.propTypes = {
  dispute: PropTypes.shape({
    id: PropTypes.string.isRequired,
    caseNumber: PropTypes.string,
    title: PropTypes.string,
    status: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    category: PropTypes.string,
    amountDisputed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    openedAt: PropTypes.string,
    dueAt: PropTypes.string,
    nextStep: PropTypes.string,
    summary: PropTypes.string,
    resolutionNotes: PropTypes.string,
    tasks: PropTypes.arrayOf(PropTypes.object).isRequired,
    notes: PropTypes.arrayOf(PropTypes.object).isRequired,
    evidence: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired,
  onEditCase: PropTypes.func.isRequired,
  onDeleteCase: PropTypes.func.isRequired,
  onOpenTask: PropTypes.func.isRequired,
  onEditTask: PropTypes.func.isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  onOpenNote: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onOpenEvidence: PropTypes.func.isRequired,
  onEditEvidence: PropTypes.func.isRequired,
  onDeleteEvidence: PropTypes.func.isRequired
};

const CustomerDisputesSection = ({
  disputes,
  metrics,
  caseStatus,
  caseModalOpen,
  activeCase,
  onCreateCase,
  onEditCase,
  onCloseCaseModal,
  onSubmitCase,
  onDeleteCase,
  caseSaving,
  taskStatus,
  taskModalOpen,
  activeTask,
  onOpenTask,
  onEditTask,
  onCloseTaskModal,
  onSubmitTask,
  onDeleteTask,
  taskSaving,
  noteStatus,
  noteModalOpen,
  activeNote,
  onOpenNote,
  onEditNote,
  onCloseNoteModal,
  onSubmitNote,
  onDeleteNote,
  noteSaving,
  evidenceStatus,
  evidenceModalOpen,
  activeEvidence,
  onOpenEvidence,
  onEditEvidence,
  onCloseEvidenceModal,
  onSubmitEvidence,
  onDeleteEvidence,
  evidenceSaving,
  title,
  description,
  openCaseLabel,
  emptyStateMessage
}) => (
  <section className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        onClick={onCreateCase}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90"
      >
        <PlusIcon className="h-4 w-4" /> {openCaseLabel}
      </button>
    </header>

    <MetricsSummary metrics={metrics} />

    <InlineBanner tone={caseStatus?.tone} message={caseStatus?.message} />

    {disputes.length === 0 ? (
      <div className="rounded-3xl border border-dashed border-accent/20 bg-secondary/60 p-6 text-sm text-slate-600">
        {emptyStateMessage}
      </div>
    ) : (
      <div className="space-y-4">
        {disputes.map((dispute) => (
          <DisputeCaseCard
            key={dispute.id}
            dispute={dispute}
            onEditCase={onEditCase}
            onDeleteCase={onDeleteCase}
            onOpenTask={onOpenTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onOpenNote={onOpenNote}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
            onOpenEvidence={onOpenEvidence}
            onEditEvidence={onEditEvidence}
            onDeleteEvidence={onDeleteEvidence}
          />
        ))}
      </div>
    )}

    <DisputeCaseModal
      open={caseModalOpen}
      disputeCase={activeCase}
      onClose={onCloseCaseModal}
      onSubmit={onSubmitCase}
      saving={caseSaving}
      status={caseStatus}
      onDelete={onDeleteCase}
    />

    <DisputeTaskModal
      open={taskModalOpen}
      task={activeTask}
      onClose={onCloseTaskModal}
      onSubmit={onSubmitTask}
      saving={taskSaving}
      status={taskStatus}
    />

    <DisputeNoteModal
      open={noteModalOpen}
      note={activeNote}
      onClose={onCloseNoteModal}
      onSubmit={onSubmitNote}
      saving={noteSaving}
      status={noteStatus}
    />

    <DisputeEvidenceModal
      open={evidenceModalOpen}
      evidence={activeEvidence}
      onClose={onCloseEvidenceModal}
      onSubmit={onSubmitEvidence}
      saving={evidenceSaving}
      status={evidenceStatus}
    />
  </section>
);

CustomerDisputesSection.propTypes = {
  disputes: PropTypes.arrayOf(PropTypes.object).isRequired,
  metrics: PropTypes.shape({
    statusCounts: PropTypes.object,
    requiresFollowUp: PropTypes.number,
    activeTasks: PropTypes.number,
    totalDisputedAmount: PropTypes.number,
    totalCases: PropTypes.number
  }).isRequired,
  caseStatus: PropTypes.shape({ tone: PropTypes.string, message: PropTypes.string }),
  caseModalOpen: PropTypes.bool.isRequired,
  activeCase: PropTypes.object,
  onCreateCase: PropTypes.func.isRequired,
  onEditCase: PropTypes.func.isRequired,
  onCloseCaseModal: PropTypes.func.isRequired,
  onSubmitCase: PropTypes.func.isRequired,
  onDeleteCase: PropTypes.func.isRequired,
  caseSaving: PropTypes.bool,
  taskStatus: PropTypes.shape({ tone: PropTypes.string, message: PropTypes.string }),
  taskModalOpen: PropTypes.bool.isRequired,
  activeTask: PropTypes.object,
  onOpenTask: PropTypes.func.isRequired,
  onEditTask: PropTypes.func.isRequired,
  onCloseTaskModal: PropTypes.func.isRequired,
  onSubmitTask: PropTypes.func.isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  taskSaving: PropTypes.bool,
  noteStatus: PropTypes.shape({ tone: PropTypes.string, message: PropTypes.string }),
  noteModalOpen: PropTypes.bool.isRequired,
  activeNote: PropTypes.object,
  onOpenNote: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  onCloseNoteModal: PropTypes.func.isRequired,
  onSubmitNote: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  noteSaving: PropTypes.bool,
  evidenceStatus: PropTypes.shape({ tone: PropTypes.string, message: PropTypes.string }),
  evidenceModalOpen: PropTypes.bool.isRequired,
  activeEvidence: PropTypes.object,
  onOpenEvidence: PropTypes.func.isRequired,
  onEditEvidence: PropTypes.func.isRequired,
  onCloseEvidenceModal: PropTypes.func.isRequired,
  onSubmitEvidence: PropTypes.func.isRequired,
  onDeleteEvidence: PropTypes.func.isRequired,
  evidenceSaving: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  openCaseLabel: PropTypes.string,
  emptyStateMessage: PropTypes.string
};

CustomerDisputesSection.defaultProps = {
  caseStatus: null,
  activeCase: null,
  caseSaving: false,
  taskStatus: null,
  activeTask: null,
  taskSaving: false,
  noteStatus: null,
  activeNote: null,
  noteSaving: false,
  evidenceStatus: null,
  activeEvidence: null,
  evidenceSaving: false,
  title: 'Disputes management',
  description:
    'Track active disputes, assign owners, log updates, and attach evidence so finance and support teams stay in lockstep.',
  openCaseLabel: 'Open dispute case',
  emptyStateMessage:
    'No dispute cases yet. Create your first case to coordinate escalation notes, tasks, and supporting evidence in one place.'
};

export default CustomerDisputesSection;

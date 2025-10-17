import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, SegmentedControl, StatusPill } from '../../../components/ui/index.js';
import {
  getStatusLabel,
  getStatusTone,
  formatCurrency,
  formatDate,
  formatDateTime,
  SEVERITY_OPTIONS,
  STATUS_SHORT_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES
} from '../utils.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
  { id: 'files', label: 'Files' }
];

const EMPTY_ARRAY = Object.freeze([]);

function sortTasks(tasks = EMPTY_ARRAY) {
  return tasks
    .slice()
    .sort((a, b) => {
      const aDue = a?.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b?.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      if (aDue === bDue) {
        const aCreated = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aCreated - bCreated;
      }
      return aDue - bDue;
    });
}

export default function CaseDrawer({
  open,
  disputeCase,
  onClose,
  onEdit,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onAddEvidence,
  onEditEvidence,
  onDeleteEvidence
}) {
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (open) {
      setTab('overview');
    }
  }, [open, disputeCase?.id]);

  const tasks = useMemo(() => sortTasks(disputeCase?.tasks ?? EMPTY_ARRAY), [disputeCase?.tasks]);
  const notes = useMemo(() => (disputeCase?.notes ?? EMPTY_ARRAY).slice(), [disputeCase?.notes]);
  const evidence = useMemo(() => (disputeCase?.evidence ?? EMPTY_ARRAY).slice(), [disputeCase?.evidence]);

  if (!disputeCase) {
    return null;
  }

  const statusLabel = STATUS_SHORT_LABELS[disputeCase.status] || getStatusLabel(disputeCase.status);
  const statusTone = getStatusTone(disputeCase.status);
  const severityLabel =
    SEVERITY_OPTIONS.find((option) => option.value === disputeCase.severity)?.label || disputeCase.severity;
  const amount = formatCurrency(disputeCase.amountDisputed, disputeCase.currency);
  const platformDispute = disputeCase.platformDispute ?? null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-xl">
                <div className="flex h-full flex-col">
                  <header className="border-b border-slate-200 bg-white/90 px-8 py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{disputeCase.caseNumber}</p>
                        <Dialog.Title className="text-2xl font-semibold text-primary">{disputeCase.title}</Dialog.Title>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                          {severityLabel ? <StatusPill tone="info">{severityLabel}</StatusPill> : null}
                          {disputeCase.requiresFollowUp ? (
                            <StatusPill tone="warning">Follow</StatusPill>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500">{disputeCase.summary}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="secondary" size="sm" onClick={() => onEdit(disputeCase)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onDelete(disputeCase)}>
                          Remove
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </header>

                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/60 px-8 py-4">
                      <SegmentedControl name="Case view" value={tab} options={TABS} onChange={setTab} />
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-6">
                      {tab === 'overview' ? (
                        <div className="grid gap-6 lg:grid-cols-2">
                          <dl className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6">
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Amount</dt>
                              <dd className="text-lg font-semibold text-primary">{amount}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Opened</dt>
                              <dd className="text-sm text-slate-600">{formatDate(disputeCase.openedAt)}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Due</dt>
                              <dd className="text-sm text-slate-600">{formatDate(disputeCase.dueAt)}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">SLA</dt>
                              <dd className="text-sm text-slate-600">{formatDate(disputeCase.slaDueAt)}</dd>
                            </div>
                          </dl>
                          <dl className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6">
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Team</dt>
                              <dd className="text-sm font-medium text-primary">{disputeCase.assignedTeam || 'Unassigned'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Owner</dt>
                              <dd className="text-sm font-medium text-primary">{disputeCase.assignedOwner || 'Unassigned'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Next step</dt>
                              <dd className="text-sm text-slate-600">{disputeCase.nextStep || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Reference</dt>
                              <dd className="text-sm text-slate-600">{disputeCase.externalReference || '—'}</dd>
                            </div>
                          </dl>
                          {disputeCase.resolutionNotes ? (
                            <div className="lg:col-span-2">
                              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Resolution</h3>
                              <p className="mt-3 rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
                                {disputeCase.resolutionNotes}
                              </p>
                            </div>
                          ) : null}
                          {platformDispute ? (
                            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white/80 p-6">
                              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Platform</h3>
                              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reference</p>
                                  <p className="text-sm font-medium text-primary">
                                    {platformDispute.id || platformDispute.reference || '—'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
                                  <p className="text-sm text-slate-600">{platformDispute.status || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Opened</p>
                                  <p className="text-sm text-slate-600">{formatDate(platformDispute.openedAt)}</p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {tab === 'tasks' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Tasks</h3>
                            <Button size="sm" onClick={() => onAddTask(disputeCase)}>
                              Add
                            </Button>
                          </div>
                          {tasks.length === 0 ? (
                            <p className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                              No tasks yet.
                            </p>
                          ) : (
                            <ul className="space-y-3">
                              {tasks.map((task) => (
                                <li key={task.id} className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-primary">{task.label}</p>
                                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        <StatusPill tone={TASK_STATUS_TONES[task.status] || 'neutral'}>
                                          {TASK_STATUS_LABELS[task.status] || task.status}
                                        </StatusPill>
                                        {task.assignedTo ? <span>Owner {task.assignedTo}</span> : null}
                                        {task.dueAt ? <span>Due {formatDate(task.dueAt)}</span> : null}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => onEditTask(task)}>
                                        Edit
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => onDeleteTask(task)}>
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                  {task.instructions ? (
                                    <p className="mt-3 text-sm text-slate-600">{task.instructions}</p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null}

                      {tab === 'notes' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Notes</h3>
                            <Button size="sm" onClick={() => onAddNote(disputeCase)}>
                              Add
                            </Button>
                          </div>
                          {notes.length === 0 ? (
                            <p className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                              No notes yet.
                            </p>
                          ) : (
                            <ul className="space-y-3">
                              {notes.map((note) => (
                                <li key={note.id} className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        {note.noteType ? <span className="font-semibold uppercase">{note.noteType}</span> : null}
                                        {note.visibility ? <span>{note.visibility}</span> : null}
                                        {note.createdAt ? <span>{formatDateTime(note.createdAt)}</span> : null}
                                        {note.pinned ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Pin</span> : null}
                                      </div>
                                      <p className="text-sm text-slate-600">{note.body}</p>
                                      {note.nextSteps ? (
                                        <p className="text-xs text-slate-500">Next: {note.nextSteps}</p>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => onEditNote(note)}>
                                        Edit
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => onDeleteNote(note)}>
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null}

                      {tab === 'files' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Files</h3>
                            <Button size="sm" onClick={() => onAddEvidence(disputeCase)}>
                              Add
                            </Button>
                          </div>
                          {evidence.length === 0 ? (
                            <p className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                              No files yet.
                            </p>
                          ) : (
                            <ul className="space-y-3">
                              {evidence.map((item) => (
                                <li key={item.id} className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold text-primary">{item.label}</p>
                                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                        {item.fileType ? <span>{item.fileType}</span> : null}
                                        {item.createdAt ? <span>{formatDateTime(item.createdAt)}</span> : null}
                                        {item.uploader?.name ? <span>By {item.uploader.name}</span> : null}
                                      </div>
                                      {item.notes ? <p className="text-sm text-slate-600">{item.notes}</p> : null}
                                      {item.fileUrl ? (
                                        <a
                                          href={item.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                                        >
                                          Open file
                                        </a>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => onEditEvidence(item)}>
                                        Edit
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => onDeleteEvidence(item)}>
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CaseDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  disputeCase: PropTypes.shape({
    id: PropTypes.string.isRequired,
    caseNumber: PropTypes.string,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    severity: PropTypes.string,
    summary: PropTypes.string,
    nextStep: PropTypes.string,
    assignedTeam: PropTypes.string,
    assignedOwner: PropTypes.string,
    resolutionNotes: PropTypes.string,
    externalReference: PropTypes.string,
    amountDisputed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    openedAt: PropTypes.string,
    dueAt: PropTypes.string,
    slaDueAt: PropTypes.string,
    requiresFollowUp: PropTypes.bool,
    platformDispute: PropTypes.shape({
      id: PropTypes.string,
      reference: PropTypes.string,
      status: PropTypes.string,
      openedAt: PropTypes.string
    }),
    tasks: PropTypes.arrayOf(PropTypes.object),
    notes: PropTypes.arrayOf(PropTypes.object),
    evidence: PropTypes.arrayOf(PropTypes.object)
  }),
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddTask: PropTypes.func.isRequired,
  onEditTask: PropTypes.func.isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  onAddNote: PropTypes.func.isRequired,
  onEditNote: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onAddEvidence: PropTypes.func.isRequired,
  onEditEvidence: PropTypes.func.isRequired,
  onDeleteEvidence: PropTypes.func.isRequired
};

CaseDrawer.defaultProps = {
  disputeCase: null
};

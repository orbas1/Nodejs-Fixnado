import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArchiveBoxArrowDownIcon,
  DocumentTextIcon,
  LinkIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import StatusPill from '../../ui/StatusPill.jsx';
import { ensureArray, formatDate, toCurrency, toneForRisk } from './utils.js';

export default function AutomationBacklogDetailDialog({ open, item, onClose, onEdit, onArchive }) {
  return (
    <Transition show={open} as={Fragment}>
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
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl border border-accent/10 bg-white p-8 text-left shadow-2xl">
                {item ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Dialog.Title className="text-2xl font-semibold text-primary">{item.name}</Dialog.Title>
                        <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusPill tone={toneForRisk(item.riskLevel)}>{item.status.replace(/_/g, ' ')}</StatusPill>
                        <p className="text-xs uppercase tracking-wide text-primary/60">Stage: {item.stage}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-accent/10 bg-secondary/60 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Ownership</h4>
                        <dl className="mt-3 space-y-2 text-sm text-slate-600">
                          <div>
                            <dt className="font-semibold text-primary/70">Owner</dt>
                            <dd>{item.owner || 'Unassigned'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Sponsor</dt>
                            <dd>{item.sponsor || 'Not assigned'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Squad</dt>
                            <dd>{item.squad || 'Not assigned'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Allowed roles</dt>
                            <dd>{ensureArray(item.allowedRoles).join(', ') || 'admin'}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="rounded-2xl border border-accent/10 bg-secondary/60 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Timelines</h4>
                        <dl className="mt-3 space-y-2 text-sm text-slate-600">
                          <div>
                            <dt className="font-semibold text-primary/70">Expected launch</dt>
                            <dd>{formatDate(item.expectedLaunchAt)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Next milestone</dt>
                            <dd>{formatDate(item.nextMilestoneOn)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Last reviewed</dt>
                            <dd>{formatDate(item.lastReviewedAt)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Readiness</dt>
                            <dd>{item.readinessScore ?? 0}%</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-accent/10 bg-white/90 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Impact</h4>
                        <dl className="mt-3 space-y-2 text-sm text-slate-600">
                          <div>
                            <dt className="font-semibold text-primary/70">Target metric</dt>
                            <dd>{item.targetMetric || '—'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Baseline</dt>
                            <dd>{item.baselineMetric || '—'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Forecast</dt>
                            <dd>{item.forecastMetric || '—'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-primary/70">Estimated savings</dt>
                            <dd>{toCurrency(item.estimatedSavings, item.savingsCurrency || 'GBP')}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="rounded-2xl border border-accent/10 bg-white/90 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Notes</h4>
                        <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{item.notes || 'No notes yet.'}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Dependencies</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {ensureArray(item.dependencies).length === 0 ? (
                            <li>No dependencies logged.</li>
                          ) : (
                            ensureArray(item.dependencies).map((dependency, index) => (
                              <li key={`dep-${index}`} className="flex flex-col">
                                <span className="font-semibold text-primary/70">{dependency.label}</span>
                                <span>{dependency.status}</span>
                                {dependency.owner ? (
                                  <span className="text-xs text-slate-500">Owner: {dependency.owner}</span>
                                ) : null}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Blockers</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {ensureArray(item.blockers).length === 0 ? (
                            <li>No blockers captured.</li>
                          ) : (
                            ensureArray(item.blockers).map((blocker, index) => (
                              <li key={`blocker-${index}`} className="flex flex-col">
                                <span className="font-semibold text-primary/70">{blocker.label}</span>
                                <span>{blocker.status}</span>
                                {blocker.owner ? (
                                  <span className="text-xs text-slate-500">Owner: {blocker.owner}</span>
                                ) : null}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-accent/10 bg-white/90 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Attachments</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {ensureArray(item.attachments).length === 0 ? (
                            <li>No documents uploaded.</li>
                          ) : (
                            ensureArray(item.attachments).map((attachment, index) => (
                              <li key={`attachment-${index}`} className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2">
                                  <LinkIcon className="h-4 w-4 text-primary/60" />
                                  {attachment.label}
                                </span>
                                {attachment.url ? (
                                  <a
                                    href={attachment.url}
                                    className="text-sm font-semibold text-primary hover:text-primary/80"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open
                                  </a>
                                ) : null}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-accent/10 bg-white/90 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-primary/70">Reference imagery</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {ensureArray(item.images).length === 0 ? (
                            <li>No imagery linked.</li>
                          ) : (
                            ensureArray(item.images).map((image, index) => (
                              <li key={`image-${index}`} className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2">
                                  <DocumentTextIcon className="h-4 w-4 text-primary/60" />
                                  {image.label}
                                </span>
                                {image.url ? (
                                  <a
                                    href={image.url}
                                    className="text-sm font-semibold text-primary hover:text-primary/80"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View
                                  </a>
                                ) : null}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" icon={PencilSquareIcon} onClick={() => onEdit(item)}>
                        Edit initiative
                      </Button>
                      {!item.archivedAt ? (
                        <Button variant="danger" icon={ArchiveBoxArrowDownIcon} onClick={() => onArchive(item)}>
                          Archive initiative
                        </Button>
                      ) : null}
                      <Button variant="ghost" onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

AutomationBacklogDetailDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired
};

AutomationBacklogDetailDialog.defaultProps = {
  item: null
};

import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/index.js';
import { STATUS_BADGE_CLASSES, TONE_BADGE_CLASSES } from './constants.js';
import { formatTimestamp } from './formUtils.js';

export default function QueueDetailDrawer({ board, open, onClose }) {
  if (!board || !open) {
    return null;
  }

  const badgeClass = STATUS_BADGE_CLASSES[board.status] ?? STATUS_BADGE_CLASSES.operational;
  const dialogId = `queue-detail-${board.id}`;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        className="relative flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-accent/10 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Queue detail</p>
            <h2 id={dialogId} className="text-2xl font-semibold text-primary">
              Queue detail — {board.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{board.summary || 'No description provided.'}</p>
          </div>
          <div className="flex items-center gap-2">
            {board.metadata?.playbookUrl ? (
              <Button
                as="a"
                href={board.metadata.playbookUrl}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                icon={ArrowTopRightOnSquareIcon}
                iconPosition="start"
              >
                Open playbook
              </Button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-accent/20 bg-white p-2 text-slate-500 hover:border-accent hover:text-accent"
              aria-label="Close queue detail"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            <section className="rounded-3xl border border-accent/10 bg-secondary/40 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Owner</p>
                  <p className="text-lg font-semibold text-primary">{board.owner || 'Unassigned'}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
                  {board.status ?? 'operational'}
                </span>
              </div>
              <dl className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div>
                  <dt className="font-semibold text-slate-700">Priority</dt>
                  <dd className="mt-1">{board.priority ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">SLA target</dt>
                  <dd className="mt-1">{board.metadata?.slaMinutes != null ? `${board.metadata.slaMinutes} minutes` : 'Not set'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Escalation contact</dt>
                  <dd className="mt-1">{board.metadata?.escalationContact || 'Not configured'}</dd>
                </div>
                <div className="md:col-span-3">
                  <dt className="font-semibold text-slate-700">Watchers</dt>
                  <dd className="mt-1">{(board.metadata?.watchers || []).join(', ') || 'No watchers added'}</dd>
                </div>
                <div className="md:col-span-3">
                  <dt className="font-semibold text-slate-700">Tags</dt>
                  <dd className="mt-1">{(board.metadata?.tags || []).join(', ') || 'Not tagged'}</dd>
                </div>
                <div className="md:col-span-3">
                  <dt className="font-semibold text-slate-700">Intake channels</dt>
                  <dd className="mt-1">{(board.metadata?.intakeChannels || []).join(', ') || 'Not configured'}</dd>
                </div>
                <div className="md:col-span-3">
                  <dt className="font-semibold text-slate-700">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">
                    {board.metadata?.notes || 'No additional notes captured yet.'}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-primary">Recent updates</h3>
              <div className="mt-4 space-y-4">
                {(board.updates ?? []).length
                  ? board.updates.map((update) => {
                      const toneClass = TONE_BADGE_CLASSES[update.tone] ?? TONE_BADGE_CLASSES.info;
                      return (
                        <article key={update.id} className="rounded-3xl border border-accent/10 bg-white/90 p-5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-semibold text-primary">{update.headline}</h4>
                              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                                {formatTimestamp(update.recordedAt)}
                              </p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${toneClass}`}>
                              {update.tone || 'info'}
                            </span>
                          </div>
                          {update.body ? <p className="mt-3 text-sm text-slate-600">{update.body}</p> : null}
                          {Array.isArray(update.attachments) && update.attachments.length ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
                              <ul className="space-y-1 text-sm text-accent">
                                {update.attachments.map((attachment) => (
                                  <li key={attachment.url}>
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 hover:underline"
                                    >
                                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                      {attachment.label || attachment.url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  : (
                      <p className="rounded-3xl border border-dashed border-accent/30 bg-secondary/30 p-6 text-sm text-slate-600">
                        No updates logged yet.
                      </p>
                    )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

QueueDetailDrawer.propTypes = {
  board: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    summary: PropTypes.string,
    status: PropTypes.string,
    owner: PropTypes.string,
    priority: PropTypes.number,
    metadata: PropTypes.object,
    updates: PropTypes.arrayOf(PropTypes.object)
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func
};

QueueDetailDrawer.defaultProps = {
  board: null,
  open: false,
  onClose: undefined
};

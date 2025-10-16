import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../ui/index.js';
import { CATEGORY_LABELS, STATUS_LABELS } from './constants.js';

const AuditTimelineDetailDialog = ({ event, onClose }) => (
  <Transition appear show={Boolean(event)} as={Fragment}>
    <Dialog as="div" className="relative z-30" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <Dialog.Panel className="w-full max-w-2xl transform rounded-3xl border border-accent/10 bg-white p-6 text-left shadow-2xl transition-all">
              <Dialog.Title className="text-xl font-semibold text-primary">{event?.event}</Dialog.Title>
              <p className="mt-1 text-sm text-slate-600">{event?.summary || 'No summary captured.'}</p>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-primary">Owner:</span> {event?.owner}
                  {event?.ownerTeam ? ` • ${event.ownerTeam}` : ''}
                </p>
                <p>
                  <span className="font-semibold text-primary">When:</span>{' '}
                  {event?.occurredAt ? new Date(event.occurredAt).toLocaleString() : 'Not recorded'}
                </p>
                {event?.dueAt ? (
                  <p>
                    <span className="font-semibold text-primary">Due:</span>{' '}
                    {new Date(event.dueAt).toLocaleString()}
                  </p>
                ) : null}
                <p>
                  <span className="font-semibold text-primary">Category:</span>{' '}
                  {CATEGORY_LABELS[event?.category] || event?.category}
                </p>
                <p>
                  <span className="font-semibold text-primary">Status:</span> {STATUS_LABELS[event?.status]?.label}
                </p>
                <p>
                  <span className="font-semibold text-primary">Source:</span>{' '}
                  {event?.source === 'manual' ? 'Manual entry' : 'System generated'}
                </p>
                {event?.metadata && Object.keys(event.metadata).length ? (
                  <div>
                    <p className="font-semibold text-primary">Metadata</p>
                    <pre className="mt-1 whitespace-pre-wrap rounded-2xl bg-secondary/70 p-3 text-xs text-slate-600">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  </div>
                ) : null}
                {event?.attachments?.length ? (
                  <div>
                    <p className="font-semibold text-primary">Attachments</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {event.attachments.map((attachment) => (
                        <li key={`${event.id}-${attachment.url}`}>
                          <a
                            className="text-accent underline decoration-dotted"
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {attachment.label || attachment.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (event) {
                      window.open(`/admin/audit-workspace?eventId=${event.id}`, '_blank', 'noopener');
                    }
                  }}
                >
                  Open workspace
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

AuditTimelineDetailDialog.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    event: PropTypes.string,
    summary: PropTypes.string,
    owner: PropTypes.string,
    ownerTeam: PropTypes.string,
    occurredAt: PropTypes.string,
    dueAt: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    source: PropTypes.string,
    metadata: PropTypes.object,
    attachments: PropTypes.array
  }),
  onClose: PropTypes.func.isRequired
};

export default AuditTimelineDetailDialog;

import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  StatusPill,
  TextInput
} from '../../../components/ui/index.js';
import { STATUS_CONFIG, STATUS_OPTIONS } from '../constants.js';
import { formatCurrency } from '../utils.js';
import StatusBadge from './StatusBadge.jsx';

export default function JobDetailPanel({
  job,
  editForm,
  zones,
  saving,
  onFieldChange,
  onSubmit,
  onReset,
  onOpenWindow,
  onAward,
  messageDrafts,
  messageStatus,
  messageAttachments,
  onDraftChange,
  onAddAttachment,
  onAttachmentChange,
  onRemoveAttachment,
  onSendMessage
}) {
  if (!job) {
    return null;
  }

  return (
    <Card className="bg-white/95">
      <div className="flex flex-col gap-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">{job.title}</h2>
              <p className="text-sm text-slate-500">{job.customer?.email || 'Customer assigned'}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={ArrowTopRightOnSquareIcon}
                onClick={onOpenWindow}
              >
                Open detail window
              </Button>
              <StatusBadge status={job.status} />
            </div>
          </div>
          <dl className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-4">
            <div>
              <dt className="font-semibold text-slate-600">Budget</dt>
              <dd className="mt-1 text-sm text-primary">{formatCurrency(job.budgetAmount, job.budgetCurrency)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Bid deadline</dt>
              <dd className="mt-1 text-sm text-primary">
                {job.bidDeadline ? new Date(job.bidDeadline).toLocaleString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Zone</dt>
              <dd className="mt-1 text-sm text-primary">{job.zone?.name ?? 'Not assigned'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Location</dt>
              <dd className="mt-1 text-sm text-primary">{job.location || '—'}</dd>
            </div>
          </dl>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="edit-title" label="Job title">
              <TextInput
                id="edit-title"
                value={editForm?.title ?? ''}
                onChange={(event) => onFieldChange('title', event.target.value)}
              />
            </FormField>
            <FormField id="edit-status" label="Status">
              <select
                id="edit-status"
                value={editForm?.status ?? 'open'}
                onChange={(event) => onFieldChange('status', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField id="edit-description" label="Brief">
            <textarea
              id="edit-description"
              rows={4}
              value={editForm?.description ?? ''}
              onChange={(event) => onFieldChange('description', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField id="edit-budget-amount" label="Budget amount">
              <input
                id="edit-budget-amount"
                type="number"
                min="0"
                value={editForm?.budgetAmount ?? ''}
                onChange={(event) => onFieldChange('budgetAmount', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              />
            </FormField>
            <FormField id="edit-budget-currency" label="Currency">
              <input
                id="edit-budget-currency"
                type="text"
                maxLength={3}
                value={editForm?.budgetCurrency ?? 'GBP'}
                onChange={(event) => onFieldChange('budgetCurrency', event.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase shadow-sm focus:border-accent focus:outline-none"
              />
            </FormField>
            <FormField id="edit-budget-label" label="Budget label" optionalLabel="Optional">
              <TextInput
                id="edit-budget-label"
                value={editForm?.budgetLabel ?? ''}
                onChange={(event) => onFieldChange('budgetLabel', event.target.value)}
              />
            </FormField>
          </div>
          <FormField id="edit-bid-deadline" label="Bid deadline">
            <input
              id="edit-bid-deadline"
              type="datetime-local"
              value={editForm?.bidDeadline ?? ''}
              onChange={(event) => onFieldChange('bidDeadline', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="edit-zone" label="Service zone">
              <select
                id="edit-zone"
                value={editForm?.zoneId ?? ''}
                onChange={(event) => onFieldChange('zoneId', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              >
                <option value="">Not assigned</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="edit-location" label="Location">
              <TextInput
                id="edit-location"
                value={editForm?.location ?? ''}
                onChange={(event) => onFieldChange('location', event.target.value)}
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField id="edit-customer-email" label="Customer email">
              <TextInput
                id="edit-customer-email"
                type="email"
                value={editForm?.customerEmail ?? ''}
                onChange={(event) => onFieldChange('customerEmail', event.target.value)}
              />
            </FormField>
            <FormField id="edit-customer-first" label="Customer first name" optionalLabel="Optional">
              <TextInput
                id="edit-customer-first"
                value={editForm?.customerFirstName ?? ''}
                onChange={(event) => onFieldChange('customerFirstName', event.target.value)}
              />
            </FormField>
            <FormField id="edit-customer-last" label="Customer last name" optionalLabel="Optional">
              <TextInput
                id="edit-customer-last"
                value={editForm?.customerLastName ?? ''}
                onChange={(event) => onFieldChange('customerLastName', event.target.value)}
              />
            </FormField>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="edit-allow-out-of-zone"
              checked={editForm?.allowOutOfZone ?? false}
              onChange={(event) => onFieldChange('allowOutOfZone', event.target.checked)}
            />
            <label htmlFor="edit-allow-out-of-zone" className="text-sm text-slate-600">
              Allow providers outside the zone to bid
            </label>
          </div>
          <FormField id="edit-images" label="Image URLs" optionalLabel="Optional">
            <textarea
              id="edit-images"
              rows={3}
              value={editForm?.imagesText ?? ''}
              onChange={(event) => onFieldChange('imagesText', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField id="edit-internal-notes" label="Internal notes">
            <textarea
              id="edit-internal-notes"
              rows={3}
              value={editForm?.internalNotes ?? ''}
              onChange={(event) => onFieldChange('internalNotes', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button type="submit" icon={CheckCircleIcon} loading={saving}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={onReset}>
              Reset changes
            </Button>
          </div>
        </form>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">Job media & references</h3>
            {job.images?.length ? (
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {job.images.length} asset{job.images.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          {Array.isArray(job.images) && job.images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {job.images.map((imageUrl) => (
                <a
                  key={imageUrl}
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-48 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition hover:border-accent/60 hover:shadow-md"
                >
                  <img
                    src={imageUrl}
                    alt={`Custom job media for ${job.title}`}
                    className="h-36 w-full object-cover transition duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="px-4 py-2 text-xs text-slate-500 transition group-hover:text-primary">
                    Open in new tab
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No media assets have been attached yet. Use the image URLs field to add briefing photos or drawings.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Bid negotiations</h3>
          {job.bids?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No bids submitted yet. Invite providers from the live feed or share the brief directly.
            </div>
          ) : null}
          {job.bids?.map((bid) => {
            const bidStatus = STATUS_CONFIG[bid.status] ?? STATUS_CONFIG.open;
            const draft = messageDrafts[bid.id] ?? '';
            const status = messageStatus[bid.id];
            const attachments = messageAttachments[bid.id] ?? [];
            const attachmentLimitReached = attachments.length >= 5;
            return (
              <Card key={bid.id} padding="md" className="border border-slate-200 bg-white/90">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {bid.provider?.firstName} {bid.provider?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{formatCurrency(bid.amount, bid.currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={bidStatus.tone}>{bidStatus.label}</StatusPill>
                    {job.status !== 'completed' && job.awardedBidId !== bid.id ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={CheckCircleIcon}
                        onClick={() => onAward(bid.id)}
                        disabled={saving}
                      >
                        Award job
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  {bid.messages?.map((message) => (
                    <div key={message.id} className="rounded-2xl border border-slate-200 bg-secondary/60 p-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {message.author?.firstName} {message.author?.lastName} • {message.author?.type}
                        </span>
                        <span>{new Date(message.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-line">{message.body}</p>
                      {Array.isArray(message.attachments) && message.attachments.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-accent">
                          {message.attachments.map((attachment) => (
                            <li key={attachment.url}>
                              <a href={attachment.url} target="_blank" rel="noreferrer" className="hover:underline">
                                {attachment.label || attachment.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      onSendMessage(bid.id);
                    }}
                    className="space-y-2"
                  >
                    <textarea
                      rows={3}
                      value={draft}
                      onChange={(event) => onDraftChange(bid.id, event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
                      placeholder="Share feedback, request documents, or coordinate start dates."
                    />
                    <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Attachments</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={PlusIcon}
                          onClick={() => onAddAttachment(bid.id)}
                          disabled={attachmentLimitReached}
                        >
                          Add file
                        </Button>
                      </div>
                      {attachments.length === 0 ? (
                        <p className="text-xs text-slate-500">Optional links to proposals, compliance docs, or schedules.</p>
                      ) : (
                        <div className="space-y-3">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                              <input
                                type="text"
                                value={attachment.label}
                                onChange={(event) => onAttachmentChange(bid.id, attachment.id, 'label', event.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none"
                                placeholder="Display name (optional)"
                              />
                              <input
                                type="url"
                                value={attachment.url}
                                onChange={(event) => onAttachmentChange(bid.id, attachment.id, 'url', event.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none"
                                placeholder="https://cdn.fixnado.com/bids/quote.pdf"
                              />
                              <button
                                type="button"
                                onClick={() => onRemoveAttachment(bid.id, attachment.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                                aria-label="Remove attachment"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {attachmentLimitReached ? (
                        <p className="text-xs text-slate-500">Maximum of five attachments per message.</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="submit" size="sm" icon={PaperAirplaneIcon} loading={status?.status === 'loading'}>
                        Send message
                      </Button>
                      {status?.status === 'error' ? (
                        <span className="text-xs text-rose-500">{status.message}</span>
                      ) : null}
                      {status?.status === 'success' ? (
                        <span className="text-xs text-emerald-600">Sent</span>
                      ) : null}
                    </div>
                  </form>
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    </Card>
  );
}

JobDetailPanel.propTypes = {
  job: PropTypes.object,
  editForm: PropTypes.object,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  saving: PropTypes.bool.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onOpenWindow: PropTypes.func.isRequired,
  onAward: PropTypes.func.isRequired,
  messageDrafts: PropTypes.object.isRequired,
  messageStatus: PropTypes.object.isRequired,
  messageAttachments: PropTypes.object.isRequired,
  onDraftChange: PropTypes.func.isRequired,
  onAddAttachment: PropTypes.func.isRequired,
  onAttachmentChange: PropTypes.func.isRequired,
  onRemoveAttachment: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired
};

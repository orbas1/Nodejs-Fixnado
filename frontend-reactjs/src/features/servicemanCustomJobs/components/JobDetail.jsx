import PropTypes from 'prop-types';
import { Button, TextArea, TextInput, StatusPill } from '../../../components/ui/index.js';

function formatCurrency(value, currency = 'GBP') {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDate(iso) {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function AttachmentFields({ attachments, onAdd, onChange, onRemove, label }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <Button variant="ghost" size="xs" onClick={onAdd}>
          Add attachment
        </Button>
      </div>
      {attachments.length === 0 ? (
        <p className="text-xs text-slate-500">No attachments added.</p>
      ) : null}
      {attachments.map((attachment) => (
        <div key={attachment.id} className="grid gap-2 rounded-xl border border-accent/10 bg-secondary/40 p-3 md:grid-cols-2">
          <TextInput
            label="URL"
            value={attachment.url}
            onChange={(event) => onChange(attachment.id, 'url', event.target.value)}
            placeholder="https://…"
          />
          <div className="flex items-end gap-2">
            <TextInput
              label="Label"
              value={attachment.label}
              onChange={(event) => onChange(attachment.id, 'label', event.target.value)}
              placeholder="Optional label"
            />
            <Button variant="ghost" size="sm" onClick={() => onRemove(attachment.id)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

AttachmentFields.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      url: PropTypes.string,
      label: PropTypes.string
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  label: PropTypes.string
};

AttachmentFields.defaultProps = {
  label: 'Attachments'
};

export default function JobDetail({
  job,
  bidForm,
  messageForm,
  detailLoading,
  actionState,
  messageStatus,
  onBidFieldChange,
  onAddBidAttachment,
  onUpdateBidAttachment,
  onRemoveBidAttachment,
  onSubmitBid,
  onWithdrawBid,
  onMessageFieldChange,
  onAddMessageAttachment,
  onUpdateMessageAttachment,
  onRemoveMessageAttachment,
  onSendMessage
}) {
  if (detailLoading) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading job detail…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Select a custom job to review details and manage your bid.</p>
      </div>
    );
  }

  const timeline = Array.isArray(job.analytics?.timeline) ? job.analytics.timeline : [];
  const providerBid = job.providerBid ?? null;
  const totals = job.analytics?.totals ?? {};
  const value = job.analytics?.value ?? {};

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Custom job</p>
            <h2 className="text-2xl font-semibold text-primary">{job.job?.title ?? job.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary/80">
                Status • {(providerBid?.status || job.job?.status || job.status || 'open').replace(/_/g, ' ')}
              </span>
              {job.job?.zone?.name ? (
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary/80">
                  Zone • {job.job.zone.name}
                </span>
              ) : null}
              {job.job?.bidDeadline ? (
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary/80">
                  Bid deadline • {formatDate(job.job.bidDeadline)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p className="font-semibold text-primary">
              {job.job?.budgetLabel
                ? job.job.budgetLabel
                : formatCurrency(job.job?.budgetAmount, job.job?.budgetCurrency)}
            </p>
            <p className="text-xs">Created {formatDate(job.job?.createdAt)}</p>
          </div>
        </div>
        {job.job?.description ? (
          <p className="mt-4 text-sm leading-6 text-slate-600">{job.job.description}</p>
        ) : null}
        {job.job?.metadata && Object.keys(job.job.metadata).length ? (
          <div className="mt-4 space-y-2 text-xs text-slate-500">
            {Object.entries(job.job.metadata).map(([key, valueEntry]) => (
              <div key={key} className="rounded-xl border border-accent/10 bg-secondary/40 p-3">
                <p className="font-semibold text-primary capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-slate-600">{String(valueEntry)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-accent/10 bg-white/95 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-primary">Bid metrics</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <dt>Total bids</dt>
              <dd className="text-base font-semibold text-primary">{totals.totalBids ?? 0}</dd>
            </div>
            <div>
              <dt>Active</dt>
              <dd className="text-base font-semibold text-primary">{totals.pendingBids ?? 0}</dd>
            </div>
            <div>
              <dt>Awarded</dt>
              <dd className="text-base font-semibold text-primary">{totals.awardedBids ?? 0}</dd>
            </div>
            <div>
              <dt>Withdrawn</dt>
              <dd className="text-base font-semibold text-primary">{totals.withdrawnBids ?? 0}</dd>
            </div>
            <div className="col-span-2">
              <dt>Bid value range</dt>
              <dd className="text-sm">
                {formatCurrency(value.lowestBidAmount, job.job?.budgetCurrency)} –{' '}
                {formatCurrency(value.highestBidAmount, job.job?.budgetCurrency)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-3xl border border-accent/10 bg-white/95 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-primary">Timeline</h3>
          <ul className="mt-3 space-y-3 text-xs text-slate-500">
            {timeline.length === 0 ? (
              <li>No timeline entries yet.</li>
            ) : (
              timeline.map((item) => (
                <li key={`${item.label}-${item.at}`} className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
                  <span className="font-semibold text-primary">{item.label}</span>
                  <span>{formatDate(item.at)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <form className="space-y-4 rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-md" onSubmit={onSubmitBid}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">
              {providerBid ? 'Update your bid' : 'Submit a bid'}
            </h3>
            <p className="text-sm text-slate-500">Adjust pricing, share context, and keep negotiation history in one place.</p>
          </div>
          {actionState.state === 'error' ? (
            <StatusPill tone="danger">{actionState.message}</StatusPill>
          ) : null}
          {actionState.state === 'success' ? (
            <StatusPill tone="success">{actionState.message}</StatusPill>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Amount"
            value={bidForm.amount}
            onChange={(event) => onBidFieldChange('amount', event.target.value)}
            placeholder="e.g. 1500"
          />
          <TextInput
            label="Currency"
            value={bidForm.currency}
            onChange={(event) => onBidFieldChange('currency', event.target.value)}
            placeholder="GBP"
          />
          <div className="flex items-end">
            <Button type="submit" variant="primary" disabled={actionState.state === 'loading'}>
              {actionState.state === 'loading' ? 'Saving…' : providerBid ? 'Update bid' : 'Submit bid'}
            </Button>
          </div>
        </div>
        <TextArea
          label="Message to admin"
          value={bidForm.message}
          onChange={(event) => onBidFieldChange('message', event.target.value)}
          placeholder="Share context, availability, or differentiators to strengthen your bid."
          rows={4}
        />
        <AttachmentFields
          attachments={bidForm.attachments}
          onAdd={onAddBidAttachment}
          onChange={onUpdateBidAttachment}
          onRemove={onRemoveBidAttachment}
          label="Bid attachments"
        />
        {providerBid ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-accent/10 pt-4">
            <p className="text-xs text-slate-500">Last updated {formatDate(providerBid.updatedAt)}</p>
            <Button variant="danger" size="sm" onClick={() => onWithdrawBid()} type="button">
              Withdraw bid
            </Button>
          </div>
        ) : null}
      </form>

      <div className="space-y-4 rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Conversation</h3>
            <p className="text-sm text-slate-500">Maintain a clear audit trail with admins and job owners.</p>
          </div>
          {messageStatus === 'error' ? (
            <StatusPill tone="danger">Message could not be sent.</StatusPill>
          ) : null}
          {messageStatus === 'success' ? (
            <StatusPill tone="success">Message sent.</StatusPill>
          ) : null}
        </div>
        <div className="space-y-3">
          {Array.isArray(providerBid?.messages) && providerBid.messages.length ? (
            providerBid.messages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-primary">{message.author?.firstName || 'Participant'}</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{message.body}</p>
                {Array.isArray(message.attachments) && message.attachments.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-accent">
                    {message.attachments.map((attachment) => (
                      <li key={attachment.url}>
                        <a href={attachment.url} target="_blank" rel="noreferrer" className="underline">
                          {attachment.label || attachment.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No messages yet. Start the conversation below.</p>
          )}
        </div>
        <div className="rounded-2xl border border-accent/10 bg-white p-4">
          <TextArea
            label="New message"
            value={messageForm.body}
            onChange={(event) => onMessageFieldChange('body', event.target.value)}
            placeholder="Provide updates or request clarification."
            rows={4}
          />
          <AttachmentFields
            attachments={messageForm.attachments}
            onAdd={onAddMessageAttachment}
            onChange={onUpdateMessageAttachment}
            onRemove={onRemoveMessageAttachment}
            label="Message attachments"
          />
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={onSendMessage} disabled={messageStatus === 'loading'}>
              {messageStatus === 'loading' ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

JobDetail.propTypes = {
  job: PropTypes.shape({
    title: PropTypes.string,
    status: PropTypes.string,
    zone: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }),
    job: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      status: PropTypes.string,
      budgetLabel: PropTypes.string,
      budgetAmount: PropTypes.number,
      budgetCurrency: PropTypes.string,
      bidDeadline: PropTypes.string,
      createdAt: PropTypes.string,
      metadata: PropTypes.object,
      zone: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      })
    }),
    providerBid: PropTypes.shape({
      id: PropTypes.string,
      status: PropTypes.string,
      amount: PropTypes.number,
      currency: PropTypes.string,
      updatedAt: PropTypes.string,
      messages: PropTypes.arrayOf(PropTypes.object)
    }),
    analytics: PropTypes.shape({
      totals: PropTypes.object,
      value: PropTypes.object,
      timeline: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        at: PropTypes.string
      }))
    })
  }),
  bidForm: PropTypes.shape({
    amount: PropTypes.string,
    currency: PropTypes.string,
    message: PropTypes.string,
    attachments: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  messageForm: PropTypes.shape({
    body: PropTypes.string,
    attachments: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  detailLoading: PropTypes.bool,
  actionState: PropTypes.shape({ state: PropTypes.string, message: PropTypes.string }),
  messageStatus: PropTypes.string,
  onBidFieldChange: PropTypes.func.isRequired,
  onAddBidAttachment: PropTypes.func.isRequired,
  onUpdateBidAttachment: PropTypes.func.isRequired,
  onRemoveBidAttachment: PropTypes.func.isRequired,
  onSubmitBid: PropTypes.func.isRequired,
  onWithdrawBid: PropTypes.func.isRequired,
  onMessageFieldChange: PropTypes.func.isRequired,
  onAddMessageAttachment: PropTypes.func.isRequired,
  onUpdateMessageAttachment: PropTypes.func.isRequired,
  onRemoveMessageAttachment: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired
};

JobDetail.defaultProps = {
  job: null,
  detailLoading: false,
  actionState: { state: 'idle', message: null },
  messageStatus: 'idle'
};

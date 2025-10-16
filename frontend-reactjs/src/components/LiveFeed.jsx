import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Spinner from './ui/Spinner.jsx';
import {
  fetchLiveFeed,
  createLiveFeedPost,
  submitCustomJobBid,
  sendCustomJobBidMessage
} from '../api/feedClient.js';
import { fetchZones } from '../api/explorerClient.js';
import { useCurrentRole } from '../hooks/useCurrentRole.js';
import { applyBidCreated, applyBidMessage, upsertLiveFeedPost } from './liveFeedState.js';

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  budgetLabel: '',
  budgetAmount: '',
  budgetCurrency: 'USD',
  category: '',
  location: '',
  zoneId: '',
  allowOutOfZone: false,
  bidDeadline: ''
};

const CATEGORY_SUGGESTIONS = ['Emergency response', 'Facilities', 'Renovation', 'IT Support', 'Special project'];

const currencyFormatters = new Map();

function formatCurrency(value, currency = 'USD') {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const code = typeof currency === 'string' && currency.length === 3 ? currency.toUpperCase() : 'USD';
  if (!currencyFormatters.has(code)) {
    currencyFormatters.set(
      code,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0
      })
    );
  }

  return currencyFormatters.get(code).format(numeric);
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelativeTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 1) {
    return 'just now';
  }
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, 'minute');
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return relativeTimeFormatter.format(diffDays, 'day');
  }
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return relativeTimeFormatter.format(diffMonths, 'month');
  }
  const diffYears = Math.round(diffMonths / 12);
  return relativeTimeFormatter.format(diffYears, 'year');
}

function budgetDisplay(post) {
  if (post.budget && post.budget.trim().length > 0) {
    return post.budget.trim();
  }
  const formatted = formatCurrency(post.budgetAmount, post.budgetCurrency);
  return formatted ?? 'Budget TBD';
}

function personName(person) {
  if (!person) return 'Anonymous';
  const parts = [person.firstName, person.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Anonymous';
}

function useZones(shouldLoad) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shouldLoad) {
      setZones([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    fetchZones({ signal: controller.signal })
      .then((payload) => {
        if (!cancelled) {
          setZones(Array.isArray(payload) ? payload : []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('[LiveFeed] unable to load zones', error);
          setZones([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [shouldLoad]);

  return { zones, loading };
}

function JobComposer({
  form,
  onChange,
  onSubmit,
  submitting,
  error,
  successMessage,
  zones,
  zoneLoading
}) {
  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-6">
        <header>
          <h3 className="text-lg font-semibold text-primary">Publish a bespoke job</h3>
          <p className="mt-1 text-sm text-slate-500">
            Describe the work, set expectations, and broadcast instantly to vetted providers.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Job title</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              placeholder="Emergency boiler repair in HQ"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category</span>
            <input
              type="text"
              list="live-feed-categories"
              value={form.category}
              onChange={(event) => onChange({ category: event.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              placeholder="Facilities"
            />
            <datalist id="live-feed-categories">
              {CATEGORY_SUGGESTIONS.map((entry) => (
                <option key={entry} value={entry} />
              ))}
            </datalist>
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Detailed brief</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            placeholder="Outline access requirements, compliance notes, and on-site contact details."
          />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Budget amount</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.budgetAmount}
              onChange={(event) => onChange({ budgetAmount: event.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              placeholder="1500"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Currency</span>
            <input
              type="text"
              maxLength={3}
              value={form.budgetCurrency}
              onChange={(event) => onChange({ budgetCurrency: event.target.value.toUpperCase() })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase shadow-sm focus:border-accent focus:outline-none"
              placeholder="USD"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Public label</span>
            <input
              type="text"
              value={form.budgetLabel}
              onChange={(event) => onChange({ budgetLabel: event.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              placeholder="Fixed price"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Service zone</span>
            <select
              value={form.zoneId}
              onChange={(event) => onChange({ zoneId: event.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            >
              <option value="">Any zone</option>
              {zoneLoading ? (
                <option value="" disabled>
                  Loading zones...
                </option>
              ) : (
                zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Location</span>
            <input
              type="text"
              value={form.location}
              onChange={(event) => onChange({ location: event.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              placeholder="London HQ"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bid deadline</span>
            <input
              type="datetime-local"
              value={form.bidDeadline}
              onChange={(event) => onChange({ bidDeadline: event.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <input
              type="checkbox"
              checked={form.allowOutOfZone}
              onChange={(event) => onChange({ allowOutOfZone: event.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
            />
            <span className="text-sm text-slate-600">Invite vetted providers from neighbouring zones</span>
          </label>
        </div>
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        {successMessage ? <p className="text-sm font-medium text-emerald-600">{successMessage}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? 'Publishing…' : 'Publish job to live feed'}
          </button>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Secure escrow and compliance workflows baked in
          </span>
        </div>
      </div>
    </form>
  );
}

JobComposer.propTypes = {
  form: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    budgetLabel: PropTypes.string,
    budgetAmount: PropTypes.string,
    budgetCurrency: PropTypes.string,
    category: PropTypes.string,
    location: PropTypes.string,
    zoneId: PropTypes.string,
    allowOutOfZone: PropTypes.bool,
    bidDeadline: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  successMessage: PropTypes.string,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  zoneLoading: PropTypes.bool
};

JobComposer.defaultProps = {
  submitting: false,
  error: null,
  successMessage: null,
  zones: [],
  zoneLoading: false
};

function BidComposer({ postId, onSubmit, status }) {
  const [form, setForm] = useState({ amount: '', currency: 'USD', message: '', attachments: [{ id: 1, url: '', label: '' }] });

  useEffect(() => {
    if (status?.state === 'success') {
      setForm({ amount: '', currency: 'USD', message: '', attachments: [{ id: 1, url: '', label: '' }] });
    }
  }, [status?.state]);

  const handleAttachmentChange = (index, patch) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.map((attachment, position) =>
        position === index ? { ...attachment, ...patch } : attachment
      )
    }));
  };

  const handleAddAttachment = () => {
    setForm((current) => ({
      ...current,
      attachments: [...current.attachments, { id: Date.now(), url: '', label: '' }]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((_, position) => position !== index)
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const attachments = form.attachments
      .map(({ url, label }) => ({ url: url.trim(), label: label.trim() }))
      .filter((attachment) => attachment.url.length > 0);

    await onSubmit(postId, {
      amount: form.amount,
      currency: form.currency,
      message: form.message,
      attachments
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <h4 className="text-sm font-semibold text-primary">Submit a bespoke bid</h4>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Amount</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="480"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Currency</span>
          <input
            type="text"
            maxLength={3}
            value={form.currency}
            onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase focus:border-accent focus:outline-none"
            placeholder="USD"
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Formatted preview</span>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
            {formatCurrency(form.amount, form.currency) ?? '—'}
          </div>
        </div>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Message</span>
        <textarea
          rows={3}
          required
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="Share availability, compliance, and response times."
        />
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reference links</span>
          {form.attachments.length < 3 ? (
            <button
              type="button"
              onClick={handleAddAttachment}
              className="text-xs font-semibold text-accent hover:text-primary"
            >
              Add link
            </button>
          ) : null}
        </div>
        {form.attachments.map((attachment, index) => (
          <div key={attachment.id} className="grid gap-3 md:grid-cols-[2fr_2fr_auto]">
            <input
              type="url"
              value={attachment.url}
              onChange={(event) => handleAttachmentChange(index, { url: event.target.value })}
              placeholder="https://portfolio.fixnado.com/case-study"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              value={attachment.label}
              onChange={(event) => handleAttachmentChange(index, { label: event.target.value })}
              placeholder="Client reference"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
            />
            {form.attachments.length > 1 ? (
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-500"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {status?.state === 'error' ? (
        <p className="text-sm font-medium text-rose-600">{status.message}</p>
      ) : null}
      {status?.state === 'success' ? (
        <p className="text-sm font-medium text-emerald-600">Bid submitted. We’ll notify the buyer instantly.</p>
      ) : null}
      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={status?.state === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status?.state === 'loading' ? 'Submitting…' : 'Send bid'}
        </button>
      </div>
    </form>
  );
}

BidComposer.propTypes = {
  postId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  status: PropTypes.shape({
    state: PropTypes.oneOf(['idle', 'loading', 'success', 'error']),
    message: PropTypes.string
  })
};

BidComposer.defaultProps = {
  status: { state: 'idle' }
};

function BidMessageComposer({ postId, bidId, onSubmit, status, canMessage }) {
  const [form, setForm] = useState({ body: '', attachments: [{ id: 1, url: '', label: '' }] });

  useEffect(() => {
    if (status?.state === 'success') {
      setForm({ body: '', attachments: [{ id: 1, url: '', label: '' }] });
    }
  }, [status?.state]);

  if (!canMessage) {
    return null;
  }

  const handleAttachmentChange = (index, patch) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.map((attachment, position) =>
        position === index ? { ...attachment, ...patch } : attachment
      )
    }));
  };

  const handleAddAttachment = () => {
    setForm((current) => ({
      ...current,
      attachments: [...current.attachments, { id: Date.now(), url: '', label: '' }]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((_, position) => position !== index)
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const attachments = form.attachments
      .map(({ url, label }) => ({ url: url.trim(), label: label.trim() }))
      .filter((attachment) => attachment.url.length > 0);

    await onSubmit(postId, bidId, { body: form.body, attachments });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <h5 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Continue conversation</h5>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Message</span>
        <textarea
          rows={3}
          required
          value={form.body}
          onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="Share clarifications, compliance evidence, or delivery timelines."
        />
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Secure links</span>
          {form.attachments.length < 5 ? (
            <button type="button" onClick={handleAddAttachment} className="text-xs font-semibold text-accent hover:text-primary">
              Add link
            </button>
          ) : null}
        </div>
        {form.attachments.map((attachment, index) => (
          <div key={attachment.id} className="grid gap-3 md:grid-cols-[2fr_2fr_auto]">
            <input
              type="url"
              value={attachment.url}
              onChange={(event) => handleAttachmentChange(index, { url: event.target.value })}
              placeholder="https://evidence.fixnado.com/document"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              value={attachment.label}
              onChange={(event) => handleAttachmentChange(index, { label: event.target.value })}
              placeholder="Risk assessment"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
            />
            {form.attachments.length > 1 ? (
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-500"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {status?.state === 'error' ? (
        <p className="text-sm font-medium text-rose-600">{status.message}</p>
      ) : null}
      {status?.state === 'success' ? (
        <p className="text-sm font-medium text-emerald-600">Message sent to the bidder.</p>
      ) : null}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={status?.state === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status?.state === 'loading' ? 'Sending…' : 'Send update'}
        </button>
      </div>
    </form>
  );
}

BidMessageComposer.propTypes = {
  postId: PropTypes.string.isRequired,
  bidId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  canMessage: PropTypes.bool,
  status: PropTypes.shape({
    state: PropTypes.oneOf(['idle', 'loading', 'success', 'error']),
    message: PropTypes.string
  })
};

BidMessageComposer.defaultProps = {
  status: { state: 'idle' },
  canMessage: false
};

function BidList({ postId, bids, canMessage, onMessageSubmit, messageStatus }) {
  if (!Array.isArray(bids) || bids.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500">
        No bids yet. Providers see your post in real time.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {bids.map((bid) => {
        const submittedLabel = formatRelativeTime(bid.createdAt ?? bid.submittedAt);
        return (
          <article key={bid.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{personName(bid.provider)}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{bid.status ?? 'pending'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-accent">
                  {formatCurrency(bid.amount, bid.currency) ?? 'Awaiting amount'}
                </p>
                <p className="text-xs text-slate-400">Submitted {submittedLabel}</p>
              </div>
            </header>
            {Array.isArray(bid.messages) && bid.messages.length > 0 ? (
              <div className="mt-4 space-y-3">
                {bid.messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-600"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{personName(message.author)}</span>
                      <span>{formatRelativeTime(message.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line">{message.body}</p>
                    {Array.isArray(message.attachments) && message.attachments.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.attachments.map((attachment) => (
                          <a
                            key={`${message.id}:${attachment.url}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent hover:text-accent"
                          >
                            <svg
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M4.586 11.414a2 2 0 0 1 0-2.828l4-4a2 2 0 0 1 2.828 2.828l-4 4a1 1 0 1 0 1.414 1.414l4-4a3 3 0 1 0-4.242-4.242l-4 4a4 4 0 1 0 5.656 5.656l1.172-1.172a1 1 0 0 0-1.414-1.414l-1.172 1.172a2 2 0 1 1-2.828-2.828Z" />
                            </svg>
                            <span>{attachment.label || attachment.url}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {canMessage && typeof onMessageSubmit === 'function' ? (
              <BidMessageComposer
                postId={postId}
                bidId={bid.id}
                onSubmit={onMessageSubmit}
                canMessage={canMessage}
                status={messageStatus?.[bid.id] ?? { state: 'idle' }}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

BidList.propTypes = {
  postId: PropTypes.string.isRequired,
  bids: PropTypes.arrayOf(PropTypes.object),
  canMessage: PropTypes.bool,
  onMessageSubmit: PropTypes.func,
  messageStatus: PropTypes.object
};

BidList.defaultProps = {
  bids: [],
  canMessage: false,
  onMessageSubmit: undefined,
  messageStatus: undefined
};

function PostCard({ post, canBid, canMessage, onBidSubmit, onMessageSubmit, bidStatus, messageStatus }) {
  const chips = useMemo(() => {
    const list = [];
    if (post.category) {
      list.push(post.category);
    }
    if (post.allowOutOfZone) {
      list.push('Out-of-zone friendly');
    }
    if (post.metadata?.urgency) {
      list.push(`Urgency: ${post.metadata.urgency}`);
    }
    if (post.metadata?.timeWindow) {
      list.push(post.metadata.timeWindow);
    }
    return list;
  }, [post]);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:shadow-lg">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {post.zone?.name ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-semibold uppercase tracking-[0.3em] text-primary">
                {post.zone.name}
              </span>
            ) : null}
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>
          <h3 className="text-xl font-semibold text-primary">{post.title}</h3>
          {post.location ? <p className="text-sm text-slate-500">{post.location}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-accent">{budgetDisplay(post)}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{post.status ?? 'open'}</p>
          {post.bidDeadline ? (
            <p className="mt-1 text-xs text-slate-500">Bidding closes {formatRelativeTime(post.bidDeadline)}</p>
          ) : null}
        </div>
      </header>
      {post.description ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{post.description}</p>
      ) : null}
      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {Array.isArray(post.images) && post.images.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {post.images.slice(0, 4).map((image) => (
            <a
              key={image}
              href={image}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
            >
              <img src={image} alt="Job reference" className="h-full w-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      ) : null}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-primary">Bids ({post.bids?.length ?? 0})</h4>
          <span className="text-xs text-slate-500">Buyer: {personName(post.User ?? post.customer)}</span>
        </div>
        <BidList
          postId={post.id}
          bids={post.bids}
          canMessage={canMessage}
          onMessageSubmit={onMessageSubmit}
          messageStatus={messageStatus}
        />
        {canBid ? <BidComposer postId={post.id} onSubmit={onBidSubmit} status={bidStatus} /> : null}
      </div>
    </article>
  );
}

PostCard.propTypes = {
  post: PropTypes.object.isRequired,
  canBid: PropTypes.bool,
  canMessage: PropTypes.bool,
  onBidSubmit: PropTypes.func.isRequired,
  onMessageSubmit: PropTypes.func,
  bidStatus: PropTypes.shape({
    state: PropTypes.oneOf(['idle', 'loading', 'success', 'error']),
    message: PropTypes.string
  }),
  messageStatus: PropTypes.object
};

PostCard.defaultProps = {
  canBid: false,
  canMessage: false,
  onMessageSubmit: undefined,
  bidStatus: { state: 'idle' },
  messageStatus: undefined
};

export default function LiveFeed({ condensed = false }) {
  const role = useCurrentRole();
  const canView = role !== 'guest';
  const canCreate = role === 'user' || role === 'company';
  const canBid = role === 'servicemen' || role === 'company';
  const canMessage = role === 'user' || role === 'company';

  const [filters, setFilters] = useState({ zoneId: '', includeOutOfZone: false, outOfZoneOnly: false });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [streamStatus, setStreamStatus] = useState({ connected: false, reconnecting: false, error: null });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);
  const [bidStatus, setBidStatus] = useState({});
  const [messageStatus, setMessageStatus] = useState({});

  const { zones, loading: zoneLoading } = useZones(canCreate || (!condensed && canView));
  const maxStreamPosts = useMemo(() => (condensed ? 6 : undefined), [condensed]);

  useEffect(() => {
    if (!canView) {
      setPosts([]);
      setLoading(false);
      setFeedError(null);
      setLastUpdated(null);
      setStreamStatus({ connected: false, reconnecting: false, error: null });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setFeedError(null);

    fetchLiveFeed({
      zoneId: filters.zoneId || undefined,
      includeOutOfZone: filters.includeOutOfZone,
      outOfZoneOnly: filters.outOfZoneOnly,
      limit: condensed ? 6 : undefined
    }, { signal: controller.signal })
      .then((payload) => {
        if (!cancelled) {
          setPosts(Array.isArray(payload) ? payload : []);
          setLastUpdated(new Date());
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          if (requestError.name === 'AbortError') {
            return;
          }
          setFeedError(requestError.message || 'Unable to load live feed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [canView, filters.zoneId, filters.includeOutOfZone, filters.outOfZoneOnly, condensed]);

  useEffect(() => {
    if (!canView) {
      return undefined;
    }

    if (typeof window === 'undefined' || typeof window.EventSource !== 'function') {
      setStreamStatus((current) => ({
        connected: false,
        reconnecting: false,
        error:
          current.error ||
          'Live streaming is not supported in this browser. The feed will refresh periodically.'
      }));
      return undefined;
    }

    setStreamStatus((current) => ({
      connected: false,
      reconnecting: true,
      error: current.error
    }));

    const params = new URLSearchParams();
    if (filters.zoneId) params.set('zoneId', filters.zoneId);
    if (filters.includeOutOfZone) params.set('includeOutOfZone', 'true');
    if (filters.outOfZoneOnly) params.set('outOfZoneOnly', 'true');
    if (maxStreamPosts) params.set('limit', String(maxStreamPosts));

    const source = new EventSource(
      `/api/feed/live/stream${params.toString() ? `?${params}` : ''}`,
      { withCredentials: true }
    );

    let closed = false;

    const safeParse = (event) => {
      try {
        return event?.data ? JSON.parse(event.data) : null;
      } catch (error) {
        console.error('[LiveFeed] failed to parse live feed event payload', error);
        return null;
      }
    };

    const handleSnapshot = (event) => {
      if (closed) return;
      const payload = safeParse(event);
      if (!payload) {
        return;
      }
      const snapshotPosts = Array.isArray(payload.posts) ? payload.posts : [];
      setPosts(snapshotPosts);
      setFeedError(null);
      setLastUpdated(payload.generatedAt ? new Date(payload.generatedAt) : new Date());
      setStreamStatus({ connected: true, reconnecting: false, error: null });
    };

    const handlePostCreated = (event) => {
      if (closed) return;
      const payload = safeParse(event);
      if (payload?.post) {
        setPosts((current) => upsertLiveFeedPost(current, payload.post, { maxSize: maxStreamPosts }));
        setLastUpdated(new Date());
      }
    };

    const handleBidCreated = (event) => {
      if (closed) return;
      const payload = safeParse(event);
      if (payload) {
        setPosts((current) => applyBidCreated(current, payload));
        setLastUpdated(new Date());
      }
    };

    const handleBidMessage = (event) => {
      if (closed) return;
      const payload = safeParse(event);
      if (payload) {
        setPosts((current) => applyBidMessage(current, payload));
        setLastUpdated(new Date());
      }
    };

    const handleConnected = () => {
      if (closed) return;
      setStreamStatus({ connected: true, reconnecting: false, error: null });
    };

    const handleError = () => {
      if (closed) return;
      setStreamStatus((current) => ({
        connected: false,
        reconnecting: true,
        error: current.error || 'Live updates interrupted. Attempting to reconnect…'
      }));
    };

    source.addEventListener('connected', handleConnected);
    source.addEventListener('snapshot', handleSnapshot);
    source.addEventListener('post.created', handlePostCreated);
    source.addEventListener('bid.created', handleBidCreated);
    source.addEventListener('bid.message', handleBidMessage);
    source.addEventListener('heartbeat', () => {
      if (closed) return;
      setLastUpdated(new Date());
    });
    source.onerror = handleError;

    return () => {
      closed = true;
      source.close();
    };
  }, [canView, filters.includeOutOfZone, filters.outOfZoneOnly, filters.zoneId, maxStreamPosts]);

  const handleFormChange = (patch) => {
    setFormState((current) => ({ ...current, ...patch }));
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const payload = {
        ...formState,
        budgetAmount: formState.budgetAmount ? Number(formState.budgetAmount) : undefined,
        allowOutOfZone: formState.allowOutOfZone,
        bidDeadline: formState.bidDeadline
          ? new Date(formState.bidDeadline).toISOString()
          : undefined
      };

      const created = await createLiveFeedPost(payload);
      setPosts((current) => upsertLiveFeedPost(current, created, { maxSize: maxStreamPosts }));
      setFormState(INITIAL_FORM_STATE);
      setFormSuccess('Job broadcast successfully. Providers are being notified in real time.');
      setLastUpdated(new Date());
    } catch (submissionError) {
      setFormError(submissionError.message || 'Unable to publish job');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleBidSubmit = async (postId, payload) => {
    setBidStatus((current) => ({ ...current, [postId]: { state: 'loading' } }));
    try {
      const bid = await submitCustomJobBid(postId, payload);
      setPosts((current) => applyBidCreated(current, { postId, bid }));
      setBidStatus((current) => ({ ...current, [postId]: { state: 'success' } }));
      setLastUpdated(new Date());
    } catch (submissionError) {
      setBidStatus((current) => ({
        ...current,
        [postId]: { state: 'error', message: submissionError.message || 'Unable to submit bid' }
      }));
    }
  };

  const handleBidMessageSubmit = async (postId, bidId, payload) => {
    const statusKey = `${postId}:${bidId}`;
    setMessageStatus((current) => ({ ...current, [statusKey]: { state: 'loading' } }));
    try {
      const message = await sendCustomJobBidMessage(postId, bidId, payload);
      setPosts((current) => applyBidMessage(current, { postId, bidId, message }));
      setMessageStatus((current) => ({ ...current, [statusKey]: { state: 'success' } }));
      setLastUpdated(new Date());
    } catch (submissionError) {
      setMessageStatus((current) => ({
        ...current,
        [statusKey]: {
          state: 'error',
          message: submissionError.message || 'Unable to send message'
        }
      }));
    }
  };

  const visiblePosts = useMemo(() => (condensed ? posts.slice(0, 3) : posts), [condensed, posts]);

  return (
    <section className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-glow">
      <div className="px-6 py-6 space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Live feed</h2>
            <p className="text-sm text-slate-500">
              Real-time briefs, custom job requests, and bid activity across your network.
            </p>
          </div>
          {!condensed ? (
            <div className="flex flex-col items-end space-y-1 text-right text-xs text-slate-500">
              <div
                className={clsx(
                  'inline-flex items-center gap-2 font-semibold',
                  streamStatus.connected
                    ? 'text-emerald-600'
                    : streamStatus.reconnecting
                      ? 'text-amber-600'
                      : 'text-slate-500'
                )}
              >
                <span
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    streamStatus.connected
                      ? 'bg-emerald-500 animate-pulse'
                      : streamStatus.reconnecting
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-slate-300'
                  )}
                  aria-hidden="true"
                />
                {streamStatus.connected
                  ? 'Streaming live updates'
                  : streamStatus.reconnecting
                    ? 'Reconnecting…'
                    : 'Live updates paused'}
              </div>
              <div>
                {lastUpdated
                  ? `Last update ${formatRelativeTime(lastUpdated)}`
                  : 'Awaiting first refresh'}
              </div>
              {streamStatus.error ? (
                <p className="text-rose-500">{streamStatus.error}</p>
              ) : null}
            </div>
          ) : (
            <a href="/feed" className="text-sm font-semibold text-accent hover:text-primary">
              View provider workspace
            </a>
          )}
        </header>

        {!condensed && canView ? (
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/70 p-4">
            <div className="flex items-center gap-2">
              <label htmlFor="live-feed-zone" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Zone
              </label>
              <select
                id="live-feed-zone"
                value={filters.zoneId}
                onChange={(event) => setFilters((current) => ({ ...current, zoneId: event.target.value }))}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-accent focus:outline-none"
              >
                <option value="">All zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <input
                type="checkbox"
                checked={filters.includeOutOfZone}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    includeOutOfZone: event.target.checked,
                    outOfZoneOnly: event.target.checked ? current.outOfZoneOnly : false
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Include out-of-zone
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <input
                type="checkbox"
                checked={filters.outOfZoneOnly}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    outOfZoneOnly: event.target.checked,
                    includeOutOfZone: event.target.checked ? true : current.includeOutOfZone
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Out-of-zone only
            </label>
          </div>
        ) : null}

        {!canView ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
            <p className="text-sm font-semibold text-primary">
              Sign in with a Fixnado account to unlock live feed intelligence.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Providers see high-signal job requests, can bid instantly, and manage negotiations in one place.
            </p>
          </div>
        ) : (
          <Fragment>
            {canCreate && !condensed ? (
              <JobComposer
                form={formState}
                onChange={handleFormChange}
                onSubmit={handleCreatePost}
                submitting={formSubmitting}
                error={formError}
                successMessage={formSuccess}
                zones={zones}
                zoneLoading={zoneLoading}
              />
            ) : null}

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : feedError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-600">
                {feedError}
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
                No live posts match your filters yet. Adjust your filters or publish a new job to get responses.
              </div>
            ) : (
              <div className="space-y-5">
                {visiblePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    canBid={canBid && !condensed}
                    canMessage={canMessage && !condensed}
                    onBidSubmit={handleBidSubmit}
                    onMessageSubmit={canMessage && !condensed ? handleBidMessageSubmit : undefined}
                    bidStatus={bidStatus[post.id] ?? { state: 'idle' }}
                    messageStatus={Object.fromEntries(
                      Object.entries(messageStatus)
                        .filter(([key]) => key.startsWith(`${post.id}:`))
                        .map(([key, value]) => [key.split(':')[1], value])
                    )}
                  />
                ))}
              </div>
            )}
          </Fragment>
        )}
      </div>
    </section>
  );
}

LiveFeed.propTypes = {
  condensed: PropTypes.bool
};

LiveFeed.defaultProps = {
  condensed: false
};

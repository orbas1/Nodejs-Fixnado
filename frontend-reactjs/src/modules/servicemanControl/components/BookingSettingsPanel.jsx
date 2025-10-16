import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import ChecklistEditor from './ChecklistEditor.jsx';
import AttachmentEditor from './AttachmentEditor.jsx';

const CONTACT_OPTIONS = [
  { value: 'sms', label: 'SMS' },
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push notification' }
];

function QuickRepliesEditor({ replies, onChange }) {
  const safeReplies = Array.isArray(replies) ? replies : [];

  const handleChange = (index, value) => {
    const next = safeReplies.map((reply, itemIndex) => (itemIndex === index ? value : reply));
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...safeReplies, '']);
  };

  const handleRemove = (index) => {
    onChange(safeReplies.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Quick replies</p>
        <Button type="button" size="sm" variant="ghost" onClick={handleAdd}>
          Add reply
        </Button>
      </div>
      <div className="space-y-2">
        {safeReplies.map((reply, index) => (
          <div key={`quick-reply-${index}`} className="flex gap-2">
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              value={reply}
              onChange={(event) => handleChange(index, event.target.value)}
              placeholder="On site, 20 mins"
            />
            <Button type="button" size="xs" variant="ghost" onClick={() => handleRemove(index)}>
              Remove
            </Button>
          </div>
        ))}
        {!safeReplies.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
            No quick replies configured. Add reusable SMS/email responses to speed updates.
          </p>
        ) : null}
      </div>
    </div>
  );
}

QuickRepliesEditor.propTypes = {
  replies: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

QuickRepliesEditor.defaultProps = {
  replies: []
};

export default function BookingSettingsPanel({ settings, onSave, saving }) {
  const [form, setForm] = useState({
    autoAcceptAssignments: false,
    travelBufferMinutes: 30,
    maxDailyJobs: 8,
    preferredContactChannel: 'sms',
    defaultArrivalWindowStart: '',
    defaultArrivalWindowEnd: '',
    notesTemplate: '',
    safetyBriefTemplate: ''
  });
  const [quickReplies, setQuickReplies] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [assetLibrary, setAssetLibrary] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setForm({
      autoAcceptAssignments: settings.autoAcceptAssignments === true,
      travelBufferMinutes: settings.travelBufferMinutes ?? 30,
      maxDailyJobs: settings.maxDailyJobs ?? 8,
      preferredContactChannel: settings.preferredContactChannel ?? 'sms',
      defaultArrivalWindowStart: settings.defaultArrivalWindow?.start ?? '',
      defaultArrivalWindowEnd: settings.defaultArrivalWindow?.end ?? '',
      notesTemplate: settings.notesTemplate ?? '',
      safetyBriefTemplate: settings.safetyBriefTemplate ?? ''
    });
    setQuickReplies(Array.isArray(settings.quickReplies) ? settings.quickReplies : []);
    setChecklist(Array.isArray(settings.defaultChecklist) ? settings.defaultChecklist : []);
    setAssetLibrary(Array.isArray(settings.assetLibrary) ? settings.assetLibrary : []);
  }, [settings]);

  const stats = useMemo(() => ({
    replies: quickReplies.filter((reply) => reply.trim().length > 0).length,
    checklist: checklist.length,
    assets: assetLibrary.filter((asset) => asset.url).length
  }), [quickReplies, checklist, assetLibrary]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        autoAcceptAssignments: form.autoAcceptAssignments,
        travelBufferMinutes: Number.parseInt(form.travelBufferMinutes, 10) || 0,
        maxDailyJobs: Number.parseInt(form.maxDailyJobs, 10) || 0,
        preferredContactChannel: form.preferredContactChannel,
        defaultArrivalWindow: {
          start: form.defaultArrivalWindowStart || null,
          end: form.defaultArrivalWindowEnd || null
        },
        notesTemplate: form.notesTemplate,
        safetyBriefTemplate: form.safetyBriefTemplate,
        quickReplies: quickReplies.filter((reply) => reply.trim().length > 0),
        defaultChecklist: checklist,
        assetLibrary: assetLibrary.filter((asset) => asset.url)
      });
      setFeedback('Settings saved successfully');
      setLastSavedAt(new Date());
    } catch (caught) {
      setError(caught?.message ?? 'Failed to save settings');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-5">
      <header className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Crew preferences</h3>
        <p className="text-sm text-slate-600">
          Control assignment automation, travel buffers, and communication templates for this serviceman.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
            {stats.replies} quick replies
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
            {stats.checklist} checklist items
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
            {stats.assets} assets linked
          </span>
          {lastSavedAt ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-4">
        <div className="flex flex-col gap-3">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-primary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={form.autoAcceptAssignments}
              onChange={(event) => setForm((current) => ({ ...current, autoAcceptAssignments: event.target.checked }))}
            />
            Auto-accept marketplace assignments
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium text-primary">
              Travel buffer (minutes)
              <input
                type="number"
                min="0"
                max="480"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={form.travelBufferMinutes}
                onChange={(event) => setForm((current) => ({ ...current, travelBufferMinutes: event.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Max jobs per day
              <input
                type="number"
                min="1"
                max="24"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={form.maxDailyJobs}
                onChange={(event) => setForm((current) => ({ ...current, maxDailyJobs: event.target.value }))}
              />
            </label>
          </div>
          <label className="text-xs font-medium text-primary">
            Preferred contact channel
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              value={form.preferredContactChannel}
              onChange={(event) => setForm((current) => ({ ...current, preferredContactChannel: event.target.value }))}
            >
              {CONTACT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium text-primary">
              Default arrival window start
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={form.defaultArrivalWindowStart}
                onChange={(event) => setForm((current) => ({ ...current, defaultArrivalWindowStart: event.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Default arrival window end
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={form.defaultArrivalWindowEnd}
                onChange={(event) => setForm((current) => ({ ...current, defaultArrivalWindowEnd: event.target.value }))}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-4">
        <label className="text-xs font-medium text-primary">
          Notes template
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            rows={3}
            value={form.notesTemplate}
            onChange={(event) => setForm((current) => ({ ...current, notesTemplate: event.target.value }))}
            placeholder="Dear client, we're on route..."
          />
        </label>
        <label className="text-xs font-medium text-primary">
          Safety brief template
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            rows={3}
            value={form.safetyBriefTemplate}
            onChange={(event) => setForm((current) => ({ ...current, safetyBriefTemplate: event.target.value }))}
            placeholder="Crew PPE checklist, muster points, risk controls..."
          />
        </label>
      </section>

      <QuickRepliesEditor replies={quickReplies} onChange={setQuickReplies} />
      <ChecklistEditor items={checklist} onChange={setChecklist} />
      <AttachmentEditor
        title="Asset library"
        items={assetLibrary}
        onChange={setAssetLibrary}
        emptyLabel="Add frequently used documents or media for rapid booking setup."
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="1rem" /> Saving
            </span>
          ) : (
            'Save preferences'
          )}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Back to top
        </Button>
      </div>
    </form>
  );
}

BookingSettingsPanel.propTypes = {
  settings: PropTypes.shape({
    autoAcceptAssignments: PropTypes.bool,
    travelBufferMinutes: PropTypes.number,
    maxDailyJobs: PropTypes.number,
    preferredContactChannel: PropTypes.string,
    defaultArrivalWindow: PropTypes.shape({
      start: PropTypes.string,
      end: PropTypes.string
    }),
    notesTemplate: PropTypes.string,
    safetyBriefTemplate: PropTypes.string,
    quickReplies: PropTypes.arrayOf(PropTypes.string),
    defaultChecklist: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        mandatory: PropTypes.bool
      })
    ),
    assetLibrary: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string
      })
    )
  }),
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

BookingSettingsPanel.defaultProps = {
  settings: null,
  saving: false
};

import PropTypes from 'prop-types';

function ParticipantControls({ participant, onPreferencesChange, disabled }) {
  if (!participant) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Participant settings</h3>
        <span className="text-xs text-slate-400">{participant.displayName || 'Participant'}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="text-slate-700">Alerts</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-500"
            checked={participant.notificationsEnabled}
            onChange={(event) => onPreferencesChange({ notificationsEnabled: event.target.checked })}
            disabled={disabled}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="text-slate-700">AI assist</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-500"
            checked={participant.aiAssistEnabled}
            onChange={(event) => onPreferencesChange({ aiAssistEnabled: event.target.checked })}
            disabled={disabled}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="text-slate-700">Video</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-500"
            checked={participant.videoEnabled}
            onChange={(event) => onPreferencesChange({ videoEnabled: event.target.checked })}
            disabled={disabled}
          />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
        <label className="flex flex-col gap-1 rounded-xl bg-slate-100 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quiet hours start</span>
          <input
            type="time"
            value={participant.quietHoursStart || ''}
            onChange={(event) => onPreferencesChange({ quietHoursStart: event.target.value || null })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-900"
            disabled={disabled}
          />
        </label>
        <label className="flex flex-col gap-1 rounded-xl bg-slate-100 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quiet hours end</span>
          <input
            type="time"
            value={participant.quietHoursEnd || ''}
            onChange={(event) => onPreferencesChange({ quietHoursEnd: event.target.value || null })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-900"
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}

ParticipantControls.propTypes = {
  participant: PropTypes.shape({
    displayName: PropTypes.string,
    notificationsEnabled: PropTypes.bool,
    aiAssistEnabled: PropTypes.bool,
    videoEnabled: PropTypes.bool,
    quietHoursStart: PropTypes.string,
    quietHoursEnd: PropTypes.string
  }),
  onPreferencesChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ParticipantControls.defaultProps = {
  participant: null,
  disabled: false
};

export default ParticipantControls;

import PropTypes from 'prop-types';

import {
  COMMUNICATIONS_ALLOWED_ROLES,
  formatRoleLabel
} from '../../../constants/accessControl.js';

function EscalationRulesManager({
  escalationRules,
  newEscalationRule,
  onNewEscalationChange,
  onRoleToggle,
  onNewEscalationSubmit,
  saving,
  onEditStart,
  editingEscalationId,
  editingEscalationDraft,
  onEditingChange,
  onEditingRoleToggle,
  onEditSave,
  onEditCancel,
  onDelete
}) {
  const renderTriggerExtras = (draft, changeHandler) => {
    if (draft.triggerType === 'keyword') {
      return (
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Keywords (comma separated)
          <input
            type="text"
            value={draft.keywords}
            onChange={(event) => changeHandler('keywords', event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            placeholder="urgent, refund"
          />
        </label>
      );
    }

    if (draft.triggerType === 'inactivity') {
      return (
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Escalate after minutes
          <input
            type="number"
            min="1"
            value={draft.minutesWithoutReply}
            onChange={(event) => changeHandler('minutesWithoutReply', event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            placeholder="15"
          />
        </label>
      );
    }

    return null;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">Escalation rules</h2>
      <p className="mt-1 text-xs text-slate-500">
        Route urgent conversations to the right team when keywords or inactivity thresholds are met.
      </p>
      <form onSubmit={onNewEscalationSubmit} className="mt-4 space-y-3 rounded-2xl bg-slate-50/70 p-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Name
          <input
            type="text"
            value={newEscalationRule.name}
            onChange={(event) => onNewEscalationChange('name', event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            placeholder="Ops fallback"
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Trigger type
            <select
              value={newEscalationRule.triggerType}
              onChange={(event) => onNewEscalationChange('triggerType', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            >
              <option value="keyword">Keywords</option>
              <option value="inactivity">Inactivity</option>
              <option value="sentiment">Sentiment</option>
              <option value="manual">Manual trigger</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Target type
            <select
              value={newEscalationRule.targetType}
              onChange={(event) => onNewEscalationChange('targetType', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            >
              <option value="user">User</option>
              <option value="team">Team</option>
              <option value="email">Email</option>
              <option value="webhook">Webhook</option>
            </select>
          </label>
        </div>
        {renderTriggerExtras(newEscalationRule, onNewEscalationChange)}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Target reference
            <input
              type="text"
              value={newEscalationRule.targetReference}
              onChange={(event) => onNewEscalationChange('targetReference', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="ops@fixnado.com"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            SLA minutes
            <input
              type="number"
              min="1"
              value={newEscalationRule.slaMinutes}
              onChange={(event) => onNewEscalationChange('slaMinutes', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="15"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Target label
          <input
            type="text"
            value={newEscalationRule.targetLabel}
            onChange={(event) => onNewEscalationChange('targetLabel', event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            placeholder="Operations mailbox"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Response template
          <textarea
            rows={3}
            value={newEscalationRule.responseTemplate}
            onChange={(event) => onNewEscalationChange('responseTemplate', event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            placeholder="We escalated this conversation to operations."
          />
        </label>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {COMMUNICATIONS_ALLOWED_ROLES.map((role) => (
            <label
              key={`new-escalation-${role}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-sky-500"
                checked={newEscalationRule.allowedRoles.includes(role)}
                onChange={() => onRoleToggle(role)}
              />
              <span>{formatRoleLabel(role)}</span>
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
          disabled={saving}
        >
          Add escalation rule
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {escalationRules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-4 text-xs text-slate-500">
            No escalation rules are configured yet.
          </p>
        ) : (
          escalationRules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {editingEscalationId === rule.id && editingEscalationDraft ? (
                <form className="space-y-3" onSubmit={onEditSave}>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Name
                    <input
                      type="text"
                      value={editingEscalationDraft.name}
                      onChange={(event) => onEditingChange('name', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      required
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Trigger type
                      <select
                        value={editingEscalationDraft.triggerType}
                        onChange={(event) => onEditingChange('triggerType', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="keyword">Keywords</option>
                        <option value="inactivity">Inactivity</option>
                        <option value="sentiment">Sentiment</option>
                        <option value="manual">Manual trigger</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Target type
                      <select
                        value={editingEscalationDraft.targetType}
                        onChange={(event) => onEditingChange('targetType', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="user">User</option>
                        <option value="team">Team</option>
                        <option value="email">Email</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </label>
                  </div>
                  {renderTriggerExtras(editingEscalationDraft, onEditingChange)}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Target reference
                      <input
                        type="text"
                        value={editingEscalationDraft.targetReference}
                        onChange={(event) => onEditingChange('targetReference', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      SLA minutes
                      <input
                        type="number"
                        min="1"
                        value={editingEscalationDraft.slaMinutes}
                        onChange={(event) => onEditingChange('slaMinutes', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Target label
                    <input
                      type="text"
                      value={editingEscalationDraft.targetLabel}
                      onChange={(event) => onEditingChange('targetLabel', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Response template
                    <textarea
                      rows={3}
                      value={editingEscalationDraft.responseTemplate}
                      onChange={(event) => onEditingChange('responseTemplate', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    {COMMUNICATIONS_ALLOWED_ROLES.map((role) => (
                      <label
                        key={`edit-escalation-${rule.id}-${role}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-sky-500"
                          checked={editingEscalationDraft.allowedRoles.includes(role)}
                          onChange={() => onEditingRoleToggle(role)}
                        />
                        <span>{formatRoleLabel(role)}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                      disabled={saving}
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={onEditCancel}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{rule.name}</p>
                      <p className="mt-1 text-slate-500">{rule.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEditStart(rule)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(rule.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {rule.triggerType}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Target {rule.targetType}
                    </span>
                    {rule.allowedRoles.map((role) => (
                      <span
                        key={`${rule.id}-role-${role}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
                      >
                        {formatRoleLabel(role)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

EscalationRulesManager.propTypes = {
  escalationRules: PropTypes.arrayOf(PropTypes.object).isRequired,
  newEscalationRule: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    triggerType: PropTypes.string,
    keywords: PropTypes.string,
    minutesWithoutReply: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    targetType: PropTypes.string,
    targetReference: PropTypes.string,
    targetLabel: PropTypes.string,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
    slaMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    responseTemplate: PropTypes.string
  }).isRequired,
  onNewEscalationChange: PropTypes.func.isRequired,
  onRoleToggle: PropTypes.func.isRequired,
  onNewEscalationSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  onEditStart: PropTypes.func.isRequired,
  editingEscalationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  editingEscalationDraft: PropTypes.shape({
    name: PropTypes.string,
    triggerType: PropTypes.string,
    keywords: PropTypes.string,
    minutesWithoutReply: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    targetType: PropTypes.string,
    targetReference: PropTypes.string,
    targetLabel: PropTypes.string,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
    slaMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    responseTemplate: PropTypes.string
  }),
  onEditingChange: PropTypes.func.isRequired,
  onEditingRoleToggle: PropTypes.func.isRequired,
  onEditSave: PropTypes.func.isRequired,
  onEditCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default EscalationRulesManager;

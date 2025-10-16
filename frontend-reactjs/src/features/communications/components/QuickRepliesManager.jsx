import PropTypes from 'prop-types';

import {
  COMMUNICATIONS_ALLOWED_ROLES,
  formatRoleLabel
} from '../../../constants/accessControl.js';

function QuickRepliesManager({
  quickReplies,
  newQuickReply,
  onNewQuickReplyChange,
  onNewQuickReplySubmit,
  onRoleToggle,
  saving,
  onTemplateSelect,
  onEditStart,
  editingQuickReplyId,
  editingQuickReplyDraft,
  onEditingChange,
  onEditingRoleToggle,
  onEditSave,
  onEditCancel,
  onDelete
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">Quick replies</h2>
      <p className="mt-1 text-xs text-slate-500">
        Create reusable snippets to speed up responses. Replies respect role visibility.
      </p>
      <form onSubmit={onNewQuickReplySubmit} className="mt-4 space-y-3 rounded-2xl bg-slate-50/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Title
            <input
              type="text"
              value={newQuickReply.title}
              onChange={(event) => onNewQuickReplyChange('title', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="Acknowledgement"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Sort order
            <input
              type="number"
              value={newQuickReply.sortOrder}
              onChange={(event) => onNewQuickReplyChange('sortOrder', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="Auto"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Body
          <textarea
            rows={3}
            value={newQuickReply.body}
            onChange={(event) => onNewQuickReplyChange('body', event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            placeholder="Thanks for getting in touch!"
            required
          />
        </label>
        <div className="grid gap-2 text-xs text-slate-600">
          <p className="font-semibold uppercase tracking-[0.25em] text-slate-500">Visible to roles</p>
          <div className="flex flex-wrap gap-2">
            {COMMUNICATIONS_ALLOWED_ROLES.map((role) => (
              <label
                key={`new-reply-${role}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-sky-500"
                  checked={newQuickReply.allowedRoles.includes(role)}
                  onChange={() => onRoleToggle(role)}
                />
                <span>{formatRoleLabel(role)}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400"
          disabled={saving}
        >
          Add quick reply
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {quickReplies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-4 text-xs text-slate-500">
            No quick replies yet. Add your first template above.
          </p>
        ) : (
          quickReplies.map((reply) => (
            <div key={reply.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {editingQuickReplyId === reply.id && editingQuickReplyDraft ? (
                <form className="space-y-3" onSubmit={onEditSave}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Title
                      <input
                        type="text"
                        value={editingQuickReplyDraft.title}
                        onChange={(event) => onEditingChange('title', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Sort order
                      <input
                        type="number"
                        value={editingQuickReplyDraft.sortOrder}
                        onChange={(event) => onEditingChange('sortOrder', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Body
                    <textarea
                      rows={3}
                      value={editingQuickReplyDraft.body}
                      onChange={(event) => onEditingChange('body', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      required
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    {COMMUNICATIONS_ALLOWED_ROLES.map((role) => (
                      <label
                        key={`edit-reply-${reply.id}-${role}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-sky-500"
                          checked={editingQuickReplyDraft.allowedRoles.includes(role)}
                          onChange={() => onEditingRoleToggle(role)}
                        />
                        <span>{formatRoleLabel(role)}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400"
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
                      <p className="text-sm font-semibold text-slate-800">{reply.title}</p>
                      <p className="mt-1 text-slate-500">{reply.body}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onTemplateSelect(reply.body)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                      >
                        Use reply
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditStart(reply)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(reply.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Order {reply.sortOrder}
                    </span>
                    {reply.allowedRoles.map((role) => (
                      <span
                        key={`${reply.id}-role-${role}`}
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

QuickRepliesManager.propTypes = {
  quickReplies: PropTypes.arrayOf(PropTypes.object).isRequired,
  newQuickReply: PropTypes.shape({
    title: PropTypes.string,
    body: PropTypes.string,
    category: PropTypes.string,
    sortOrder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    allowedRoles: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onNewQuickReplyChange: PropTypes.func.isRequired,
  onNewQuickReplySubmit: PropTypes.func.isRequired,
  onRoleToggle: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  onTemplateSelect: PropTypes.func.isRequired,
  onEditStart: PropTypes.func.isRequired,
  editingQuickReplyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  editingQuickReplyDraft: PropTypes.shape({
    title: PropTypes.string,
    body: PropTypes.string,
    sortOrder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    allowedRoles: PropTypes.arrayOf(PropTypes.string)
  }),
  onEditingChange: PropTypes.func.isRequired,
  onEditingRoleToggle: PropTypes.func.isRequired,
  onEditSave: PropTypes.func.isRequired,
  onEditCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default QuickRepliesManager;

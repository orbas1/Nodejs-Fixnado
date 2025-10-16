import PropTypes from 'prop-types';
import AttachmentIcon from './AttachmentIcon.jsx';

function NotesTimeline({ notes, onDelete }) {
  if (!Array.isArray(notes) || notes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-accent/30 bg-secondary/60 px-4 py-3 text-sm text-slate-500">
        No notes yet. Add delivery updates, approvals, or links to evidence so everyone stays aligned.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-2xl border border-accent/10 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">{note.author?.name || 'Team member'}</p>
              <p className="text-xs text-slate-500">{note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Just now'}</p>
            </div>
            {onDelete ? (
              <button type="button" onClick={() => onDelete(note)} className="text-xs font-semibold text-rose-500 hover:text-rose-400">
                Remove
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-slate-700">{note.body}</p>
          {Array.isArray(note.attachments) && note.attachments.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {note.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 text-xs font-semibold text-primary hover:border-accent/40"
                >
                  <AttachmentIcon type={attachment.type} />
                  {attachment.label}
                </a>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

NotesTimeline.propTypes = {
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      body: PropTypes.string.isRequired,
      createdAt: PropTypes.string,
      author: PropTypes.shape({
        name: PropTypes.string
      }),
      attachments: PropTypes.array
    })
  ),
  onDelete: PropTypes.func
};

NotesTimeline.defaultProps = {
  notes: [],
  onDelete: null
};

export default NotesTimeline;

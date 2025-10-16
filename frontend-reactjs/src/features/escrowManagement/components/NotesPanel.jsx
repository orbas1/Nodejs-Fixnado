import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import { Card, Button, Checkbox, StatusPill } from '../../../components/ui/index.js';
import FormField from '../../../components/ui/FormField.jsx';
import { formatDate } from '../utils/formatters.js';

export default function NotesPanel({ escrow, onAddNote, onDeleteNote, onTogglePinned, adding }) {
  const [noteBody, setNoteBody] = useState('');
  const [pinNote, setPinNote] = useState(false);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!noteBody.trim()) {
        return;
      }
      await onAddNote(noteBody, pinNote);
      setNoteBody('');
      setPinNote(false);
    },
    [noteBody, pinNote, onAddNote]
  );

  return (
    <Card className="space-y-4 border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">Escrow notes</h3>
          <p className="text-xs text-slate-500">Share decision logs and release approvals.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField id="new-note" label="Add note">
          <textarea
            id="new-note"
            className="fx-text-input min-h-[90px]"
            value={noteBody}
            onChange={(event) => setNoteBody(event.target.value)}
          />
        </FormField>
        <Checkbox label="Pin note" checked={pinNote} onChange={(event) => setPinNote(event.target.checked)} />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={adding || !noteBody.trim()}>
            Add note
          </Button>
        </div>
      </form>
      <div className="space-y-3">
        {escrow.notes?.length === 0 ? (
          <p className="text-sm text-slate-500">No notes yet. Capture approval decisions or compliance context here.</p>
        ) : (
          escrow.notes.map((note) => (
            <Card key={note.id} className="space-y-2 border-slate-200 bg-white/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="whitespace-pre-line text-sm text-slate-700">{note.body}</p>
                  <p className="text-xs text-slate-400">{formatDate(note.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => onTogglePinned(note)}>
                    {note.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => onDeleteNote(note)}>
                    Remove
                  </Button>
                </div>
              </div>
              {note.pinned ? <StatusPill tone="info">Pinned</StatusPill> : null}
            </Card>
          ))
        )}
      </div>
    </Card>
  );
}

NotesPanel.propTypes = {
  escrow: PropTypes.shape({
    notes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        body: PropTypes.string,
        createdAt: PropTypes.string,
        pinned: PropTypes.bool
      })
    )
  }).isRequired,
  onAddNote: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onTogglePinned: PropTypes.func.isRequired,
  adding: PropTypes.bool
};

NotesPanel.defaultProps = {
  adding: false
};

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ModalShell from './ModalShell.jsx';
import { InlineBanner, Field, TextArea, SelectField, CheckboxField } from './FormControls.jsx';
import { disputeNoteTemplate, disputeNoteTypeOptions, disputeNoteVisibilityOptions } from './constants.js';

const DisputeNoteModal = ({ open, note, onClose, onSubmit, saving, status }) => {
  const [form, setForm] = useState(disputeNoteTemplate);

  useEffect(() => {
    if (note) {
      setForm({ ...disputeNoteTemplate, ...note });
    } else {
      setForm({ ...disputeNoteTemplate });
    }
  }, [note]);

  const handleChange = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCheckbox = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: Boolean(value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={form.id ? 'Edit case note' : 'Add case note'}
      description={note?.caseTitle ? `Case: ${note.caseTitle}` : 'Share updates, decisions, or escalation details.'}
      footer={[
        <button
          key="cancel"
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300"
        >
          Cancel
        </button>,
        <button
          key="submit"
          type="submit"
          form="dispute-note-form"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : form.id ? 'Update note' : 'Add note'}
        </button>
      ]}
    >
      <form id="dispute-note-form" className="space-y-4" onSubmit={handleSubmit}>
        <InlineBanner tone={status?.tone} message={status?.message} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="note-type" label="Note type">
            <SelectField id="note-type" value={form.noteType} onChange={handleChange('noteType')} options={disputeNoteTypeOptions} />
          </Field>
          <Field id="note-visibility" label="Visibility">
            <SelectField id="note-visibility" value={form.visibility} onChange={handleChange('visibility')} options={disputeNoteVisibilityOptions} />
          </Field>
        </div>
        <Field id="note-body" label="Note body" description="Include the update or decision in plain language.">
          <TextArea id="note-body" rows={4} value={form.body} onChange={handleChange('body')} placeholder="Compliance requested additional evidence from provider." />
        </Field>
        <Field id="note-nextSteps" label="Next steps" description="Optional guidance for the next owner.">
          <TextArea id="note-nextSteps" rows={2} value={form.nextSteps} onChange={handleChange('nextSteps')} placeholder="Review footage once uploaded and confirm settlement." />
        </Field>
        <CheckboxField
          id="note-pinned"
          checked={form.pinned}
          onChange={handleCheckbox('pinned')}
          label="Pin this note"
          description="Pinned notes surface in dashboards and customer touchpoints."
        />
      </form>
    </ModalShell>
  );
};

DisputeNoteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  note: PropTypes.shape({
    id: PropTypes.string,
    disputeCaseId: PropTypes.string,
    noteType: PropTypes.string,
    visibility: PropTypes.string,
    body: PropTypes.string,
    nextSteps: PropTypes.string,
    pinned: PropTypes.bool,
    caseTitle: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({ tone: PropTypes.string, message: PropTypes.string })
};

DisputeNoteModal.defaultProps = {
  note: null,
  saving: false,
  status: null
};

export default DisputeNoteModal;

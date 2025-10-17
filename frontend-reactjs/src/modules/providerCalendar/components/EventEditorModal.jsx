import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useProviderCalendar } from '../ProviderCalendarProvider.jsx';

function toInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const EventEditorModal = ({ open }) => {
  const { eventDraft, options, actions, timezone, permissions } = useProviderCalendar();
  const [draft, setDraft] = useState(eventDraft || {});
  const [saving, setSaving] = useState(false);
  const eventTypes = options.eventTypes ?? [];
  const eventStatuses = options.eventStatuses ?? [];
  const canManageEvents = permissions?.canManageEvents !== false;

  useEffect(() => {
    setDraft(eventDraft || {});
  }, [eventDraft]);

  const title = eventDraft?.id ? 'Edit calendar event' : 'Create calendar event';

  const handleChange = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManageEvents || !draft.title || !draft.start) {
      return;
    }
    setSaving(true);
    try {
      await actions.saveEvent({ ...draft, timezone });
    } catch (error) {
      // feedback handled upstream
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = useMemo(
    () =>
      eventStatuses.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )),
    [eventStatuses]
  );

  const typeOptions = useMemo(
    () =>
      eventTypes.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )),
    [eventTypes]
  );

  return (
    <Modal open={open} onClose={actions.closeEventModal} title={title} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField id="event-title" label="Title">
          <TextInput
            value={draft.title ?? ''}
            onChange={handleChange('title')}
            required
            maxLength={160}
            disabled={!canManageEvents}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="event-start" label="Start">
            <TextInput
              type="datetime-local"
              value={toInputValue(draft.start)}
              onChange={handleChange('start')}
              required
              disabled={!canManageEvents}
            />
          </FormField>
          <FormField id="event-end" label="End" optionalLabel="Optional">
            <TextInput
              type="datetime-local"
              value={toInputValue(draft.end)}
              onChange={handleChange('end')}
              disabled={!canManageEvents}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="event-status" label="Status">
            <Select value={draft.status ?? 'planned'} onChange={handleChange('status')} disabled={!canManageEvents}>
              {statusOptions}
            </Select>
          </FormField>
          <FormField id="event-type" label="Type">
            <Select value={draft.type ?? 'internal'} onChange={handleChange('type')} disabled={!canManageEvents}>
              {typeOptions}
            </Select>
          </FormField>
          <FormField id="event-visibility" label="Visibility">
            <Select value={draft.visibility ?? 'internal'} onChange={handleChange('visibility')} disabled={!canManageEvents}>
              <option value="internal">Internal</option>
              <option value="crew">Crew</option>
              <option value="public">Public</option>
            </Select>
          </FormField>
        </div>
        <FormField id="event-description" label="Notes" optionalLabel="Optional">
          <TextArea rows={3} value={draft.description ?? ''} onChange={handleChange('description')} disabled={!canManageEvents} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => actions.closeEventModal()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canManageEvents || saving}>
            {saving ? 'Saving…' : canManageEvents ? 'Save event' : 'View only'}
          </Button>
        </div>
        {!canManageEvents ? (
          <p className="text-xs text-slate-500">You do not have permission to manage calendar events.</p>
        ) : null}
      </form>
    </Modal>
  );
};

EventEditorModal.propTypes = {
  open: PropTypes.bool.isRequired
};

export default EventEditorModal;

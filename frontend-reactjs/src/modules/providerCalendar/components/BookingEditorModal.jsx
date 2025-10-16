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

const BookingEditorModal = ({ open }) => {
  const { bookingDraft, options, actions, permissions } = useProviderCalendar();
  const [draft, setDraft] = useState(bookingDraft || {});
  const [saving, setSaving] = useState(false);
  const zoneOptions = options.zones ?? [];
  const bookingStatuses = options.bookingStatuses ?? [];
  const canManageBookings = permissions?.canManageBookings !== false;

  useEffect(() => {
    setDraft(bookingDraft || {});
  }, [bookingDraft]);

  const handleChange = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManageBookings || !draft.title || !draft.start || !draft.zoneId) {
      return;
    }
    setSaving(true);
    try {
      await actions.saveBooking(draft);
    } catch (error) {
      // handled via feedback
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = useMemo(
    () =>
      bookingStatuses.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )),
    [bookingStatuses]
  );

  const zoneSelectOptions = useMemo(
    () =>
      zoneOptions.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      )),
    [zoneOptions]
  );

  const title = draft?.id ? 'Edit booking' : 'Create booking';

  return (
    <Modal open={open} onClose={actions.closeBookingModal} title={title} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField id="booking-title" label="Title">
          <TextInput
            value={draft.title ?? ''}
            onChange={handleChange('title')}
            required
            maxLength={160}
            disabled={!canManageBookings}
          />
        </FormField>
        <FormField id="booking-customer" label="Customer" optionalLabel="Optional">
          <TextInput
            value={draft.customerName ?? ''}
            onChange={handleChange('customerName')}
            maxLength={120}
            disabled={!canManageBookings}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="booking-start" label="Start">
            <TextInput
              type="datetime-local"
              value={toInputValue(draft.start)}
              onChange={handleChange('start')}
              required
              disabled={!canManageBookings}
            />
          </FormField>
          <FormField id="booking-end" label="End" optionalLabel="Optional">
            <TextInput
              type="datetime-local"
              value={toInputValue(draft.end)}
              onChange={handleChange('end')}
              disabled={!canManageBookings}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="booking-zone" label="Zone">
            <Select value={draft.zoneId ?? ''} onChange={handleChange('zoneId')} required disabled={!canManageBookings}>
              <option value="" disabled>
                Select zone
              </option>
              {zoneSelectOptions}
            </Select>
          </FormField>
          <FormField id="booking-status" label="Status">
            <Select value={draft.status ?? 'scheduled'} onChange={handleChange('status')} disabled={!canManageBookings}>
              {statusOptions}
            </Select>
          </FormField>
          <FormField id="booking-value" label="Value" optionalLabel="Optional">
            <TextInput
              type="number"
              step="0.01"
              value={draft.value ?? ''}
              onChange={handleChange('value')}
              disabled={!canManageBookings}
            />
          </FormField>
        </div>
        <FormField id="booking-currency" label="Currency" optionalLabel="Optional">
          <TextInput
            value={draft.currency ?? 'GBP'}
            onChange={handleChange('currency')}
            maxLength={3}
            disabled={!canManageBookings}
          />
        </FormField>
        <FormField id="booking-notes" label="Notes" optionalLabel="Optional">
          <TextArea rows={3} value={draft.notes ?? ''} onChange={handleChange('notes')} disabled={!canManageBookings} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => actions.closeBookingModal()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canManageBookings || saving}>
            {saving ? 'Saving…' : canManageBookings ? 'Save booking' : 'View only'}
          </Button>
        </div>
        {!canManageBookings ? (
          <p className="text-xs text-slate-500">You do not have permission to modify bookings.</p>
        ) : null}
      </form>
    </Modal>
  );
};

BookingEditorModal.propTypes = {
  open: PropTypes.bool.isRequired
};

export default BookingEditorModal;

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Button from '../../../components/ui/Button.jsx';

const DEFAULT_FORM = {
  name: '',
  filters: {
    status: '',
    zoneId: '',
    category: ''
  }
};

export default function ReportModal({ open, report, filters, onSubmit, onClose, saving }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM, ...report });
    }
  }, [open, report]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFilterChange = (field, value) => {
    setForm((current) => ({
      ...current,
      filters: { ...current.filters, [field]: value }
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      filters: form.filters
    });
  };

  const zoneOptions = [{ value: '', label: 'All zones' }, ...(filters?.zones ?? [])];
  const categoryOptions = [{ value: '', label: 'All categories' }, ...(filters?.categories ?? [])];
  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  return (
    <Modal open={open} onClose={onClose} title={report?.id ? 'Update report' : 'Create report'} size="md">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          label="Report name"
          value={form.name}
          onChange={(event) => handleChange('name', event.target.value)}
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Status filter
            <select
              value={form.filters?.status ?? ''}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Zone filter
            <select
              value={form.filters?.zoneId ?? ''}
              onChange={(event) => handleFilterChange('zoneId', event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
            >
              {zoneOptions.map((option) => (
                <option key={option.value || option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Category filter
            <select
              value={form.filters?.category ?? ''}
              onChange={(event) => handleFilterChange('category', event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
            >
              {categoryOptions.map((option) => (
                <option key={option.value || option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {report?.id ? 'Save changes' : 'Create report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

ReportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  report: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    filters: PropTypes.object
  }),
  filters: PropTypes.shape({
    zones: PropTypes.array,
    categories: PropTypes.array
  }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  saving: PropTypes.bool
};

ReportModal.defaultProps = {
  report: DEFAULT_FORM,
  filters: { zones: [], categories: [] },
  onClose: () => {},
  saving: false
};

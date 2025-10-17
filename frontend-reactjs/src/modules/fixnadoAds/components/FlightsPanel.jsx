import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Select, TextInput } from '../../../components/ui/index.js';
import { formatCurrency, formatDate, formatStatus } from '../utils/formatters.js';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' }
];

const INITIAL_FORM = {
  name: '',
  startAt: '',
  endAt: '',
  budget: '',
  dailySpendCap: '',
  status: 'scheduled'
};

export default function FlightsPanel({ flights, currency, onAddFlight, saving }) {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.startAt || !form.endAt || !form.budget) {
      return;
    }
    const payload = {
      name: form.name,
      startAt: form.startAt,
      endAt: form.endAt,
      budget: Number.parseFloat(form.budget),
      dailySpendCap:
        form.dailySpendCap !== '' && form.dailySpendCap !== null
          ? Number.parseFloat(form.dailySpendCap)
          : undefined,
      status: form.status
    };
    await onAddFlight(payload);
    setForm(INITIAL_FORM);
  };

  const totalBudget = useMemo(
    () => flights.reduce((acc, flight) => acc + Number.parseFloat(flight.budget ?? 0), 0),
    [flights]
  );

  return (
    <Card padding="lg" className="border border-slate-200 bg-white/70 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Flights</p>
          <h3 className="text-xl font-semibold text-primary">Delivery windows</h3>
          <p className="mt-2 text-sm text-slate-600">
            Add structured flights for phased rollouts. Each flight inherits campaign targeting but can run its own spend
            ceiling.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          Total allocated budget · <span className="font-semibold text-primary">{formatCurrency(totalBudget, currency)}</span>
        </div>
      </header>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-dashed border-slate-200 p-4 md:grid-cols-2">
          <TextInput label="Flight name" value={form.name} onChange={handleChange('name')} required placeholder="Emergency surge" />
          <Select label="Status" value={form.status} onChange={handleChange('status')} options={STATUS_OPTIONS} />
          <TextInput label="Starts" type="date" value={form.startAt} onChange={handleChange('startAt')} required />
          <TextInput label="Ends" type="date" value={form.endAt} onChange={handleChange('endAt')} required />
          <TextInput
            label="Budget"
            type="number"
            min="0"
            step="0.01"
            prefix={currency}
            value={form.budget}
            onChange={handleChange('budget')}
            required
          />
          <TextInput
            label="Daily spend cap"
            type="number"
            min="0"
            step="0.01"
            prefix={currency}
            value={form.dailySpendCap}
            onChange={handleChange('dailySpendCap')}
            optionalLabel="optional"
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving || !form.name}>Add flight</Button>
          </div>
        </form>

        <div className="space-y-3">
          {flights.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No flights logged yet. Add the first flight to begin pacing.
            </p>
          ) : (
            flights.map((flight) => (
              <div key={flight.id ?? flight.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{flight.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{formatStatus(flight.status)}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {formatDate(flight.startAt)} – {formatDate(flight.endAt)}
                  </div>
                </div>
                <dl className="mt-3 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-slate-500">Budget</dt>
                    <dd>{formatCurrency(flight.budget, currency)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Daily cap</dt>
                    <dd>{flight.dailySpendCap ? formatCurrency(flight.dailySpendCap, currency) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">ID</dt>
                    <dd>{flight.id ?? 'Pending sync'}</dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

FlightsPanel.propTypes = {
  flights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      startAt: PropTypes.string,
      endAt: PropTypes.string,
      budget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      dailySpendCap: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      status: PropTypes.string
    })
  ),
  currency: PropTypes.string,
  onAddFlight: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

FlightsPanel.defaultProps = {
  flights: [],
  currency: 'GBP',
  saving: false
};

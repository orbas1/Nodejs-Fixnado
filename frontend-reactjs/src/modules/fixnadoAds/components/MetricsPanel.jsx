import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Select, TextInput } from '../../../components/ui/index.js';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../utils/formatters.js';

export default function MetricsPanel({ metrics, flights, currency, onRecordMetric, saving }) {
  const [form, setForm] = useState({
    metricDate: '',
    flightId: '',
    impressions: '',
    clicks: '',
    conversions: '',
    spend: '',
    revenue: ''
  });

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.metricDate) {
      return;
    }
    const payload = {
      metricDate: form.metricDate,
      flightId: form.flightId || undefined,
      impressions: form.impressions ? Number.parseInt(form.impressions, 10) : 0,
      clicks: form.clicks ? Number.parseInt(form.clicks, 10) : 0,
      conversions: form.conversions ? Number.parseInt(form.conversions, 10) : 0,
      spend: form.spend ? Number.parseFloat(form.spend) : 0,
      revenue: form.revenue ? Number.parseFloat(form.revenue) : 0
    };
    await onRecordMetric(payload);
    setForm({ metricDate: '', flightId: '', impressions: '', clicks: '', conversions: '', spend: '', revenue: '' });
  };

  return (
    <Card padding="lg" className="border border-slate-200 bg-white/70 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Metrics</p>
          <h3 className="text-xl font-semibold text-primary">Daily performance</h3>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-dashed border-slate-200 p-4 md:grid-cols-3">
        <TextInput label="Metric date" type="date" value={form.metricDate} onChange={handleChange('metricDate')} required />
        <Select
          label="Flight"
          value={form.flightId}
          onChange={handleChange('flightId')}
          options={[{ value: '', label: 'Entire campaign' }, ...flights.map((flight) => ({ value: flight.id, label: flight.name }))]}
        />
        <TextInput
          label="Impressions"
          type="number"
          min="0"
          value={form.impressions}
          onChange={handleChange('impressions')}
          placeholder="1500"
        />
        <TextInput
          label="Clicks"
          type="number"
          min="0"
          value={form.clicks}
          onChange={handleChange('clicks')}
          placeholder="210"
        />
        <TextInput
          label="Conversions"
          type="number"
          min="0"
          value={form.conversions}
          onChange={handleChange('conversions')}
          placeholder="15"
        />
        <TextInput
          label="Spend"
          type="number"
          min="0"
          step="0.01"
          prefix={currency}
          value={form.spend}
          onChange={handleChange('spend')}
          placeholder="320"
        />
        <TextInput
          label="Revenue"
          type="number"
          min="0"
          step="0.01"
          prefix={currency}
          value={form.revenue}
          onChange={handleChange('revenue')}
          placeholder="680"
        />
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={saving || !form.metricDate}>Record metric</Button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {metrics.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No metrics logged for this campaign. Post the first metric to begin anomaly detection.
          </p>
        ) : (
          metrics.map((metric) => (
            <div key={`${metric.metricDate}-${metric.flightId ?? 'campaign'}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">{formatDate(metric.metricDate)}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {metric.flightId ? flights.find((flight) => flight.id === metric.flightId)?.name ?? 'Flight' : 'Campaign total'}
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  CTR {formatPercent(metric.ctr)} · CVR {formatPercent(metric.cvr)}
                </div>
              </div>
              <dl className="mt-3 grid gap-4 text-sm text-slate-600 md:grid-cols-5">
                <div>
                  <dt className="font-semibold text-slate-500">Impressions</dt>
                  <dd>{formatNumber(metric.impressions)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Clicks</dt>
                  <dd>{formatNumber(metric.clicks)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Conversions</dt>
                  <dd>{formatNumber(metric.conversions)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Spend</dt>
                  <dd>{formatCurrency(metric.spend, currency)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Revenue</dt>
                  <dd>{formatCurrency(metric.revenue, currency)}</dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

MetricsPanel.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      metricDate: PropTypes.string.isRequired,
      flightId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      impressions: PropTypes.number,
      clicks: PropTypes.number,
      conversions: PropTypes.number,
      spend: PropTypes.number,
      revenue: PropTypes.number,
      ctr: PropTypes.number,
      cvr: PropTypes.number
    })
  ),
  flights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string
    })
  ),
  currency: PropTypes.string,
  onRecordMetric: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

MetricsPanel.defaultProps = {
  metrics: [],
  flights: [],
  currency: 'GBP',
  saving: false
};

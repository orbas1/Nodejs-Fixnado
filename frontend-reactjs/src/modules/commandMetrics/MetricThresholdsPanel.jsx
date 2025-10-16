import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '../../components/ui/index.js';

const MetricThresholdsPanel = forwardRef(function MetricThresholdsPanel({ metrics, onChange, isFocused }, ref) {
  return (
    <section
      ref={ref}
      className={`rounded-2xl border ${isFocused ? 'border-primary' : 'border-slate-200'} bg-slate-50/50 p-5 transition-colors`}
    >
      <h3 className="text-lg font-semibold text-primary">Metric thresholds</h3>
      <p className="mt-1 text-sm text-slate-600">
        Fine-tune the thresholds that drive traffic light statuses on the command centre dashboard.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
          <h4 className="text-base font-semibold text-primary">Escrow under management</h4>
          <p className="text-xs text-slate-500">Control the bands that determine stability vs watchlist states.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Target high (£)"
              type="number"
              value={metrics.escrow.targetHigh}
              onChange={(event) => onChange('escrow', 'targetHigh', event.target.value)}
              placeholder="18500000"
            />
            <TextInput
              label="Target medium (£)"
              type="number"
              value={metrics.escrow.targetMedium}
              onChange={(event) => onChange('escrow', 'targetMedium', event.target.value)}
              placeholder="15000000"
            />
          </div>
          <label className="fx-field__label mt-3">Extra context</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={2}
            value={metrics.escrow.captionNote}
            onChange={(event) => onChange('escrow', 'captionNote', event.target.value)}
            placeholder="Include settlement backlog or reconciliation notes"
          />
        </div>

        <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
          <h4 className="text-base font-semibold text-primary">Disputes requiring action</h4>
          <p className="text-xs text-slate-500">Set the thresholds that trigger warning vs alert states for dispute counts.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Managed threshold"
              type="number"
              value={metrics.disputes.thresholdLow}
              onChange={(event) => onChange('disputes', 'thresholdLow', event.target.value)}
              placeholder="10"
            />
            <TextInput
              label="Monitor threshold"
              type="number"
              value={metrics.disputes.thresholdMedium}
              onChange={(event) => onChange('disputes', 'thresholdMedium', event.target.value)}
              placeholder="18"
            />
            <TextInput
              label="Target median response (mins)"
              type="number"
              value={metrics.disputes.targetMedianMinutes}
              onChange={(event) => onChange('disputes', 'targetMedianMinutes', event.target.value)}
              placeholder="45"
            />
          </div>
          <label className="fx-field__label mt-3">Extra context</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={2}
            value={metrics.disputes.captionNote}
            onChange={(event) => onChange('disputes', 'captionNote', event.target.value)}
            placeholder="E.g. legal escalation cadence"
          />
        </div>

        <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
          <h4 className="text-base font-semibold text-primary">Live jobs</h4>
          <p className="text-xs text-slate-500">Define peaks vs on-track states for concurrent live jobs.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Peak threshold"
              type="number"
              value={metrics.jobs.targetHigh}
              onChange={(event) => onChange('jobs', 'targetHigh', event.target.value)}
              placeholder="60"
            />
            <TextInput
              label="On-track threshold"
              type="number"
              value={metrics.jobs.targetMedium}
              onChange={(event) => onChange('jobs', 'targetMedium', event.target.value)}
              placeholder="40"
            />
          </div>
          <label className="fx-field__label mt-3">Extra context</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={2}
            value={metrics.jobs.captionNote}
            onChange={(event) => onChange('jobs', 'captionNote', event.target.value)}
            placeholder="Include staffing or coverage notes"
          />
        </div>

        <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
          <h4 className="text-base font-semibold text-primary">SLA compliance</h4>
          <p className="text-xs text-slate-500">Configure success vs warning ranges for SLA performance.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Target (%)"
              type="number"
              value={metrics.sla.target}
              onChange={(event) => onChange('sla', 'target', event.target.value)}
              placeholder="97"
            />
            <TextInput
              label="Warning (%)"
              type="number"
              value={metrics.sla.warning}
              onChange={(event) => onChange('sla', 'warning', event.target.value)}
              placeholder="94"
            />
          </div>
          <label className="fx-field__label mt-3">Extra context</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={2}
            value={metrics.sla.captionNote}
            onChange={(event) => onChange('sla', 'captionNote', event.target.value)}
            placeholder="Highlight key customer promises or tolerances"
          />
        </div>
      </div>
    </section>
  );
});

MetricThresholdsPanel.propTypes = {
  metrics: PropTypes.shape({
    escrow: PropTypes.shape({
      targetHigh: PropTypes.string,
      targetMedium: PropTypes.string,
      captionNote: PropTypes.string
    }).isRequired,
    disputes: PropTypes.shape({
      thresholdLow: PropTypes.string,
      thresholdMedium: PropTypes.string,
      targetMedianMinutes: PropTypes.string,
      captionNote: PropTypes.string
    }).isRequired,
    jobs: PropTypes.shape({
      targetHigh: PropTypes.string,
      targetMedium: PropTypes.string,
      captionNote: PropTypes.string
    }).isRequired,
    sla: PropTypes.shape({
      target: PropTypes.string,
      warning: PropTypes.string,
      captionNote: PropTypes.string
    }).isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  isFocused: PropTypes.bool
};

MetricThresholdsPanel.defaultProps = {
  isFocused: false
};

export default MetricThresholdsPanel;

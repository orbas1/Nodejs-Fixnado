import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Textarea } from '../../../components/ui/index.js';
import { formatDate, formatNumber, formatStatus } from '../utils/formatters.js';

const SEVERITY_COLOURS = {
  critical: 'border-rose-300 bg-rose-50 text-rose-700',
  warning: 'border-amber-300 bg-amber-50 text-amber-700',
  info: 'border-sky-300 bg-sky-50 text-sky-700'
};

export default function FraudSignalsPanel({ signals, onResolveSignal, saving }) {
  const [notes, setNotes] = useState({});

  const groupedSignals = useMemo(() => {
    return signals.reduce((acc, signal) => {
      const key = signal.signalType;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(signal);
      return acc;
    }, {});
  }, [signals]);

  const handleResolve = async (signalId) => {
    const note = notes[signalId];
    await onResolveSignal(signalId, note || undefined);
    setNotes((current) => ({ ...current, [signalId]: '' }));
  };

  return (
    <Card padding="lg" className="border border-slate-200 bg-white/70 shadow-sm">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Risk monitoring</p>
        <h3 className="text-xl font-semibold text-primary">Fraud & anomaly signals</h3>
      </header>
      <div className="space-y-6">
        {signals.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No active fraud signals. Metrics recorded will continue to evaluate delivery health automatically.
          </p>
        ) : (
          Object.entries(groupedSignals).map(([type, entries]) => (
            <section key={type} className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{formatStatus(type)}</h4>
              {entries.map((signal) => {
                const severityTone = SEVERITY_COLOURS[signal.severity] || SEVERITY_COLOURS.warning;
                const signalNote = notes[signal.id] ?? '';
                return (
                  <article
                    key={signal.id}
                    className={`space-y-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${severityTone}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Detected {formatDate(signal.detectedAt)}</p>
                        <p className="text-xs uppercase tracking-[0.3em]">Severity · {formatStatus(signal.severity)}</p>
                      </div>
                      <div className="text-xs uppercase tracking-[0.3em]">
                        {signal.flightId ? `Flight ${signal.flightId}` : 'Campaign wide'}
                      </div>
                    </div>
                    <div className="grid gap-4 text-xs md:grid-cols-2">
                      <div>
                        <p className="font-semibold uppercase tracking-[0.3em]">Metric snapshot</p>
                        <p>
                          Impressions {formatNumber(signal.metadata?.impressions)} · Clicks {formatNumber(signal.metadata?.clicks)} ·
                          Spend {formatNumber(signal.metadata?.spend)}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-[0.3em]">Recommended action</p>
                        <p>{signal.metadata?.recommendedAction ?? 'Review pacing and confirm traffic quality.'}</p>
                      </div>
                    </div>
                    <Textarea
                      label="Resolution note"
                      value={signalNote}
                      onChange={(event) => setNotes((current) => ({ ...current, [signal.id]: event.target.value }))}
                      rows={2}
                      optionalLabel="optional"
                    />
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" onClick={() => handleResolve(signal.id)} disabled={saving}>
                        Mark resolved
                      </Button>
                    </div>
                  </article>
                );
              })}
            </section>
          ))
        )}
      </div>
    </Card>
  );
}

FraudSignalsPanel.propTypes = {
  signals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      signalType: PropTypes.string.isRequired,
      severity: PropTypes.string,
      detectedAt: PropTypes.string,
      flightId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      metadata: PropTypes.object
    })
  ),
  onResolveSignal: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

FraudSignalsPanel.defaultProps = {
  signals: [],
  saving: false
};

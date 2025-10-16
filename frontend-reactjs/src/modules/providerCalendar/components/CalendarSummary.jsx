import { useProviderCalendar } from '../ProviderCalendarProvider.jsx';

const CalendarSummary = () => {
  const { metrics, feedback, error } = useProviderCalendar();

  return (
    <div className="space-y-4">
      {(feedback || error) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || feedback}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="rounded-3xl border border-accent/20 bg-white/80 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{metric.value}</p>
            {metric.helper ? <p className="mt-2 text-xs text-slate-500">{metric.helper}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarSummary;

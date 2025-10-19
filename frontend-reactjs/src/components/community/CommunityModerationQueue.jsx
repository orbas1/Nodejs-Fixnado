import PropTypes from 'prop-types';
import { FlagIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function CaseRow({ item, onResolve, resolving }) {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{item.category}</p>
          <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-semibold uppercase tracking-[0.25em] text-amber-700">
            <FlagIcon className="h-4 w-4" aria-hidden="true" />
            {item.flags} flags
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-[0.25em] text-slate-500">
            {item.ageLabel}
          </span>
        </div>
      </header>
      {item.evidence?.length ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
          {item.evidence.map((entry) => (
            <p key={entry.id ?? entry.text} className="leading-relaxed">
              <strong className="font-semibold text-primary">{entry.type}:</strong> {entry.text}
            </p>
          ))}
        </div>
      ) : null}
      <footer className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Reporter: {item.reporter}</span>
        <span>Status: {item.statusLabel}</span>
        <div className="ml-auto flex gap-2">
          {item.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={resolving}
              onClick={() => onResolve(item, action)}
              className={clsx(
                'inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition disabled:cursor-not-allowed disabled:opacity-50',
                action.intent === 'approve'
                  ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
                  : action.intent === 'reject'
                  ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

CaseRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string,
    flags: PropTypes.number,
    ageLabel: PropTypes.string,
    statusLabel: PropTypes.string,
    reporter: PropTypes.string,
    evidence: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
        text: PropTypes.string
      })
    ),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        intent: PropTypes.oneOf(['approve', 'reject', 'snooze'])
      })
    )
  }).isRequired,
  onResolve: PropTypes.func.isRequired,
  resolving: PropTypes.bool
};

CaseRow.defaultProps = {
  resolving: false
};

export default function CommunityModerationQueue({ cases, onResolve, resolvingId }) {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Moderation queue</h2>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
          <ShieldExclamationIcon className="h-4 w-4" aria-hidden="true" />
          {cases.length} open
        </span>
      </header>
      {cases.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
          All caught up — no outstanding reports.
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((item) => (
            <CaseRow
              key={item.id}
              item={item}
              onResolve={onResolve}
              resolving={resolvingId === item.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

CommunityModerationQueue.propTypes = {
  cases: PropTypes.arrayOf(PropTypes.object),
  onResolve: PropTypes.func,
  resolvingId: PropTypes.string
};

CommunityModerationQueue.defaultProps = {
  cases: [],
  onResolve: () => {},
  resolvingId: null
};

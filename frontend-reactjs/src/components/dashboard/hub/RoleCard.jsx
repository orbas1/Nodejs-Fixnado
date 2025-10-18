import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const statusStyles = {
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  locked: 'bg-slate-200 text-slate-700 border-slate-300'
};

const RoleCard = ({ role, isAllowed, onPreview, onUnlock }) => {
  const chips = (role.navigation ?? []).slice(0, 4);
  const statusTone = isAllowed ? statusStyles.ready : statusStyles.locked;

  return (
    <article className="group flex h-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{role.persona}</p>
          <h2 className="text-2xl font-semibold text-slate-900">{role.name}</h2>
          <p className="text-sm font-medium text-slate-500">{role.headline}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusTone}`}>
          {isAllowed ? 'Live' : 'Locked'}
        </span>
      </header>

      <div className="grid w-full gap-3 sm:grid-cols-2">
        {chips.map((item) => (
          <span
            key={item.id}
            className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700"
          >
            {item.menuLabel ?? item.label}
          </span>
        ))}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        {isAllowed ? (
          <Link
            to={`/dashboards/${role.id}`}
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
          >
            Open
          </Link>
        ) : onUnlock ? (
          <button
            type="button"
            onClick={() => onUnlock(role)}
            className="inline-flex items-center justify-center rounded-full border border-accent/40 bg-white px-6 py-2 text-sm font-semibold text-accent transition hover:border-accent/60"
          >
            Unlock
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onPreview(role)}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
        >
          Preview
        </button>
      </footer>
    </article>
  );
};

RoleCard.propTypes = {
  role: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    persona: PropTypes.string.isRequired,
    headline: PropTypes.string.isRequired,
    navigation: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        menuLabel: PropTypes.string
      })
    )
  }).isRequired,
  isAllowed: PropTypes.bool,
  onPreview: PropTypes.func.isRequired,
  onUnlock: PropTypes.func
};

RoleCard.defaultProps = {
  isAllowed: false,
  onUnlock: null
};

export default RoleCard;

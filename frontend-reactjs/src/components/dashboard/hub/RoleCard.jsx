import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  ArrowsPointingOutIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

const statusStyles = {
  ready: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  locked: 'border-rose-300 bg-rose-50 text-rose-700',
  planned: 'border-amber-300 bg-amber-50 text-amber-700'
};

const determineStatus = ({ isAllowed, isPending }) => {
  if (isPending) {
    return { label: 'Planned', tone: statusStyles.planned };
  }
  if (isAllowed) {
    return { label: 'Ready', tone: statusStyles.ready };
  }
  return { label: 'Locked', tone: statusStyles.locked };
};

const RoleCard = ({ role, isAllowed, isPending, onPreview, onUnlock }) => {
  const status = determineStatus({ isAllowed, isPending });
  const navigationPreview = (role.navigation ?? []).slice(0, 4);
  const canUnlock = !isAllowed && !isPending && typeof onUnlock === 'function';

  return (
    <article className="group relative flex h-full flex-col justify-between gap-6 rounded-3xl border border-accent/15 bg-white/95 p-8 shadow-glow transition hover:border-accent/40">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-primary/60">{role.persona}</p>
          <h2 className="text-xl font-semibold text-primary">{role.name}</h2>
          <p className="text-sm text-primary/70 line-clamp-2">{role.headline}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.tone}`}>
          {status.label}
        </span>
      </header>

      <div className="flex flex-wrap gap-2">
        {navigationPreview.map((item) => (
          <span
            key={item.id}
            className="rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary/70"
          >
            {item.menuLabel ?? item.label}
          </span>
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-3 pt-2">
        {isAllowed ? (
          <Link
            to={`/dashboards/${role.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Open
          </Link>
        ) : null}
        {canUnlock ? (
          <button
            type="button"
            onClick={() => onUnlock(role)}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/80 px-5 py-2 text-sm font-semibold text-accent transition hover:border-accent/60"
          >
            <LockOpenIcon className="h-4 w-4" /> Unlock
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onPreview(role)}
          className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/90 px-5 py-2 text-sm font-semibold text-primary/80 transition hover:border-accent/40 hover:text-primary"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" /> Preview
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
        menuLabel: PropTypes.string,
        href: PropTypes.string
      })
    )
  }).isRequired,
  isAllowed: PropTypes.bool,
  isPending: PropTypes.bool,
  onPreview: PropTypes.func.isRequired,
  onUnlock: PropTypes.func
};

RoleCard.defaultProps = {
  isAllowed: false,
  isPending: false,
  onUnlock: null
};

export default RoleCard;

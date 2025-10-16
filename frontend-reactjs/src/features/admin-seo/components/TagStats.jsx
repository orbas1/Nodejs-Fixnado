import PropTypes from 'prop-types';
import { Card, Skeleton } from '../../../components/ui/index.js';
import { ROLE_LABELS } from '../constants.js';

function TagStats({ stats, loading }) {
  const roleSummary = (() => {
    if (!stats?.roleDistribution) {
      return null;
    }
    const entries = Object.entries(stats.roleDistribution)
      .filter(([role]) => role !== 'admin')
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (!entries.length) {
      return 'All tags available to Admins';
    }

    return entries
      .map(([role, count]) => `${ROLE_LABELS[role] ?? role}: ${count}`)
      .join(' • ');
  })();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="rounded-2xl border border-slate-200 bg-white/90" padding="lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Total tags</p>
        <div className="mt-3 text-2xl font-semibold text-primary">
          {loading ? <Skeleton className="h-7 w-24" /> : stats?.total ?? 0}
        </div>
        <p className="mt-1 text-xs text-slate-500">Records in the current view.</p>
      </Card>
      <Card className="rounded-2xl border border-slate-200 bg-white/90" padding="lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Indexable</p>
        <div className="mt-3 text-2xl font-semibold text-emerald-600">
          {loading ? <Skeleton className="h-7 w-24" /> : stats?.indexable ?? 0}
        </div>
        <p className="mt-1 text-xs text-slate-500">Eligible for sitemap inclusion.</p>
      </Card>
      <Card className="rounded-2xl border border-slate-200 bg-white/90" padding="lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Noindex</p>
        <div className="mt-3 text-2xl font-semibold text-amber-600">
          {loading ? <Skeleton className="h-7 w-24" /> : stats?.noindex ?? 0}
        </div>
        <p className="mt-1 text-xs text-slate-500">Hidden from public search engines.</p>
      </Card>
      <Card className="rounded-2xl border border-slate-200 bg-white/90" padding="lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Role restricted</p>
        <div className="mt-3 text-2xl font-semibold text-indigo-600">
          {loading ? <Skeleton className="h-7 w-24" /> : stats?.restricted ?? 0}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {loading ? <Skeleton className="h-3 w-40" /> : roleSummary ?? 'Role distribution unavailable.'}
        </p>
      </Card>
    </div>
  );
}

TagStats.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number,
    indexable: PropTypes.number,
    noindex: PropTypes.number,
    restricted: PropTypes.number,
    roleDistribution: PropTypes.object
  }),
  loading: PropTypes.bool
};

TagStats.defaultProps = {
  stats: null,
  loading: false
};

export default TagStats;

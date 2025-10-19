import PropTypes from 'prop-types';
import { ArrowTrendingUpIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const METRIC_ICON = {
  engagement: ArrowTrendingUpIcon,
  responsiveness: ChatBubbleLeftRightIcon,
  safety: ShieldCheckIcon
};

function MetricCard({ title, value, changeLabel, variant }) {
  const Icon = METRIC_ICON[variant] ?? ArrowTrendingUpIcon;
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {changeLabel ? <p className="mt-4 text-xs text-slate-500">{changeLabel}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  changeLabel: PropTypes.string,
  variant: PropTypes.oneOf(['engagement', 'responsiveness', 'safety'])
};

MetricCard.defaultProps = {
  changeLabel: null,
  variant: 'engagement'
};

function HighlightCard({ highlight }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-inner">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{highlight.category}</p>
          <h3 className="mt-2 text-lg font-semibold text-primary">{highlight.title}</h3>
        </div>
        {highlight.impact ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
            {highlight.impact}
          </span>
        ) : null}
      </header>
      {highlight.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{highlight.summary}</p>
      ) : null}
      {highlight.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {highlight.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

HighlightCard.propTypes = {
  highlight: PropTypes.shape({
    id: PropTypes.string,
    category: PropTypes.string,
    title: PropTypes.string,
    summary: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    impact: PropTypes.string
  }).isRequired
};

function RecommendationCard({ item, onFollow }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-primary">{item.title}</p>
        {item.description ? (
          <p className="text-xs text-slate-500">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className={clsx(
          'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition',
          item.following
            ? 'border-slate-200 bg-slate-50 text-slate-500'
            : 'border-primary bg-primary text-white hover:bg-primary/90'
        )}
        onClick={() => onFollow(item)}
      >
        {item.following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

RecommendationCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    following: PropTypes.bool
  }).isRequired,
  onFollow: PropTypes.func.isRequired
};

export default function CommunityInsights({ metrics, highlights, recommendations, onFollow }) {
  const metricList = [
    {
      title: 'Daily active members',
      value: metrics.dailyActiveMembers ?? '—',
      changeLabel: metrics.dailyActiveChange ?? 'Stable vs yesterday',
      variant: 'engagement'
    },
    {
      title: 'Median response time',
      value: metrics.medianResponseTime ?? '—',
      changeLabel: metrics.responseChange ?? 'SLA aligned',
      variant: 'responsiveness'
    },
    {
      title: 'Safety score',
      value: metrics.safetyScore ?? '—',
      changeLabel: metrics.safetyChange ?? 'All incidents resolved',
      variant: 'safety'
    }
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {metricList.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
      {highlights.length ? (
        <div className="space-y-4">
          {highlights.map((highlight) => (
            <HighlightCard key={highlight.id ?? highlight.title} highlight={highlight} />
          ))}
        </div>
      ) : null}
      {recommendations.length ? (
        <div className="space-y-3">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Recommended channels</h3>
            <span className="text-xs text-slate-500">Curated daily based on persona activity</span>
          </header>
          <div className="space-y-3">
            {recommendations.map((item) => (
              <RecommendationCard key={item.id} item={item} onFollow={onFollow} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

CommunityInsights.propTypes = {
  metrics: PropTypes.object,
  highlights: PropTypes.arrayOf(PropTypes.object),
  recommendations: PropTypes.arrayOf(PropTypes.object),
  onFollow: PropTypes.func
};

CommunityInsights.defaultProps = {
  metrics: {},
  highlights: [],
  recommendations: [],
  onFollow: () => {}
};

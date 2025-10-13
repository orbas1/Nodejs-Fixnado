import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusSmallIcon } from '@heroicons/react/24/outline';

const trendIcon = {
  up: ArrowTrendingUpIcon,
  down: ArrowTrendingDownIcon,
  flat: MinusSmallIcon
};

const ChartRenderer = ({ chart }) => {
  const data = chart.data ?? [];
  const commonProps = {
    data,
    margin: { top: 16, right: 16, bottom: 0, left: 0 }
  };

  if (chart.type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id={`${chart.id}-primary`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #cbd5f5' }} />
          <Area type="monotone" dataKey={chart.dataKey} stroke="#22d3ee" fill={`url(#${chart.id}-primary)`} strokeWidth={2} />
          {chart.secondaryKey && (
            <Area type="monotone" dataKey={chart.secondaryKey} stroke="#a855f7" fillOpacity={0.15} strokeWidth={2} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #cbd5f5' }} />
          <Line type="monotone" dataKey={chart.dataKey} stroke="#38bdf8" strokeWidth={3} dot={{ stroke: '#38bdf8', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #cbd5f5' }} />
          <Bar dataKey={chart.dataKey} fill="#6366f1" radius={[12, 12, 0, 0]} />
          {chart.secondaryKey && <Bar dataKey={chart.secondaryKey} fill="#22d3ee" radius={[12, 12, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
};

ChartRenderer.propTypes = {
  chart: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    dataKey: PropTypes.string,
    secondaryKey: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired
};

const MetricCard = ({ metric }) => {
  const Icon = trendIcon[metric.trend] ?? ArrowTrendingUpIcon;
  const trendColor =
    metric.trend === 'down' ? 'text-rose-500' : metric.trend === 'flat' ? 'text-primary/60' : 'text-emerald-500';

  return (
    <div className="bg-white/95 border border-accent/10 rounded-2xl p-6 shadow-glow">
      <p className="text-sm uppercase tracking-wide text-slate-500">{metric.label}</p>
      <p className="mt-3 text-3xl font-semibold text-primary">{metric.value}</p>
      <div className={`mt-4 flex items-center gap-2 text-xs font-medium ${trendColor}`}>
        <Icon className="h-4 w-4" />
        {metric.change}
      </div>
    </div>
  );
};

MetricCard.propTypes = {
  metric: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    change: PropTypes.string,
    trend: PropTypes.string
  }).isRequired
};

const Timeline = ({ upcoming }) => (
  <ol className="space-y-4">
    {upcoming.map((event) => (
      <li key={event.title} className="bg-white border border-accent/10 rounded-xl px-4 py-3 flex flex-col gap-1 shadow-sm">
        <p className="font-medium text-primary">{event.title}</p>
        <p className="text-sm text-slate-600">{event.when}</p>
        <span className="text-xs uppercase tracking-wide text-primary/60">{event.status}</span>
      </li>
    ))}
  </ol>
);

Timeline.propTypes = {
  upcoming: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      when: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired
    })
  ).isRequired
};

const InsightList = ({ insights }) => (
  <ul className="space-y-3 text-sm text-slate-600">
    {insights.map((item) => (
      <li key={item} className="flex gap-3">
        <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

InsightList.propTypes = {
  insights: PropTypes.arrayOf(PropTypes.string).isRequired
};

const DashboardOverview = ({ analytics }) => {
  const metrics = analytics?.metrics ?? [];
  const charts = analytics?.charts ?? [];
  const upcoming = analytics?.upcoming ?? [];
  const insights = analytics?.insights ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {charts.map((chart) => (
          <div key={chart.id} className="lg:col-span-1 bg-white border border-accent/10 rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-primary">{chart.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{chart.description}</p>
            <div className="mt-4 h-60">
              <ChartRenderer chart={chart} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-accent/10 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-primary">Upcoming & Commitments</h3>
          <p className="mt-2 text-sm text-slate-600">Stay ahead of scheduled workstreams and critical checkpoints.</p>
          <div className="mt-4">
            <Timeline upcoming={upcoming} />
          </div>
        </div>
        <div className="bg-white border border-accent/10 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-primary">Insights & Calls to Action</h3>
          <p className="mt-2 text-sm text-slate-600">AI-curated recommendations to improve velocity and outcomes.</p>
          <div className="mt-4">
            <InsightList insights={insights} />
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardOverview.propTypes = {
  analytics: PropTypes.shape({
    metrics: PropTypes.array.isRequired,
    charts: PropTypes.array.isRequired,
    upcoming: PropTypes.array.isRequired,
    insights: PropTypes.array.isRequired
  }).isRequired
};

export default DashboardOverview;

import PropTypes from 'prop-types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusSmallIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useLocale } from '../../hooks/useLocale.js';
import StatusPill from '../ui/StatusPill.jsx';

const trendIcon = {
  up: ArrowTrendingUpIcon,
  down: ArrowTrendingDownIcon,
  flat: MinusSmallIcon
};

function MetricTile({ metric }) {
  const Icon = trendIcon[metric.trend] ?? ArrowTrendingUpIcon;
  const tone = metric.trend === 'down' ? 'warning' : metric.trend === 'flat' ? 'neutral' : 'success';
  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary/60">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{metric.displayValue ?? metric.value}</p>
        </div>
        {metric.change ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-${
              tone === 'warning' ? 'amber-600' : tone === 'neutral' ? 'primary/60' : 'emerald-600'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {metric.change}
          </span>
        ) : null}
      </header>
      {metric.caption ? <p className="text-sm text-slate-600">{metric.caption}</p> : null}
    </article>
  );
}

MetricTile.propTypes = {
  metric: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    displayValue: PropTypes.string,
    change: PropTypes.string,
    trend: PropTypes.string,
    caption: PropTypes.string
  }).isRequired
};

function TaskList({ tasks }) {
  const { t, format } = useLocale();

  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
        {t('instructor.dashboard.noTasks')}
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm"
          data-qa={`instructor-task-${task.id}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">{task.label}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t(`instructor.dashboard.taskStatus.${task.status}`)}</p>
            </div>
            {task.dueAt ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                {format.dateTime(task.dueAt)}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      dueAt: PropTypes.string,
      status: PropTypes.string
    })
  ).isRequired
};

function AlertList({ alerts }) {
  const { t } = useLocale();
  if (alerts.length === 0) {
    return null;
  }
  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm"
          role="alert"
        >
          <div className="flex items-start gap-2 text-sm text-amber-700">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
            <span>{alert.message}</span>
          </div>
          {alert.actionHref ? (
            <a
              href={alert.actionHref}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-600 hover:border-amber-400"
            >
              {alert.actionLabel || t('instructor.dashboard.defaultAlertAction')}
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

AlertList.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      actionHref: PropTypes.string,
      actionLabel: PropTypes.string
    })
  ).isRequired
};

function ProductList({ products }) {
  const { t, format } = useLocale();
  if (products.length === 0) {
    return <p className="text-sm text-slate-500">{t('instructor.dashboard.topProductsEmpty')}</p>;
  }
  return (
    <ul className="space-y-3" data-qa="instructor-dashboard-top-products">
      {products.map((product) => (
        <li key={product.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4">
          <div>
            <p className="text-sm font-semibold text-primary">{product.name}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{product.category}</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-semibold text-primary">{format.currency(product.revenue)}</p>
            <p className="text-xs">{t('instructor.dashboard.productOrders', { count: product.orders })}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

ProductList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      revenue: PropTypes.number.isRequired,
      orders: PropTypes.number.isRequired
    })
  ).isRequired
};

function RevenueChart({ data }) {
  const { t } = useLocale();
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70">
        <p className="text-sm text-slate-500">{t('instructor.dashboard.revenueEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="instructorRevenuePrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.9} />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #cbd5f5' }} />
          <Area type="monotone" dataKey="gross" stroke="#0ea5e9" fill="url(#instructorRevenuePrimary)" strokeWidth={3} />
          <Area type="monotone" dataKey="net" stroke="#34d399" fillOpacity={0.15} strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

RevenueChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      gross: PropTypes.number,
      net: PropTypes.number
    })
  ).isRequired
};

function PayoutSummary({ payouts }) {
  const { t, format } = useLocale();
  return (
    <dl className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('instructor.dashboard.payoutPending')}</dt>
        <dd className="mt-2 text-2xl font-semibold text-primary">{format.currency(payouts.pendingAmount)}</dd>
        {payouts.nextPayoutAt ? (
          <p className="mt-2 text-xs text-slate-500">{t('instructor.dashboard.payoutNext', { value: format.date(payouts.nextPayoutAt) })}</p>
        ) : null}
      </div>
      <div>
        <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('instructor.dashboard.payoutReleased')}</dt>
        <dd className="mt-2 text-2xl font-semibold text-primary">{format.currency(payouts.releasedAmount)}</dd>
        {payouts.withheldAmount > 0 ? (
          <p className="mt-2 text-xs text-rose-500">{t('instructor.dashboard.payoutWithheld', { value: format.currency(payouts.withheldAmount) })}</p>
        ) : null}
      </div>
    </dl>
  );
}

PayoutSummary.propTypes = {
  payouts: PropTypes.shape({
    pendingAmount: PropTypes.number.isRequired,
    releasedAmount: PropTypes.number.isRequired,
    withheldAmount: PropTypes.number.isRequired,
    nextPayoutAt: PropTypes.string
  }).isRequired
};

export default function InstructorPerformanceSummary({ metrics, revenueTrend, products, alerts, tasks, payouts }) {
  const { t } = useLocale();
  return (
    <section className="space-y-10" aria-labelledby="instructor-dashboard-performance">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          {t('instructor.dashboard.eyebrow')}
        </p>
        <h2 id="instructor-dashboard-performance" className="text-2xl font-semibold text-primary">
          {t('instructor.dashboard.title')}
        </h2>
        <p className="text-sm text-slate-600">{t('instructor.dashboard.description')}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricTile key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary">{t('instructor.dashboard.revenueTitle')}</h3>
              <p className="text-sm text-slate-600">{t('instructor.dashboard.revenueDescription')}</p>
            </div>
            <StatusPill tone="info">{t('instructor.dashboard.revenueInfo')}</StatusPill>
          </div>
          <div className="mt-4">
            <RevenueChart data={revenueTrend} />
          </div>
        </div>
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-primary">{t('instructor.dashboard.topProductsTitle')}</h3>
            <p className="text-sm text-slate-600">{t('instructor.dashboard.topProductsDescription')}</p>
          </div>
          <ProductList products={products} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-primary">{t('instructor.dashboard.tasksTitle')}</h3>
            <p className="text-sm text-slate-600">{t('instructor.dashboard.tasksDescription')}</p>
          </div>
          <TaskList tasks={tasks} />
        </div>
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-primary">{t('instructor.dashboard.alertsTitle')}</h3>
            <p className="text-sm text-slate-600">{t('instructor.dashboard.alertsDescription')}</p>
          </div>
          <AlertList alerts={alerts} />
          <PayoutSummary payouts={payouts} />
        </div>
      </div>
    </section>
  );
}

InstructorPerformanceSummary.propTypes = {
  metrics: PropTypes.arrayOf(PropTypes.object).isRequired,
  revenueTrend: PropTypes.arrayOf(PropTypes.object).isRequired,
  products: PropTypes.arrayOf(PropTypes.object).isRequired,
  alerts: PropTypes.arrayOf(PropTypes.object).isRequired,
  tasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  payouts: PropTypes.shape({
    pendingAmount: PropTypes.number,
    releasedAmount: PropTypes.number,
    withheldAmount: PropTypes.number,
    nextPayoutAt: PropTypes.string
  }).isRequired
};

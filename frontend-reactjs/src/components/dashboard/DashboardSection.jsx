import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusSmallIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const softenGradient = (accent) => {
  if (!accent) {
    return 'from-white via-secondary to-sky-50';
  }

  const tokens = accent.split(' ');
  const softened = tokens.map((token) => {
    if (!/^(from|via|to)-/.test(token)) {
      return token;
    }

    return token.replace(/-(\d{3})$/, (_, value) => {
      const numeric = Number(value);
      const target = Math.max(100, numeric - 300);
      return `-${target}`;
    });
  });

  if (!softened.some((token) => token.startsWith('via-'))) {
    softened.splice(1, 0, 'via-white');
  }

  return softened.join(' ');
};

const SectionHeader = ({ section }) => (
  <div className="mb-6 space-y-2">
    <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
    <p className="text-sm text-slate-600 max-w-2xl">{section.description}</p>
  </div>
);

SectionHeader.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired
};

const GridSection = ({ section }) => {
  const cards = section.data?.cards ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border border-accent/10 bg-gradient-to-br ${softenGradient(card.accent)} p-6 shadow-md`}
          >
            <h3 className="text-lg font-semibold text-primary">{card.title}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {(card.details ?? []).map((detail) => (
                <li key={detail} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-accent/70" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

GridSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      cards: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          details: PropTypes.arrayOf(PropTypes.string).isRequired,
          accent: PropTypes.string
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const statusBadgeClasses = {
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-rose-200 bg-rose-50 text-rose-700',
  travel: 'border-sky-200 bg-sky-50 text-sky-700',
  standby: 'border-primary/20 bg-secondary text-primary/80'
};

const getStatusBadgeClass = (status) => {
  if (!status) return statusBadgeClasses.standby;
  const key = status.toLowerCase().replace(/\s+/g, '-');
  return statusBadgeClasses[key] ?? statusBadgeClasses.standby;
};

const CalendarSection = ({ section }) => {
  const { month, legend = [], weeks = [] } = section.data ?? {};
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <SectionHeader section={section} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">{month}</h3>
          <p className="text-xs text-slate-500">Tap any booking to open the full work order.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {legend.map((item) => (
            <span
              key={item.label}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${getStatusBadgeClass(item.status)}`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-accent/10 bg-white p-4 shadow-md">
        <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-primary/60">
          {daysOfWeek.map((day) => (
            <div key={day} className="px-2">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2 text-sm">
          {weeks.flatMap((week, weekIndex) =>
            week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${day.date}-${dayIndex}`}
                className={`min-h-[120px] rounded-2xl border border-dashed px-3 py-2 ${
                  day.isCurrentMonth ? 'border-accent/20 bg-secondary/60' : 'border-transparent bg-secondary/30 text-slate-400'
                } ${day.isToday ? 'border-accent bg-accent/10' : ''}`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{day.date}</span>
                  {day.capacity && (
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.65rem] font-semibold text-primary/60">
                      {day.capacity}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {(day.events ?? []).map((event) => (
                    <div
                      key={event.title}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium ${getStatusBadgeClass(event.status)}`}
                    >
                      <p className="text-primary">{event.title}</p>
                      {event.time && <p className="mt-1 text-[0.65rem] uppercase tracking-wide">{event.time}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

CalendarSection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      month: PropTypes.string,
      legend: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          status: PropTypes.string
        })
      ),
      weeks: PropTypes.arrayOf(
        PropTypes.arrayOf(
          PropTypes.shape({
            date: PropTypes.string.isRequired,
            isCurrentMonth: PropTypes.bool,
            isToday: PropTypes.bool,
            capacity: PropTypes.string,
            events: PropTypes.arrayOf(
              PropTypes.shape({
                title: PropTypes.string.isRequired,
                status: PropTypes.string,
                time: PropTypes.string
              })
            )
          })
        )
      )
    })
  }).isRequired
};

const BoardSection = ({ section }) => {
  const columns = section.data?.columns ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title} className="bg-white border border-accent/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{column.title}</h3>
              <span className="text-xs text-slate-500">{column.items?.length ?? 0} items</span>
            </div>
            <div className="space-y-4">
              {(column.items ?? []).map((item) => (
                <div key={item.title} className="rounded-xl border border-accent/10 bg-secondary p-4 space-y-2">
                  <p className="font-medium text-primary">{item.title}</p>
                  {item.owner && <p className="text-sm text-slate-600">{item.owner}</p>}
                  {item.value && <p className="text-sm text-accent font-semibold">{item.value}</p>}
                  {item.eta && <p className="text-xs text-slate-500">{item.eta}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

BoardSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      columns: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              title: PropTypes.string.isRequired,
              owner: PropTypes.string,
              value: PropTypes.string,
              eta: PropTypes.string
            })
          ).isRequired
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const AvailabilitySection = ({ section }) => {
  const { summary = {}, days = [], resources = [] } = section.data ?? {};
  return (
    <div>
      <SectionHeader section={section} />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {Object.entries(summary).map(([label, value]) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 font-semibold text-primary/80"
          >
            <span className="h-2 w-2 rounded-full bg-accent" />
            {value} {label.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </span>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-accent/10 bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-secondary text-primary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Crew / Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Role</th>
              {days.map((day) => (
                <th key={day} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 text-slate-700">
            {resources.map((resource) => (
              <tr key={resource.name} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-semibold text-primary">{resource.name}</div>
                  {resource.status && <div className="text-xs text-slate-500">{resource.status}</div>}
                </td>
                <td className="px-4 py-4 text-sm text-slate-500">{resource.role}</td>
                {days.map((day) => {
                  const slot = resource.allocations?.find((entry) => entry.day === day) ?? {};
                  return (
                    <td key={`${resource.name}-${day}`} className="px-2 py-3">
                      {slot.status ? (
                        <div className={`rounded-xl border px-2 py-2 text-xs font-semibold ${getStatusBadgeClass(slot.status)}`}>
                          <p>{slot.status}</p>
                          {slot.window && <p className="mt-1 text-[0.6rem] uppercase tracking-wide">{slot.window}</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AvailabilitySection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      summary: PropTypes.object,
      days: PropTypes.arrayOf(PropTypes.string),
      resources: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          role: PropTypes.string,
          status: PropTypes.string,
          allocations: PropTypes.arrayOf(
            PropTypes.shape({
              day: PropTypes.string.isRequired,
              status: PropTypes.string,
              window: PropTypes.string
            })
          )
        })
      )
    })
  }).isRequired
};

const TableSection = ({ section }) => {
  const headers = section.data?.headers ?? [];
  const rows = section.data?.rows ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="overflow-hidden rounded-2xl border border-accent/10 bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-secondary text-primary">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 text-slate-700">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-secondary/70">
                {row.map((value, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

TableSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      headers: PropTypes.arrayOf(PropTypes.string).isRequired,
      rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired
    }).isRequired
  }).isRequired
};

const ListSection = ({ section }) => {
  const items = section.data?.items ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-accent/10 bg-white p-5 shadow-md">
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-primary">{item.title}</p>
              <p className="text-sm text-slate-600">{item.description}</p>
              <span className="text-xs uppercase tracking-wide text-primary/60">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ListSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      items: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired,
          status: PropTypes.string.isRequired
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const adsTrendIcon = {
  up: ArrowTrendingUpIcon,
  down: ArrowTrendingDownIcon,
  flat: MinusSmallIcon
};

const severityBadgeClasses = {
  Critical: 'border-rose-200 bg-rose-50 text-rose-700',
  Warning: 'border-amber-200 bg-amber-50 text-amber-700',
  Info: 'border-sky-200 bg-sky-50 text-sky-700',
  default: 'border-slate-200 bg-slate-100 text-slate-600'
};

const FixnadoAdsSection = ({ section }) => {
  const summaryCards = section.data?.summaryCards ?? [];
  const funnel = section.data?.funnel ?? [];
  const campaigns = section.data?.campaigns ?? [];
  const invoices = section.data?.invoices ?? [];
  const alerts = section.data?.alerts ?? [];
  const recommendations = section.data?.recommendations ?? [];
  const timeline = section.data?.timeline ?? [];

  return (
    <div className="space-y-8">
      <SectionHeader section={section} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const TrendIcon = adsTrendIcon[card.trend] ?? MinusSmallIcon;
          const trendColor =
            card.trend === 'down' ? 'text-rose-500' : card.trend === 'up' ? 'text-emerald-500' : 'text-primary/60';
          return (
            <div key={card.title} className="rounded-2xl border border-accent/10 bg-white/95 p-6 shadow-md">
              <p className="text-xs uppercase tracking-wide text-primary/60">{card.title}</p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold text-primary">{card.value}</p>
                {card.change ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-semibold ${trendColor}`}
                  >
                    <TrendIcon className="h-4 w-4" />
                    {card.change}
                  </span>
                ) : null}
              </div>
              {card.helper ? <p className="mt-3 text-sm text-slate-600">{card.helper}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Active campaigns</h3>
            <span className="text-xs uppercase tracking-wide text-primary/60">{campaigns.length} in view</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] divide-y divide-slate-200 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-primary/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Spend</th>
                  <th className="px-4 py-3 font-semibold">Conversions</th>
                  <th className="px-4 py-3 font-semibold">ROAS</th>
                  <th className="px-4 py-3 font-semibold">Pacing</th>
                  <th className="px-4 py-3 font-semibold">Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id ?? campaign.name} className="hover:bg-secondary/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-primary">{campaign.name}</p>
                        <p className="text-xs text-primary/60">{campaign.objective}</p>
                        <p className="text-xs text-slate-500">Last metric {campaign.lastMetricDate ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary">{campaign.spend}</p>
                        <p className="text-xs text-primary/60">{campaign.spendChange}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary">{campaign.conversions}</p>
                        <p className="text-xs text-primary/60">{campaign.conversionsChange}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary">{campaign.roas}</p>
                        <p className="text-xs text-primary/60">{campaign.roasChange}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{campaign.pacing}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{campaign.window}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                      No Fixnado Ads campaigns in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-accent/10 bg-gradient-to-br from-secondary/50 via-white to-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Upcoming flights</h3>
            <span className="text-xs uppercase tracking-wide text-primary/60">{timeline.length} scheduled</span>
          </div>
          <ul className="mt-4 space-y-4">
            {timeline.length > 0 ? (
              timeline.map((entry) => (
                <li key={`${entry.title}-${entry.start}`} className="rounded-2xl border border-accent/10 bg-white/80 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-primary">{entry.title}</p>
                  <p className="text-xs text-primary/60">{entry.status}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.start} → {entry.end}</p>
                  <p className="mt-1 text-xs text-primary/70">Budget {entry.budget}</p>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-accent/40 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                No upcoming flights scheduled.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
          <h3 className="text-lg font-semibold text-primary">Acquisition funnel</h3>
          <ul className="mt-4 space-y-3">
            {funnel.map((stage) => (
              <li
                key={stage.title}
                className="flex items-center justify-between gap-3 rounded-2xl border border-accent/10 bg-secondary px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-primary">{stage.title}</p>
                  <p className="text-xs text-primary/60">{stage.helper}</p>
                </div>
                <span className="text-base font-semibold text-primary">{stage.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
          <h3 className="text-lg font-semibold text-primary">Recommendations</h3>
          <ul className="mt-4 space-y-4">
            {recommendations.map((item) => (
              <li key={item.title} className="flex items-start gap-3 rounded-2xl border border-accent/10 bg-secondary px-4 py-3">
                <CheckCircleIcon className="mt-1 h-5 w-5 text-emerald-500" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-primary">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.description}</p>
                  {item.action ? (
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                      {item.action}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Billing cadence</h3>
            <span className="text-xs uppercase tracking-wide text-primary/60">{invoices.length} invoices</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] divide-y divide-slate-200 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-primary/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.invoiceNumber ?? `${invoice.campaign}-${invoice.dueDate}`} className="hover:bg-secondary/60">
                      <td className="px-4 py-3 font-semibold text-primary">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3">{invoice.campaign}</td>
                      <td className="px-4 py-3">{invoice.amountDue}</td>
                      <td className="px-4 py-3">{invoice.status}</td>
                      <td className="px-4 py-3">{invoice.dueDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                      No invoices issued this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Guardrails &amp; alerts</h3>
            <span className="text-xs uppercase tracking-wide text-primary/60">{alerts.length} alerts</span>
          </div>
          <ul className="mt-4 space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const badgeClass = severityBadgeClasses[alert.severity] ?? severityBadgeClasses.default;
                return (
                  <li
                    key={`${alert.title}-${alert.detectedAt}`}
                    className="rounded-2xl border border-accent/10 bg-secondary px-4 py-3 text-sm text-slate-600"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-primary/60" />
                          <p className="text-sm font-semibold text-primary">{alert.title}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{alert.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[0.65rem] uppercase tracking-wide text-primary/60">
                        {alert.flight ? <span>{alert.flight}</span> : null}
                        {alert.detectedAt ? <span>{alert.detectedAt}</span> : null}
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl border border-dashed border-accent/40 bg-secondary px-4 py-6 text-center text-sm text-slate-500">
                No alerts raised. Guardrails are steady.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

FixnadoAdsSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      summaryCards: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
          change: PropTypes.string,
          trend: PropTypes.string,
          helper: PropTypes.string
        })
      ),
      funnel: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
          helper: PropTypes.string
        })
      ),
      campaigns: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string.isRequired,
          status: PropTypes.string,
          objective: PropTypes.string,
          spend: PropTypes.string,
          spendChange: PropTypes.string,
          conversions: PropTypes.string,
          conversionsChange: PropTypes.string,
          cpa: PropTypes.string,
          roas: PropTypes.string,
          roasChange: PropTypes.string,
          pacing: PropTypes.string,
          lastMetricDate: PropTypes.string,
          flights: PropTypes.number,
          window: PropTypes.string
        })
      ),
      invoices: PropTypes.arrayOf(
        PropTypes.shape({
          invoiceNumber: PropTypes.string,
          campaign: PropTypes.string,
          amountDue: PropTypes.string,
          status: PropTypes.string,
          dueDate: PropTypes.string
        })
      ),
      alerts: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string,
          severity: PropTypes.string,
          description: PropTypes.string,
          detectedAt: PropTypes.string,
          flight: PropTypes.string
        })
      ),
      recommendations: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired,
          action: PropTypes.string
        })
      ),
      timeline: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          status: PropTypes.string,
          start: PropTypes.string,
          end: PropTypes.string,
          budget: PropTypes.string
        })
      )
    })
  }).isRequired
};

const SettingsSection = ({ section }) => {
  const panels = section.data?.panels ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="space-y-6">
        {panels.map((panel) => (
          <div
            key={panel.id ?? panel.title}
            className="rounded-2xl border border-accent/10 bg-white p-6 shadow-md"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">{panel.title}</h3>
                {panel.description && <p className="mt-1 text-sm text-slate-600">{panel.description}</p>}
              </div>
              {panel.status && (
                <span className="mt-1 inline-flex h-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {panel.status}
                </span>
              )}
            </div>
            <ul className="mt-4 divide-y divide-slate-200">
              {(panel.items ?? []).map((item) => (
                <li
                  key={item.id ?? item.label}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-primary">{item.label}</p>
                    {item.helper && <p className="text-sm text-slate-500">{item.helper}</p>}
                  </div>
                  <div className="flex flex-col items-start gap-1 text-sm font-medium text-primary sm:items-end">
                    {item.type === 'toggle' ? (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                          item.enabled
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600 sm:text-base">{String(item.value ?? '—')}</span>
                    )}
                    {item.meta && <span className="text-xs text-slate-400">{item.meta}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

SettingsSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      panels: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string.isRequired,
          description: PropTypes.string,
          status: PropTypes.string,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string,
              label: PropTypes.string.isRequired,
              helper: PropTypes.string,
              type: PropTypes.oneOf(['toggle', 'value']).isRequired,
              enabled: PropTypes.bool,
              value: PropTypes.string,
              meta: PropTypes.string
            })
          ).isRequired
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const ZonePlannerSection = ({ section }) => {
  const { canvas = [], zones = [], drafts = [], actions = [] } = section.data ?? {};
  const flatZones = zones.reduce((acc, zone) => ({ ...acc, [zone.code]: zone.color }), {});

  return (
    <div>
      <SectionHeader section={section} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-accent/10 bg-white p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Draft Zone Layout</h3>
              <span className="rounded-full border border-accent/20 bg-secondary px-3 py-1 text-xs font-semibold text-primary/70">
                {canvas.length} rows • {canvas[0]?.length ?? 0} cols
              </span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${canvas[0]?.length ?? 0}, minmax(0, 1fr))`, gap: '6px' }}>
              {canvas.flatMap((row, rowIndex) =>
                row.map((cell, cellIndex) => {
                  const fill = cell ? flatZones[cell] ?? '#bae6fd' : '#e2e8f0';
                  return (
                    <div
                      key={`${rowIndex}-${cellIndex}-${cell ?? 'empty'}`}
                      className="aspect-square rounded-xl border border-white/70 shadow-sm"
                      style={{ backgroundColor: fill }}
                    >
                      {cell ? (
                        <span className="flex h-full items-center justify-center text-xs font-semibold text-slate-700">
                          {cell}
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-accent/10 bg-white p-4 shadow-md">
            <h3 className="text-lg font-semibold text-primary">Next zoning actions</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {actions.map((action) => (
                <li key={action} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-accent/10 bg-white p-4 shadow-md">
            <h3 className="text-base font-semibold text-primary">Active zones</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {zones.map((zone) => (
                <li key={zone.code} className="rounded-2xl border border-accent/10 bg-secondary px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary">Zone {zone.code}</span>
                    <span className="rounded-full border border-white/60 px-2 py-1 text-xs font-semibold" style={{ backgroundColor: zone.color }}>
                      {zone.region}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Lead: {zone.lead}</p>
                  <p className="mt-1 text-xs text-slate-500">Workload: {zone.workload}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-accent/10 bg-white p-4 shadow-md">
            <h3 className="text-base font-semibold text-primary">Draft overlays</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              {drafts.map((draft) => (
                <li key={draft.title} className="rounded-2xl border border-dashed border-accent/40 bg-secondary px-4 py-3">
                  <p className="font-semibold text-primary">{draft.title}</p>
                  <p className="text-xs text-slate-500">{draft.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

ZonePlannerSection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      canvas: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
      zones: PropTypes.arrayOf(
        PropTypes.shape({
          code: PropTypes.string.isRequired,
          region: PropTypes.string.isRequired,
          color: PropTypes.string.isRequired,
          lead: PropTypes.string.isRequired,
          workload: PropTypes.string.isRequired
        })
      ),
      drafts: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired
        })
      ),
      actions: PropTypes.arrayOf(PropTypes.string)
    })
  }).isRequired
};

const DashboardSection = ({ section }) => {
  switch (section.type) {
    case 'grid':
      return <GridSection section={section} />;
    case 'board':
      return <BoardSection section={section} />;
    case 'table':
      return <TableSection section={section} />;
    case 'list':
      return <ListSection section={section} />;
    case 'ads':
      return <FixnadoAdsSection section={section} />;
    case 'settings':
      return <SettingsSection section={section} />;
    case 'calendar':
      return <CalendarSection section={section} />;
    case 'availability':
      return <AvailabilitySection section={section} />;
    case 'zones':
      return <ZonePlannerSection section={section} />;
    default:
      return null;
  }
};

DashboardSection.propTypes = {
  section: PropTypes.shape({
    type: PropTypes.string.isRequired
  }).isRequired
};

export default DashboardSection;

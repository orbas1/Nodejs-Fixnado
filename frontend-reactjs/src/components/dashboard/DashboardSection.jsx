import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusSmallIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DisputeHealthWorkspace from './DisputeHealthWorkspace.jsx';
import UserManagementSection from './userManagement/UserManagementSection.jsx';
import MarketplaceWorkspace from '../../features/marketplace-admin/MarketplaceWorkspace.jsx';
import { ServiceManagementSection } from '../service-management/index.js';
import AuditTimelineSection from '../audit-timeline/AuditTimelineSection.jsx';
import ComplianceControlSection from './compliance/ComplianceControlSection.jsx';
import RentalManagementSection from './rentals/RentalManagementSection.jsx';
import CustomerSettingsSection from './CustomerSettingsSection.jsx';
import WalletSection from './wallet/WalletSection.jsx';
import ServiceOrdersWorkspace from './service-orders/index.js';
import OrderHistoryManager from '../orders/OrderHistoryManager.jsx';
import { AccountSettingsManager } from '../../features/accountSettings/index.js';

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
              {item.href ? (
                item.href.startsWith('http') ? (
                  <a
                    href={item.href}
                    target={item.target ?? '_blank'}
                    rel="noreferrer"
                    className="mt-3 inline-flex w-max items-center gap-2 rounded-full border border-accent/20 px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary/40"
                  >
                    {item.cta ?? 'Open link'}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    target={item.target ?? '_self'}
                    className="mt-3 inline-flex w-max items-center gap-2 rounded-full border border-accent/20 px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary/40"
                  >
                    {item.cta ?? 'Open workspace'}
                  </Link>
                )
              ) : null}
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
          status: PropTypes.string.isRequired,
          href: PropTypes.string,
          target: PropTypes.string,
          cta: PropTypes.string
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const summaryToneMap = {
  info: 'border-slate-200 bg-white/85 text-primary',
  accent: 'border-primary/30 bg-primary/5 text-primary',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const inventoryStatusTone = {
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  low_stock: 'border-amber-200 bg-amber-50 text-amber-700',
  stockout: 'border-rose-200 bg-rose-50 text-rose-700'
};

const inventoryStatusLabel = {
  healthy: 'Healthy',
  low_stock: 'Low stock',
  stockout: 'Out of stock'
};

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const currencyFormatter = (currency = 'GBP') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 });

const formatInventoryNumber = (value) => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return numberFormatter.format(value);
};

const formatInventoryCurrency = (value, currency) => {
  if (!Number.isFinite(value)) {
    return null;
  }
  try {
    return currencyFormatter(currency || 'GBP').format(value);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return currencyFormatter('GBP').format(value);
  }
};

const formatInventoryDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const InventorySection = ({ section }) => {
  const summary = section.data?.summary ?? [];
  const groups = section.data?.groups ?? [];

  return (
    <div>
      <SectionHeader section={section} />
      {summary.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summary.map((item) => {
            const toneClass = summaryToneMap[item.tone] ?? summaryToneMap.info;
            return (
              <div
                key={item.id ?? item.label}
                className={`rounded-2xl border p-5 shadow-md ${toneClass}`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{formatInventoryNumber(item.value)}</p>
                {item.helper ? <p className="mt-2 text-xs text-slate-600">{item.helper}</p> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 space-y-8">
        {groups.map((group) => (
          <div key={group.id ?? group.label} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-primary">{group.label}</h3>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {formatInventoryNumber(group.items?.length ?? 0)} records
              </span>
            </div>
            {group.items?.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {group.items.map((item) => {
                  const statusTone = inventoryStatusTone[item.status] ?? inventoryStatusTone.healthy;
                  const statusLabel = inventoryStatusLabel[item.status] ?? item.status;
                  const rentalLabel = formatInventoryCurrency(item.rentalRate, item.rentalRateCurrency);
                  const depositLabel = formatInventoryCurrency(item.depositAmount, item.depositCurrency);
                  const maintenanceLabel = formatInventoryDate(item.nextMaintenanceDue);
                  return (
                    <article
                      key={item.id ?? item.name}
                      className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm"
                    >
                      <header className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {[item.sku, item.category].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                        {item.status ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone}`}
                          >
                            {statusLabel}
                          </span>
                        ) : null}
                      </header>
                      <dl className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                        <div>
                          <dt className="font-medium text-slate-500">Available</dt>
                          <dd className="mt-1 text-sm font-semibold text-primary">{formatInventoryNumber(item.available)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-500">Reserved</dt>
                          <dd className="mt-1 text-sm font-semibold text-primary">{formatInventoryNumber(item.reserved)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-500">On hand</dt>
                          <dd className="mt-1">{formatInventoryNumber(item.onHand)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-500">Safety stock</dt>
                          <dd className="mt-1">{formatInventoryNumber(item.safetyStock)}</dd>
                        </div>
                        {Number.isFinite(item.activeRentals) ? (
                          <div>
                            <dt className="font-medium text-slate-500">Active rentals</dt>
                            <dd className="mt-1">{formatInventoryNumber(item.activeRentals)}</dd>
                          </div>
                        ) : null}
                        {Number.isFinite(item.activeAlerts) ? (
                          <div>
                            <dt className="font-medium text-slate-500">Alerts</dt>
                            <dd className="mt-1">{formatInventoryNumber(item.activeAlerts)}</dd>
                          </div>
                        ) : null}
                      </dl>
                      <div className="space-y-2 text-xs text-slate-500">
                        {item.condition ? (
                          <p className="font-medium text-slate-600">Condition: <span className="capitalize">{item.condition.replace(/_/g, ' ')}</span></p>
                        ) : null}
                        {item.location ? <p>Located in {item.location}</p> : null}
                        {maintenanceLabel ? <p>Next service due {maintenanceLabel}</p> : null}
                        {rentalLabel ? <p>Rental rate {rentalLabel}</p> : null}
                        {depositLabel ? <p>Deposit {depositLabel}</p> : null}
                        {item.notes ? <p className="italic text-slate-500">{item.notes}</p> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-secondary/60 p-6 text-sm text-slate-500">
                Inventory data is syncing.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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

const adsStatusClass = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';
  if (['scaling', 'primary', 'healthy', 'active', 'high intent'].some((token) => value.includes(token))) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (['steady', 'view', 'enable', 'growing', 'stable'].some((token) => value.includes(token))) {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }
  if (['warning', 'monitor', 'niche', 'test', 'pending'].some((token) => value.includes(token))) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (['critical', 'at risk', 'danger'].some((token) => value.includes(token))) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  return 'border-slate-200 bg-white text-slate-600';
};

const insightSeverityClass = (severity) => {
  const value = typeof severity === 'string' ? severity.toLowerCase() : '';
  if (value.includes('critical')) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (value.includes('warning')) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (value.includes('healthy') || value.includes('success')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (value.includes('monitor')) {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }
  return 'border-slate-200 bg-white text-slate-600';
};

const parseShareWidth = (share) => {
  if (typeof share === 'number' && Number.isFinite(share)) {
    return `${Math.max(0, Math.min(share, 1)) * 100}%`;
  }
  if (typeof share === 'string') {
    const numeric = Number.parseFloat(share.replace('%', '').trim());
    if (Number.isFinite(numeric)) {
      const normalised = share.includes('%') ? numeric : numeric * 100;
      return `${Math.max(0, Math.min(normalised, 100))}%`;
    }
  }
  return '0%';
};

const AdsAccessSummary = ({ accessLabel, accessLevel, accessFeatures, persona }) => {
  if (!accessLabel && !accessLevel && (!accessFeatures || accessFeatures.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-accent/20 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary/70">
        {accessLabel ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-secondary px-3 py-1 text-primary">
            {accessLabel}
          </span>
        ) : null}
        {accessLevel ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-primary/80">
            Access level: {accessLevel}
          </span>
        ) : null}
        {persona ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 text-primary/70">
            Persona: {persona}
          </span>
        ) : null}
      </div>
      {Array.isArray(accessFeatures) && accessFeatures.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-wide text-primary/60">
          {accessFeatures.map((feature) => (
            <span key={feature} className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-white px-3 py-1">
              {feature}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

AdsAccessSummary.propTypes = {
  accessLabel: PropTypes.string,
  accessLevel: PropTypes.string,
  accessFeatures: PropTypes.arrayOf(PropTypes.string),
  persona: PropTypes.string
};

const AdsPricingModels = ({ models }) => {
  if (!models.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Pricing models</h3>
        <span className="text-xs uppercase tracking-wide text-primary/60">{models.length} active</span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <div
            key={model.id ?? model.label}
            className="rounded-2xl border border-accent/10 bg-secondary px-4 py-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{model.label}</p>
                {model.unitLabel ? <p className="text-xs text-primary/60">{model.unitLabel}</p> : null}
              </div>
              {model.status ? (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${adsStatusClass(model.status)}`}>
                  {model.status}
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-primary">
              <div>
                <p className="text-xs uppercase tracking-wide text-primary/60">Spend</p>
                <p className="mt-1 text-lg font-semibold">{model.spend ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-primary/60">{model.unitLabel ?? 'Unit cost'}</p>
                <p className="mt-1 text-lg font-semibold">{model.unitCost ?? '—'}</p>
              </div>
            </div>
            {model.performance ? <p className="mt-3 text-sm text-slate-600">{model.performance}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

AdsPricingModels.propTypes = {
  models: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      spend: PropTypes.string,
      unitCost: PropTypes.string,
      unitLabel: PropTypes.string,
      performance: PropTypes.string,
      status: PropTypes.string
    })
  ).isRequired
};

const AdsChannelMix = ({ channelMix }) => {
  if (!channelMix.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Channel mix</h3>
        <span className="text-xs uppercase tracking-wide text-primary/60">{channelMix.length} channels</span>
      </div>
      <ul className="mt-4 space-y-4">
        {channelMix.map((channel) => (
          <li
            key={channel.id ?? channel.label}
            className="rounded-2xl border border-accent/10 bg-secondary px-4 py-3 text-sm text-slate-600"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{channel.label}</p>
                <p className="text-xs text-primary/60">
                  {channel.campaigns ?? 0} campaign{channel.campaigns === 1 ? '' : 's'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">{channel.share ?? '—'}</p>
                <p className="text-xs text-primary/60">{channel.performance}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-primary/60">
              <span>{channel.spend}</span>
              {channel.status ? (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold ${adsStatusClass(channel.status)}`}>
                  {channel.status}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

AdsChannelMix.propTypes = {
  channelMix: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      spend: PropTypes.string,
      share: PropTypes.string,
      performance: PropTypes.string,
      status: PropTypes.string,
      campaigns: PropTypes.number
    })
  ).isRequired
};

const AdsTargetingSegments = ({ segments }) => {
  if (!segments.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Targeting segments</h3>
        <span className="text-xs uppercase tracking-wide text-primary/60">{segments.length} segments</span>
      </div>
      <ul className="mt-4 space-y-4">
        {segments.map((segment) => (
          <li
            key={segment.id ?? segment.label}
            className="rounded-2xl border border-accent/10 bg-secondary px-4 py-3 text-sm text-slate-600"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{segment.label}</p>
                {segment.helper ? <p className="text-xs text-primary/60">{segment.helper}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">{segment.share ?? '—'}</p>
                {segment.metric ? <p className="text-xs text-primary/60">{segment.metric}</p> : null}
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-white/60">
              <div className="h-2 rounded-full bg-accent" style={{ width: parseShareWidth(segment.share) }} />
            </div>
            {segment.status ? (
              <div className="mt-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${adsStatusClass(segment.status)}`}>
                  {segment.status}
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

AdsTargetingSegments.propTypes = {
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      metric: PropTypes.string,
      share: PropTypes.string,
      status: PropTypes.string,
      helper: PropTypes.string
    })
  ).isRequired
};

const AdsCreativeInsights = ({ insights }) => {
  if (!insights.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Creative insights &amp; guardrails</h3>
        <span className="text-xs uppercase tracking-wide text-primary/60">{insights.length} signals</span>
      </div>
      <ul className="mt-4 space-y-4">
        {insights.map((insight) => (
          <li
            key={insight.id ?? insight.label}
            className="rounded-2xl border border-accent/10 bg-secondary px-4 py-3 text-sm text-slate-600"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{insight.label}</p>
                {insight.detectedAt ? (
                  <p className="text-xs text-primary/60">Detected {insight.detectedAt}</p>
                ) : null}
              </div>
              {insight.severity ? (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${insightSeverityClass(insight.severity)}`}>
                  {insight.severity}
                </span>
              ) : null}
            </div>
            {insight.message ? <p className="mt-2 text-sm text-slate-600">{insight.message}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

AdsCreativeInsights.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      severity: PropTypes.string,
      message: PropTypes.string,
      detectedAt: PropTypes.string
    })
  ).isRequired
};

const FixnadoAdsSection = ({ section, features = {}, persona }) => {
  const summaryCards = section.data?.summaryCards ?? [];
  const funnel = section.data?.funnel ?? [];
  const campaigns = section.data?.campaigns ?? [];
  const invoices = section.data?.invoices ?? [];
  const alerts = section.data?.alerts ?? [];
  const recommendations = section.data?.recommendations ?? [];
  const timeline = section.data?.timeline ?? [];
  const pricingModels = section.data?.pricingModels ?? [];
  const channelMix = section.data?.channelMix ?? [];
  const targeting = section.data?.targeting ?? [];
  const creativeInsights = section.data?.creativeInsights ?? [];

  const adsFeature = features.ads ?? {};
  const accessMeta = section.access ?? null;
  const isAvailable = adsFeature.available !== false;
  const accessLabel = accessMeta?.label ?? adsFeature.label ?? 'Fixnado Ads';
  const accessLevel = accessMeta?.level ?? adsFeature.level ?? 'view';
  const accessFeatures = accessMeta?.features ?? adsFeature.features ?? [];

  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <SectionHeader section={section} />
        <div className="rounded-3xl border border-dashed border-accent/30 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          <p className="text-lg font-semibold text-primary">Access restricted</p>
          <p className="mt-2">
            {accessLabel} is not enabled for this workspace yet. Please contact your administrator to request {accessLevel}{' '}
            access.
          </p>
        </div>
      </div>
    );
  }

  if (
    summaryCards.length === 0 &&
    funnel.length === 0 &&
    campaigns.length === 0 &&
    invoices.length === 0 &&
    alerts.length === 0 &&
    recommendations.length === 0 &&
    timeline.length === 0 &&
    pricingModels.length === 0 &&
    channelMix.length === 0 &&
    targeting.length === 0 &&
    creativeInsights.length === 0
  ) {
    return (
      <div className="space-y-6">
        <SectionHeader section={section} />
        <div className="rounded-3xl border border-dashed border-accent/30 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          No Fixnado Ads data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader section={section} />
      <AdsAccessSummary
        accessLabel={accessLabel}
        accessLevel={accessLevel}
        accessFeatures={accessFeatures}
        persona={persona}
      />

      {summaryCards.length > 0 ? (
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
      ) : null}

      {pricingModels.length > 0 || channelMix.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <AdsPricingModels models={pricingModels} />
          <AdsChannelMix channelMix={channelMix} />
        </div>
      ) : null}

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
                <li
                  key={`${entry.title}-${entry.start}`}
                  className="rounded-2xl border border-accent/10 bg-white/80 px-4 py-3 text-sm text-slate-600"
                >
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

      {targeting.length > 0 || creativeInsights.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <AdsTargetingSegments segments={targeting} />
          <AdsCreativeInsights insights={creativeInsights} />
        </div>
      ) : null}

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

InventorySection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      summary: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string.isRequired,
          value: PropTypes.number,
          helper: PropTypes.string,
          tone: PropTypes.string
        })
      ),
      groups: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string.isRequired,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
              name: PropTypes.string.isRequired,
              sku: PropTypes.string,
              category: PropTypes.string,
              status: PropTypes.string,
              available: PropTypes.number,
              onHand: PropTypes.number,
              reserved: PropTypes.number,
              safetyStock: PropTypes.number,
              unitType: PropTypes.string,
              condition: PropTypes.string,
              location: PropTypes.string,
              nextMaintenanceDue: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.instanceOf(Date)
              ]),
              notes: PropTypes.string,
              activeAlerts: PropTypes.number,
              alertSeverity: PropTypes.string,
              activeRentals: PropTypes.number,
              rentalRate: PropTypes.number,
              rentalRateCurrency: PropTypes.string,
              depositAmount: PropTypes.number,
              depositCurrency: PropTypes.string
            })
          )
        })
      )
    })
  }).isRequired
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
      ),
      pricingModels: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string.isRequired,
          spend: PropTypes.string,
          unitCost: PropTypes.string,
          unitLabel: PropTypes.string,
          performance: PropTypes.string,
          status: PropTypes.string
        })
      ),
      channelMix: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string.isRequired,
          spend: PropTypes.string,
          share: PropTypes.string,
          performance: PropTypes.string,
          status: PropTypes.string,
          campaigns: PropTypes.number
        })
      ),
      targeting: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string.isRequired,
          metric: PropTypes.string,
          share: PropTypes.string,
          status: PropTypes.string,
          helper: PropTypes.string
        })
      ),
      creativeInsights: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string.isRequired,
          severity: PropTypes.string,
          message: PropTypes.string,
          detectedAt: PropTypes.string
        })
      )
    }),
    access: PropTypes.shape({
      label: PropTypes.string,
      level: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string)
    })
  }).isRequired,
  features: PropTypes.shape({
    ads: PropTypes.shape({
      available: PropTypes.bool,
      level: PropTypes.string,
      label: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string)
    })
  }),
  persona: PropTypes.string
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
                    ) : item.type === 'action' ? (
                      <Link
                        to={item.href ?? '#'}
                        className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent hover:text-primary"
                      >
                        {item.cta ?? 'Manage'}
                        <span aria-hidden="true">→</span>
                      </Link>
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
              type: PropTypes.oneOf(['toggle', 'value', 'action']).isRequired,
              enabled: PropTypes.bool,
              value: PropTypes.string,
              meta: PropTypes.string,
              cta: PropTypes.string,
              href: PropTypes.string
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

const DashboardSection = ({ section, features = {}, persona }) => {
  if (section.type === 'automation' || section.id === 'automation-backlog') {
    return <AutomationBacklogSection section={section} features={features} persona={persona} />;
  }
  switch (section.type) {
    case 'grid':
      return <GridSection section={section} />;
    case 'board':
      if (section.id === 'orders') {
        return <ServiceOrdersWorkspace section={section} />;
      }
      return <BoardSection section={section} />;
    case 'table':
      return <TableSection section={section} />;
    case 'list':
      return <ListSection section={section} />;
    case 'rentals':
      return <RentalManagementSection section={section} />;
    case 'inventory':
      return <InventorySection section={section} />;
    case 'ads':
      return <FixnadoAdsSection section={section} features={features} persona={persona} />;
    case 'settings':
      return persona === 'user' ? (
        <CustomerSettingsSection section={section} />
      ) : (
        <SettingsSection section={section} />
      );
    case 'settings': {
      const sectionLabel = section?.label?.toLowerCase?.() ?? '';
      const shouldRenderAccountSettings =
        persona === 'user' ||
        features?.accountSettings === true ||
        features?.accountSettingsBeta === true ||
        sectionLabel.includes('account settings');

      if (shouldRenderAccountSettings) {
        return <AccountSettingsManager initialSnapshot={section} />;
      }

      return <SettingsSection section={section} />;
    }
    case 'calendar':
      return <CalendarSection section={section} />;
    case 'availability':
      return <AvailabilitySection section={section} />;
    case 'zones':
      return <ZonePlannerSection section={section} />;
    case 'dispute-workspace':
      return <DisputeHealthWorkspace section={section} />;
    case 'user-management':
      return <UserManagementSection section={section} />;
    case 'marketplace-workspace':
      return (
        <MarketplaceWorkspace
          initialCompanyId={section.data?.companyId ?? ''}
          prefetchedOverview={section.data?.overview ?? null}
        />
      );
    case 'service-management':
      return <ServiceManagementSection section={section} />;
    case 'audit-timeline':
      return <AuditTimelineSection section={section} />;
    case 'compliance-controls':
      return <ComplianceControlSection section={section} />;
    case 'wallet':
      return <WalletSection section={section} />;
    case 'component': {
      const Component = section.component;
      if (!Component) return null;
      return <Component {...(section.data ?? {})} />;
    }
    case 'history':
      return <OrderHistoryManager section={section} features={features} persona={persona} />;
    default:
      return null;
  }
};

DashboardSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string.isRequired,
    access: PropTypes.shape({
      label: PropTypes.string,
      level: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string)
    }),
    data: PropTypes.object
  }).isRequired,
  features: PropTypes.object,
  persona: PropTypes.string
};

export default DashboardSection;

import PropTypes from 'prop-types';
import { ClockIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useLocale } from '../../../hooks/useLocale.js';
import { resolveRiskTone } from '../utils.js';

export default function ServiceDeliveryColumn({ column }) {
  const { format, t } = useLocale();

  return (
    <div className="provider-dashboard__card" data-qa={`provider-dashboard-delivery-column-${column.id}`}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="provider-dashboard__card-label">{t('providerDashboard.serviceDeliveryStage')}</p>
          <h3 className="provider-dashboard__card-title text-xl">{column.title}</h3>
        </div>
        <StatusPill tone="neutral">{column.items.length}</StatusPill>
      </header>
      {column.description ? <p className="provider-dashboard__card-meta">{column.description}</p> : null}
      <ul className="mt-4 flex-1 space-y-3">
        {column.items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[var(--provider-border-dashed)] bg-white/5 p-5 text-sm text-[var(--provider-text-secondary)]">
            {t('providerDashboard.serviceDeliveryEmpty')}
          </li>
        ) : (
          column.items.map((item) => {
            const eta = item.eta ? format.dateTime(item.eta) : t('providerDashboard.serviceDeliveryEtaPending');
            const valueLabel = item.value != null ? format.currency(item.value, { currency: item.currency || 'GBP' }) : null;
            const tone = resolveRiskTone(item.risk);

            return (
              <li
                key={item.id}
                className="provider-dashboard__card provider-dashboard__card-muted"
                data-qa={`provider-dashboard-delivery-item-${item.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--provider-text-primary)]">{item.name}</p>
                    <p className="provider-dashboard__card-meta">{item.client}</p>
                  </div>
                  <StatusPill tone={tone}>{item.risk || t('providerDashboard.serviceDeliveryOnTrack')}</StatusPill>
                </div>
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="provider-dashboard__thumbnail"
                    loading="lazy"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--provider-text-secondary)]">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
                    {t('providerDashboard.serviceDeliveryEta', { date: eta })}
                  </span>
                  {item.zone ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
                      {item.zone}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
                    {item.owner}
                  </span>
                  {valueLabel ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--provider-text-primary)]">
                      {valueLabel}
                    </span>
                  ) : null}
                </div>
                {item.services?.length ? (
                  <div className="provider-dashboard__chip-row">
                    {item.services.map((service) => (
                      <span key={service} className="provider-dashboard__chip">
                        {service}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

ServiceDeliveryColumn.propTypes = {
  column: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        client: PropTypes.string,
        risk: PropTypes.string,
        eta: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        zone: PropTypes.string,
        owner: PropTypes.string,
        value: PropTypes.number,
        currency: PropTypes.string,
        services: PropTypes.arrayOf(PropTypes.string)
      })
    ).isRequired
  }).isRequired
};

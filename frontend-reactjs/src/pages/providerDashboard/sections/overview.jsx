import { CalendarDaysIcon, ChartBarIcon, ClockIcon, LifebuoyIcon } from '@heroicons/react/24/outline';
import { MetricCard, SpotlightCard, BookingRow, AlertBanner } from '../components/index.js';
import StatusPill from '../../../components/ui/StatusPill.jsx';

export function createOverviewTabs({
  t,
  format,
  metrics,
  heroStatusTone,
  spotlightItems,
  revenue,
  bookings,
  compliance,
  alerts,
  snapshotTime
}) {
  const tabs = [];

  const metricCards = (
    <section key="metrics" className="provider-dashboard__section provider-dashboard__section--muted">
      <header className="provider-dashboard__section-header">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
          <h3 className="provider-dashboard__section-heading">{t('providerDashboard.metricsHeadline')}</h3>
        </div>
      </header>
      <div className="provider-dashboard__grid provider-dashboard__grid--wide">
        <MetricCard
          icon={ChartBarIcon}
          label={t('providerDashboard.metricRevenue')}
          value={format.currency(revenue?.monthToDate ?? 0)}
          caption={t('providerDashboard.metricCaptionRevenue', {
            value: format.currency(revenue?.forecast ?? 0)
          })}
          data-qa="provider-dashboard-metric-revenue"
        />
        <MetricCard
          icon={ClockIcon}
          label={t('providerDashboard.metricSla')}
          value={t('common.slaStatus', { value: format.percentage(metrics?.slaHitRate ?? 0) })}
          caption={t('providerDashboard.metricCaptionSla')}
          tone={heroStatusTone}
          toneLabel={t(
            heroStatusTone === 'danger' || heroStatusTone === 'warning'
              ? 'common.actionRequired'
              : 'common.onTrack'
          )}
          data-qa="provider-dashboard-metric-sla"
        />
        <MetricCard
          icon={CalendarDaysIcon}
          label={t('providerDashboard.metricUtilisation')}
          value={format.percentage(metrics?.utilisation ?? 0)}
          caption={t('providerDashboard.metricCaptionUtilisation')}
          tone={heroStatusTone}
          toneLabel={t(
            heroStatusTone === 'danger' || heroStatusTone === 'warning'
              ? 'common.actionRequired'
              : 'common.onTrack'
          )}
          data-qa="provider-dashboard-metric-utilisation"
        />
        <MetricCard
          icon={LifebuoyIcon}
          label={t('providerDashboard.metricAverageRating')}
          value={t('providerDashboard.metricSatisfactionValue', {
            value: format.number(Math.round((metrics?.satisfaction ?? 0) * 100))
          })}
          caption={t('providerDashboard.metricCaptionRating')}
          data-qa="provider-dashboard-metric-satisfaction"
        />
      </div>
    </section>
  );

  const spotlightSection = spotlightItems.length
    ? (
        <section key="spotlight" className="provider-dashboard__section provider-dashboard__section--muted">
          <header className="provider-dashboard__section-header">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
              <div>
                <h3 className="provider-dashboard__section-heading">{t('providerDashboard.spotlight.heading')}</h3>
                <p className="provider-dashboard__section-description">
                  {t('providerDashboard.spotlight.description')}
                </p>
              </div>
            </div>
          </header>
          <div className="provider-dashboard__carousel">
            {spotlightItems.map((item) => (
              <SpotlightCard
                key={item.id}
                icon={item.icon}
                eyebrow={item.eyebrow}
                title={item.title}
                meta={item.meta}
                description={item.description}
                tone={item.tone}
                toneLabel={item.toneLabel}
              />
            ))}
          </div>
        </section>
      )
    : null;

  const revenueSection = (
    <section key="revenue" className="provider-dashboard__section provider-dashboard__section--muted">
      <header className="provider-dashboard__section-header">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
          <h3 className="provider-dashboard__section-heading">{t('providerDashboard.revenueHeadline')}</h3>
        </div>
        {snapshotTime ? (
          <div className="provider-dashboard__section-actions">
            <span className="provider-dashboard__pill">
              {t('providerDashboard.snapshot', { time: snapshotTime })}
            </span>
          </div>
        ) : null}
      </header>
      <div className="provider-dashboard__grid">
        <article className="provider-dashboard__card" data-qa="provider-dashboard-revenue-mtd">
          <p className="provider-dashboard__card-label">{t('providerDashboard.revenueMonthToDate')}</p>
          <p className="provider-dashboard__card-title text-2xl">
            {format.currency(revenue?.monthToDate ?? 0)}
          </p>
        </article>
        <article className="provider-dashboard__card" data-qa="provider-dashboard-revenue-forecast">
          <p className="provider-dashboard__card-label">{t('providerDashboard.revenueForecast')}</p>
          <p className="provider-dashboard__card-title text-2xl">
            {format.currency(revenue?.forecast ?? 0)}
          </p>
        </article>
        <article className="provider-dashboard__card" data-qa="provider-dashboard-revenue-outstanding">
          <p className="provider-dashboard__card-label">{t('providerDashboard.revenueOutstanding')}</p>
          <p className="provider-dashboard__card-title text-2xl">
            {format.currency(revenue?.outstandingBalance ?? 0)}
          </p>
          {revenue?.nextPayoutDate ? (
            <p className="provider-dashboard__card-meta">
              {t('providerDashboard.nextPayout', { date: format.date(revenue.nextPayoutDate) })}
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );

  const pulseSections = [metricCards, spotlightSection, revenueSection].filter(Boolean);

  if (pulseSections.length) {
    tabs.push({
      id: 'provider-dashboard-overview-pulse',
      label: t('providerDashboard.tabs.overviewPulse'),
      content: pulseSections
    });
  }

  const pipelineSections = [];

  pipelineSections.push(
    <section key="pipeline" className="provider-dashboard__section provider-dashboard__section--muted">
      <div className="provider-dashboard__grid provider-dashboard__grid--stacked lg:grid-cols-2">
        <div className="space-y-4">
          <header className="provider-dashboard__section-header">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
              <h3 className="provider-dashboard__section-heading">{t('providerDashboard.pipelineBookings')}</h3>
            </div>
          </header>
          <ul className="space-y-3">
            {bookings.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-[var(--provider-border-dashed)] bg-white/5 p-6 text-sm text-[var(--provider-text-secondary)]">
                {t('providerDashboard.emptyBookings')}
              </li>
            ) : (
              bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)
            )}
          </ul>
        </div>
        <div className="space-y-4">
          <header className="provider-dashboard__section-header">
            <div className="flex items-center gap-3">
              <LifebuoyIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
              <h3 className="provider-dashboard__section-heading">{t('providerDashboard.pipelineCompliance')}</h3>
            </div>
          </header>
          <ul className="space-y-3">
            {compliance.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-[var(--provider-border-dashed)] bg-white/5 p-6 text-sm text-[var(--provider-text-secondary)]">
                {t('providerDashboard.allComplianceHealthy')}
              </li>
            ) : (
              compliance.map((item) => (
                <li
                  key={item.id}
                  className="provider-dashboard__card provider-dashboard__card-muted"
                  data-qa={`provider-dashboard-compliance-${item.id}`}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--provider-text-primary)]">{item.name}</p>
                    <p className="provider-dashboard__card-meta">
                      {t('providerDashboard.complianceOwner', { name: item.owner })}
                    </p>
                  </div>
                  <StatusPill tone="warning">
                    {item.expiresOn
                      ? t('providerDashboard.complianceExpiry', { date: format.date(item.expiresOn) })
                      : t('providerDashboard.compliancePending')}
                  </StatusPill>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );

  if (alerts.length > 0) {
    pipelineSections.push(
      <section key="alerts" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <LifebuoyIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <h3 className="provider-dashboard__section-heading">{t('providerDashboard.alertsHeadline')}</h3>
          </div>
        </header>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      </section>
    );
  }

  if (pipelineSections.length) {
    tabs.push({
      id: 'provider-dashboard-overview-pipeline',
      label: t('providerDashboard.tabs.overviewPipeline'),
      content: pipelineSections
    });
  }

  return tabs;
}

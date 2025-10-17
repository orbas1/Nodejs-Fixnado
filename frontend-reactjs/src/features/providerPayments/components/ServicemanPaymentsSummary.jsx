import PropTypes from 'prop-types';
import { BanknotesIcon, ChartBarIcon, ClockIcon, CurrencyPoundIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useLocale } from '../../../hooks/useLocale.js';

const SUMMARY_FIELDS = [
  {
    key: 'outstandingTotal',
    icon: CurrencyPoundIcon,
    tone: 'warning'
  },
  {
    key: 'paidLast30Days',
    icon: BanknotesIcon,
    tone: 'success'
  },
  {
    key: 'upcomingCount',
    icon: ClockIcon,
    tone: 'neutral'
  },
  {
    key: 'avgCommissionRate',
    icon: ChartBarIcon,
    tone: 'accent'
  },
  {
    key: 'commissionPaid',
    icon: DocumentCheckIcon,
    tone: 'success'
  },
  {
    key: 'commissionOutstanding',
    icon: DocumentCheckIcon,
    tone: 'warning'
  }
];

export default function ServicemanPaymentsSummary({ summary }) {
  const { t, format } = useLocale();

  const renderValue = (key, value) => {
    switch (key) {
      case 'outstandingTotal':
      case 'paidLast30Days':
      case 'commissionPaid':
      case 'commissionOutstanding':
        return format.currency(value ?? 0);
      case 'avgCommissionRate':
        return format.percentage(value ?? 0, { maximumFractionDigits: 1 });
      case 'upcomingCount':
        return format.number(value ?? 0);
      default:
        return value;
    }
  };

  const renderCaption = (key) => {
    switch (key) {
      case 'outstandingTotal':
        return t('providerPayments.summary.outstandingCaption');
      case 'paidLast30Days':
        return t('providerPayments.summary.paidCaption');
      case 'upcomingCount':
        return t('providerPayments.summary.upcomingCaption');
      case 'avgCommissionRate':
        return t('providerPayments.summary.averageCaption');
      case 'commissionPaid':
        return t('providerPayments.summary.commissionPaidCaption');
      case 'commissionOutstanding':
        return t('providerPayments.summary.commissionOutstandingCaption');
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6" data-qa="serviceman-payments-summary">
      {SUMMARY_FIELDS.map(({ key, icon: Icon, tone }) => {
        const value = summary?.[key] ?? 0;
        const label = t(`providerPayments.summary.${key}`);
        const caption = renderCaption(key);

        return (
          <Card key={key} padding="lg" className="flex flex-col gap-3" data-qa={`serviceman-payments-summary-${key}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-semibold text-primary">{renderValue(key, value)}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            {caption ? <p className="text-xs text-slate-500">{caption}</p> : null}
            {key === 'outstandingTotal' && value > 0 ? (
              <StatusPill tone={tone}>{t('providerPayments.summary.actionRequired')}</StatusPill>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

ServicemanPaymentsSummary.propTypes = {
  summary: PropTypes.shape({
    outstandingTotal: PropTypes.number,
    paidLast30Days: PropTypes.number,
    avgCommissionRate: PropTypes.number,
    upcomingCount: PropTypes.number,
    commissionPaid: PropTypes.number,
    commissionOutstanding: PropTypes.number
  })
};

ServicemanPaymentsSummary.defaultProps = {
  summary: null
};

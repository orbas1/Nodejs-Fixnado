import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import TextInput from '../../components/ui/TextInput.jsx';
import Select from '../../components/ui/Select.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ServicemanPaymentForm from './components/ServicemanPaymentForm.jsx';
import ServicemanPaymentsSummary from './components/ServicemanPaymentsSummary.jsx';
import ServicemanCommissionRuleForm from './components/ServicemanCommissionRuleForm.jsx';
import {
  getServicemanPaymentsWorkspace,
  createServicemanPayment,
  updateServicemanPayment,
  deleteServicemanPayment,
  createServicemanCommissionRule,
  updateServicemanCommissionRule,
  archiveServicemanCommissionRule
} from '../../api/providerPaymentsClient.js';
import { PanelApiError } from '../../api/panelClient.js';
import { useLocale } from '../../hooks/useLocale.js';

const HISTORY_PAGE_SIZE = 10;

const PAYMENT_STATUS_OPTIONS = ['all', 'scheduled', 'pending', 'approved', 'paid', 'failed', 'cancelled'];

function PaymentStatusPill({ status }) {
  const { t } = useLocale();
  let tone = 'neutral';
  switch (status) {
    case 'scheduled':
      tone = 'info';
      break;
    case 'pending':
      tone = 'warning';
      break;
    case 'approved':
      tone = 'success';
      break;
    case 'paid':
      tone = 'success';
      break;
    case 'failed':
    case 'cancelled':
      tone = 'danger';
      break;
    default:
      tone = 'neutral';
  }

  return <StatusPill tone={tone}>{t(`providerPayments.status.${status}`)}</StatusPill>;
}

PaymentStatusPill.propTypes = {
  status: PropTypes.string.isRequired
};

function CommissionStatusPill({ status }) {
  const { t } = useLocale();
  let tone = 'neutral';
  switch (status) {
    case 'draft':
      tone = 'neutral';
      break;
    case 'pending_approval':
      tone = 'warning';
      break;
    case 'approved':
      tone = 'success';
      break;
    case 'archived':
      tone = 'danger';
      break;
    default:
      tone = 'neutral';
  }
  return <StatusPill tone={tone}>{t(`providerPayments.commission.status.${status}`)}</StatusPill>;
}

CommissionStatusPill.propTypes = {
  status: PropTypes.string.isRequired
};

function PaymentListItem({ payment, onView, onEdit, onMarkPaid, onDelete }) {
  const { t, format } = useLocale();
  const dueLabel = payment.dueDate ? format.date(payment.dueDate) : t('providerPayments.payments.noDue');
  const amountLabel = format.currency(payment.amount ?? 0, { currency: payment.currency || 'GBP' });
  const commissionLabel = payment.commissionAmount != null
    ? format.currency(payment.commissionAmount, { currency: payment.currency || 'GBP' })
    : payment.commissionRate != null
      ? format.percentage(payment.commissionRate, { maximumFractionDigits: 1 })
      : t('common.notAvailable');

  return (
    <Card padding="lg" className="flex flex-col gap-3" data-qa={`serviceman-payment-${payment.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{payment.serviceman?.name || t('providerPayments.payments.unassigned')}</p>
          <p className="text-xs text-slate-500">{payment.booking?.reference || payment.booking?.id || t('providerPayments.payments.noBooking')}</p>
        </div>
        <PaymentStatusPill status={payment.status} />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span>{amountLabel}</span>
        <span>{commissionLabel}</span>
        <span>{t('providerPayments.payments.dueLabel', { date: dueLabel })}</span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => onView(payment)} icon={EllipsisHorizontalIcon}>
          {t('providerPayments.payments.viewDetails')}
        </Button>
        <Button variant="tertiary" size="sm" onClick={() => onEdit(payment)} icon={PencilSquareIcon}>
          {t('providerPayments.payments.edit')}
        </Button>
        {payment.status !== 'paid' ? (
          <Button variant="secondary" size="sm" onClick={() => onMarkPaid(payment)} icon={DocumentDuplicateIcon}>
            {t('providerPayments.payments.markPaid')}
          </Button>
        ) : null}
        <Button variant="danger" size="sm" onClick={() => onDelete(payment)} icon={TrashIcon}>
          {t('providerPayments.payments.delete')}
        </Button>
      </div>
    </Card>
  );
}

PaymentListItem.propTypes = {
  payment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    serviceman: PropTypes.shape({ name: PropTypes.string }),
    booking: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), reference: PropTypes.string }),
    amount: PropTypes.number,
    currency: PropTypes.string,
    status: PropTypes.string,
    commissionAmount: PropTypes.number,
    commissionRate: PropTypes.number,
    dueDate: PropTypes.string
  }).isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

function CommissionRulesPanel({ rules, defaultRuleId, onCreate, onEdit, onArchive, onSetDefault }) {
  const { t, format } = useLocale();

  return (
    <section className="space-y-4" aria-labelledby="serviceman-commission-rules">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="serviceman-commission-rules" className="text-lg font-semibold text-primary">
            {t('providerPayments.commission.headline')}
          </h3>
          <p className="text-sm text-slate-600">{t('providerPayments.commission.description')}</p>
        </div>
        <Button icon={PlusIcon} onClick={onCreate}>
          {t('providerPayments.commission.addRule')}
        </Button>
      </header>

      {rules.length === 0 ? (
        <Card padding="lg" className="border-dashed text-sm text-slate-500">
          {t('providerPayments.commission.empty')}
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} padding="lg" className="flex flex-col gap-3" data-qa={`commission-rule-${rule.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">{rule.name}</p>
                  <p className="text-xs text-slate-500">{rule.description || t('providerPayments.commission.noDescription')}</p>
                </div>
                <CommissionStatusPill status={rule.approvalStatus ?? 'draft'} />
              </div>
              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {t('providerPayments.commission.rateLabel')}
                  </p>
                  <p className="mt-1 font-medium text-primary">
                    {rule.rateType === 'flat'
                      ? format.currency(rule.rateValue ?? 0)
                      : format.percentage(rule.rateValue ?? 0, { maximumFractionDigits: 1 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {t('providerPayments.commission.appliesTo')}
                  </p>
                  <p className="mt-1 font-medium text-primary">
                    {rule.appliesToRole || t('providerPayments.commission.anyRole')}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {t('providerPayments.commission.serviceCategory')}
                  </p>
                  <p className="mt-1 font-medium text-primary">
                    {rule.serviceCategory || t('providerPayments.commission.anyService')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  {rule.effectiveFrom
                    ? t('providerPayments.commission.effectiveFrom', { date: format.date(rule.effectiveFrom) })
                    : t('providerPayments.commission.effectiveImmediately')}
                </span>
                {rule.effectiveTo
                  ? (
                      <span>
                        {t('providerPayments.commission.effectiveTo', { date: format.date(rule.effectiveTo) })}
                      </span>
                    )
                  : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {defaultRuleId === rule.id ? (
                  <StatusPill tone="success">{t('providerPayments.commission.defaultRule')}</StatusPill>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => onSetDefault(rule)}>
                    {t('providerPayments.commission.setDefault')}
                  </Button>
                )}
                <Button variant="tertiary" size="sm" onClick={() => onEdit(rule)} icon={PencilSquareIcon}>
                  {t('providerPayments.commission.editRule')}
                </Button>
                <Button variant="danger" size="sm" onClick={() => onArchive(rule)} icon={TrashIcon}>
                  {t('providerPayments.commission.archiveRule')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

CommissionRulesPanel.propTypes = {
  rules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ).isRequired,
  defaultRuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onSetDefault: PropTypes.func.isRequired
};

CommissionRulesPanel.defaultProps = {
  defaultRuleId: null
};

export default function ServicemanPaymentsSection({ initialWorkspace, companyId, onRefresh }) {
  const { t, format } = useLocale();
  const [workspace, setWorkspace] = useState(() =>
    initialWorkspace || {
      summary: null,
      upcoming: [],
      history: { items: [], total: 0, limit: HISTORY_PAGE_SIZE, offset: 0 },
      commissions: { rules: [], activeRules: 0, defaultRuleId: null }
    }
  );
  const [filters, setFilters] = useState({ status: 'all', query: '' });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ open: false, payment: null });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [ruleModal, setRuleModal] = useState({ open: false, rule: null });
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleError, setRuleError] = useState(null);
  const [detailPayment, setDetailPayment] = useState(null);

  const resolvedCompanyId = useMemo(
    () => companyId || initialWorkspace?.companyId || workspace?.companyId || null,
    [companyId, initialWorkspace?.companyId, workspace?.companyId]
  );

  useEffect(() => {
    if (!hasFetched && initialWorkspace) {
      setWorkspace(initialWorkspace);
    }
  }, [hasFetched, initialWorkspace]);

  const statusOptions = useMemo(
    () =>
      PAYMENT_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: t(`providerPayments.statusFilter.${status}`)
      })),
    [t]
  );

  useEffect(() => {
    setSearchInput(filters.query || '');
  }, [filters.query]);

  const loadWorkspace = useCallback(
    async ({ offset = 0, appendHistory = false, signal } = {}) => {
      if (!resolvedCompanyId) {
        return;
      }

      if (appendHistory) {
        setHistoryLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getServicemanPaymentsWorkspace({
          companyId: resolvedCompanyId,
          limit: HISTORY_PAGE_SIZE,
          offset,
          status: filters.status !== 'all' ? filters.status : undefined,
          query: filters.query || undefined,
          signal
        });
        setHasFetched(true);
        setWorkspace((current) => {
          if (appendHistory && current) {
            const existingItems = current.history?.items ?? [];
            const existingIds = new Set(existingItems.map((item) => item.id));
            const nextItems = [...existingItems];
            data.history.items.forEach((item) => {
              if (!existingIds.has(item.id)) {
                nextItems.push(item);
              }
            });
            return {
              ...data,
              history: {
                ...data.history,
                items: nextItems
              }
            };
          }
          return data;
        });
      } catch (requestError) {
        if (requestError instanceof PanelApiError && requestError.status === 408 && requestError.cause?.name === 'AbortError') {
          return;
        }
        setError(requestError);
      } finally {
        if (appendHistory) {
          setHistoryLoading(false);
        } else {
          setLoading(false);
        }
      }
    },
    [filters.query, filters.status, resolvedCompanyId]
  );

  useEffect(() => {
    if (!resolvedCompanyId) {
      return undefined;
    }

    const controller = new AbortController();
    loadWorkspace({ signal: controller.signal });
    return () => controller.abort();
  }, [loadWorkspace, resolvedCompanyId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, query: searchInput.trim() }));
  };

  const handleStatusChange = (value) => {
    setFilters((current) => ({ ...current, status: value }));
  };

  const handleResetFilters = () => {
    setFilters({ status: 'all', query: '' });
  };

  const handleCreatePayment = () => {
    setPaymentError(null);
    setPaymentModal({ open: true, payment: null });
  };

  const handleEditPayment = (payment) => {
    setPaymentError(null);
    setPaymentModal({ open: true, payment });
  };

  const handleSavePayment = async (payload) => {
    if (!resolvedCompanyId) {
      return;
    }

    setPaymentSaving(true);
    setPaymentError(null);
    try {
      if (paymentModal.payment?.id) {
        await updateServicemanPayment(paymentModal.payment.id, payload, { companyId: resolvedCompanyId });
      } else {
        await createServicemanPayment(payload, { companyId: resolvedCompanyId });
      }
      setPaymentModal({ open: false, payment: null });
      await loadWorkspace();
      onRefresh?.();
    } catch (mutationError) {
      setPaymentError(mutationError.message || t('providerPayments.errors.generic'));
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (!resolvedCompanyId) {
      return;
    }
    const confirmed = window.confirm(t('providerPayments.payments.deleteConfirm', { reference: payment.booking?.reference || payment.id }));
    if (!confirmed) {
      return;
    }

    try {
      await deleteServicemanPayment(payment.id, { companyId: resolvedCompanyId });
      await loadWorkspace();
      onRefresh?.();
    } catch (mutationError) {
      setError(mutationError);
    }
  };

  const handleMarkPaid = async (payment) => {
    if (!resolvedCompanyId) {
      return;
    }
    try {
      await updateServicemanPayment(payment.id, { status: 'paid', paidAt: new Date().toISOString() }, { companyId: resolvedCompanyId });
      await loadWorkspace();
      onRefresh?.();
    } catch (mutationError) {
      setError(mutationError);
    }
  };

  const handleCreateRule = () => {
    setRuleError(null);
    setRuleModal({ open: true, rule: null });
  };

  const handleEditRule = (rule) => {
    setRuleError(null);
    setRuleModal({ open: true, rule });
  };

  const handleSaveRule = async (payload) => {
    if (!resolvedCompanyId) {
      return;
    }
    setRuleSaving(true);
    setRuleError(null);
    try {
      if (ruleModal.rule?.id) {
        await updateServicemanCommissionRule(ruleModal.rule.id, payload, { companyId: resolvedCompanyId });
      } else {
        await createServicemanCommissionRule(payload, { companyId: resolvedCompanyId });
      }
      setRuleModal({ open: false, rule: null });
      await loadWorkspace();
      onRefresh?.();
    } catch (mutationError) {
      setRuleError(mutationError.message || t('providerPayments.errors.generic'));
    } finally {
      setRuleSaving(false);
    }
  };

  const handleArchiveRule = async (rule) => {
    if (!resolvedCompanyId) {
      return;
    }
    const confirmed = window.confirm(t('providerPayments.commission.archiveConfirm', { name: rule.name }));
    if (!confirmed) {
      return;
    }

    try {
      await archiveServicemanCommissionRule(rule.id, { companyId: resolvedCompanyId });
      await loadWorkspace();
      onRefresh?.();
    } catch (mutationError) {
      setError(mutationError);
    }
  };

  const handleSetDefaultRule = async (rule) => {
    if (!resolvedCompanyId) {
      return;
    }

    try {
      await updateServicemanCommissionRule(rule.id, { isDefault: true, approvalStatus: 'approved' }, { companyId: resolvedCompanyId });
      await loadWorkspace();
      onRefresh?.();
    } catch (mutationError) {
      setError(mutationError);
    }
  };

  const handleLoadMoreHistory = () => {
    if (historyLoading) {
      return;
    }
    loadWorkspace({ offset: workspace.history.items.length, appendHistory: true });
  };

  const hasMoreHistory = workspace.history.items.length < (workspace.history.total ?? workspace.history.items.length);

  const statusSummary = workspace.summary;

  return (
    <section id="provider-dashboard-serviceman-payments" aria-labelledby="provider-dashboard-serviceman-payments-title" className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="provider-dashboard-serviceman-payments-title" className="text-lg font-semibold text-primary">
            {t('providerPayments.headline')}
          </h2>
          <p className="text-sm text-slate-600">{t('providerPayments.description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={PlusIcon} onClick={handleCreatePayment}>
            {t('providerPayments.actions.recordPayment')}
          </Button>
          <Button variant="secondary" icon={ArrowPathIcon} onClick={() => loadWorkspace({})}>
            {t('providerPayments.actions.refresh')}
          </Button>
        </div>
      </header>

      {loading && !hasFetched ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : (
        <ServicemanPaymentsSummary summary={statusSummary} />
      )}

      <Card padding="lg" className="space-y-4" data-qa="serviceman-payments-filters">
        <form className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" onSubmit={handleSearchSubmit}>
          <div className="flex flex-1 items-center gap-3">
            <TextInput
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('providerPayments.filters.searchPlaceholder')}
            />
            <Button type="submit" variant="secondary">
              {t('providerPayments.filters.apply')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filters.status} onChange={handleStatusChange} options={statusOptions} />
            <Button type="button" variant="ghost" onClick={handleResetFilters}>
              {t('providerPayments.filters.reset')}
            </Button>
          </div>
        </form>
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-600" role="alert">
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            <span>{error.message || t('providerPayments.errors.generic')}</span>
          </div>
        ) : null}
      </Card>

      <section className="space-y-4" aria-labelledby="serviceman-payments-upcoming">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="serviceman-payments-upcoming" className="text-lg font-semibold text-primary">
            {t('providerPayments.upcoming.headline')}
          </h3>
          <p className="text-sm text-slate-500">{t('providerPayments.upcoming.caption', { count: workspace.upcoming.length })}</p>
        </header>
        {loading && hasFetched ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : workspace.upcoming.length === 0 ? (
          <Card padding="lg" className="border-dashed text-sm text-slate-500">
            {t('providerPayments.upcoming.empty')}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspace.upcoming.map((payment) => (
              <PaymentListItem
                key={payment.id}
                payment={payment}
                onView={setDetailPayment}
                onEdit={handleEditPayment}
                onMarkPaid={handleMarkPaid}
                onDelete={handleDeletePayment}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="serviceman-payments-history">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="serviceman-payments-history" className="text-lg font-semibold text-primary">
            {t('providerPayments.history.headline')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('providerPayments.history.caption', { total: workspace.history.total ?? workspace.history.items.length })}
          </p>
        </header>
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <th className="px-4 py-3">{t('providerPayments.history.serviceman')}</th>
                <th className="px-4 py-3">{t('providerPayments.history.booking')}</th>
                <th className="px-4 py-3">{t('providerPayments.history.amount')}</th>
                <th className="px-4 py-3">{t('providerPayments.history.due')}</th>
                <th className="px-4 py-3">{t('providerPayments.history.status')}</th>
                <th className="px-4 py-3">{t('providerPayments.history.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {workspace.history.items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                    {t('providerPayments.history.empty')}
                  </td>
                </tr>
              ) : (
                workspace.history.items.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary">{payment.serviceman?.name || t('providerPayments.payments.unassigned')}</div>
                      <div className="text-xs text-slate-400">{payment.serviceman?.role || t('providerPayments.payments.noRole')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{payment.booking?.reference || payment.booking?.id || t('providerPayments.payments.noBooking')}</div>
                      <div className="text-xs text-slate-400">{payment.booking?.service || t('providerPayments.payments.noService')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary">
                        {format.currency(payment.amount ?? 0, { currency: payment.currency || 'GBP' })}
                      </div>
                      {payment.commissionAmount != null ? (
                        <div className="text-xs text-slate-400">
                          {t('providerPayments.history.commissionAmount', {
                            value: format.currency(payment.commissionAmount, { currency: payment.currency || 'GBP' })
                          })}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div>{payment.dueDate ? format.date(payment.dueDate) : t('providerPayments.payments.noDue')}</div>
                      {payment.paidAt ? (
                        <div className="text-xs text-slate-400">
                          {t('providerPayments.history.paidAt', { date: format.date(payment.paidAt) })}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusPill status={payment.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setDetailPayment(payment)}>
                          {t('providerPayments.payments.view')}
                        </Button>
                        <Button variant="tertiary" size="sm" onClick={() => handleEditPayment(payment)}>
                          {t('providerPayments.payments.edit')}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeletePayment(payment)}>
                          {t('providerPayments.payments.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasMoreHistory ? (
          <div className="flex justify-center">
            <Button onClick={handleLoadMoreHistory} loading={historyLoading} variant="secondary">
              {t('providerPayments.history.loadMore')}
            </Button>
          </div>
        ) : null}
      </section>

      <CommissionRulesPanel
        rules={workspace.commissions.rules}
        defaultRuleId={workspace.commissions.defaultRuleId}
        onCreate={handleCreateRule}
        onEdit={handleEditRule}
        onArchive={handleArchiveRule}
        onSetDefault={handleSetDefaultRule}
      />

      <Modal
        open={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, payment: null })}
        title={
          paymentModal.payment
            ? t('providerPayments.modals.editPaymentTitle', { name: paymentModal.payment.serviceman?.name ?? '' })
            : t('providerPayments.modals.createPaymentTitle')
        }
        size="lg"
      >
        <ServicemanPaymentForm
          initialValue={paymentModal.payment || {}}
          onSubmit={handleSavePayment}
          onCancel={() => setPaymentModal({ open: false, payment: null })}
          saving={paymentSaving}
          error={paymentError}
        />
      </Modal>

      <Modal
        open={ruleModal.open}
        onClose={() => setRuleModal({ open: false, rule: null })}
        title={ruleModal.rule ? t('providerPayments.modals.editRuleTitle', { name: ruleModal.rule.name }) : t('providerPayments.modals.createRuleTitle')}
        size="lg"
      >
        <ServicemanCommissionRuleForm
          initialValue={ruleModal.rule || {}}
          onSubmit={handleSaveRule}
          onCancel={() => setRuleModal({ open: false, rule: null })}
          saving={ruleSaving}
          error={ruleError}
        />
      </Modal>

      <Modal
        open={Boolean(detailPayment)}
        onClose={() => setDetailPayment(null)}
        title={t('providerPayments.modals.paymentDetailTitle', {
          name: detailPayment?.serviceman?.name || t('providerPayments.payments.unassigned')
        })}
        size="md"
      >
        {detailPayment ? (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="grid gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerPayments.detail.amount')}</p>
                <p className="text-lg font-semibold text-primary">
                  {format.currency(detailPayment.amount ?? 0, { currency: detailPayment.currency || 'GBP' })}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerPayments.detail.status')}</p>
                <PaymentStatusPill status={detailPayment.status} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerPayments.detail.booking')}</p>
              <p className="font-medium text-primary">
                {detailPayment.booking?.reference || detailPayment.booking?.id || t('providerPayments.payments.noBooking')}
              </p>
              <p className="text-xs text-slate-500">{detailPayment.booking?.service || t('providerPayments.payments.noService')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerPayments.detail.dates')}</p>
              <p>
                {t('providerPayments.detail.dueOn', {
                  date: detailPayment.dueDate ? format.date(detailPayment.dueDate) : t('providerPayments.payments.noDue')
                })}
              </p>
              {detailPayment.paidAt ? (
                <p>{t('providerPayments.detail.paidOn', { date: format.date(detailPayment.paidAt) })}</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerPayments.detail.commission')}</p>
              <p>
                {detailPayment.commissionAmount != null
                  ? t('providerPayments.detail.commissionAmount', {
                      amount: format.currency(detailPayment.commissionAmount, { currency: detailPayment.currency || 'GBP' })
                    })
                  : detailPayment.commissionRate != null
                    ? t('providerPayments.detail.commissionRate', {
                        rate: format.percentage(detailPayment.commissionRate, { maximumFractionDigits: 1 })
                      })
                    : t('providerPayments.detail.commissionNone')}
              </p>
              {detailPayment.commissionRule ? (
                <p className="text-xs text-slate-500">
                  {t('providerPayments.detail.commissionRule', { name: detailPayment.commissionRule.name })}
                </p>
              ) : null}
            </div>
            {detailPayment.notes ? (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerPayments.detail.notes')}</p>
                <p>{detailPayment.notes}</p>
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="tertiary" onClick={() => handleEditPayment(detailPayment)}>
                {t('providerPayments.payments.edit')}
              </Button>
              {detailPayment.status !== 'paid' ? (
                <Button variant="secondary" onClick={() => handleMarkPaid(detailPayment)}>
                  {t('providerPayments.payments.markPaid')}
                </Button>
              ) : null}
              <Button variant="danger" onClick={() => handleDeletePayment(detailPayment)}>
                {t('providerPayments.payments.delete')}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

ServicemanPaymentsSection.propTypes = {
  initialWorkspace: PropTypes.shape({
    companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    summary: PropTypes.object,
    upcoming: PropTypes.array,
    history: PropTypes.shape({
      items: PropTypes.array,
      total: PropTypes.number,
      limit: PropTypes.number,
      offset: PropTypes.number
    }),
    commissions: PropTypes.shape({
      rules: PropTypes.array,
      defaultRuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  }),
  companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func
};

ServicemanPaymentsSection.defaultProps = {
  initialWorkspace: null,
  companyId: null,
  onRefresh: undefined
};

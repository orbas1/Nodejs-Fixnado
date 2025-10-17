import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchFinanceWorkspace,
  updateFinanceProfile,
  listFinanceEarnings,
  createFinanceEarning,
  updateFinanceEarning,
  updateFinanceEarningStatus,
  listFinanceExpenses,
  createFinanceExpense,
  updateFinanceExpense,
  updateFinanceExpenseStatus,
  listFinanceAllowances,
  upsertFinanceAllowance,
  deleteFinanceAllowance
} from '../../../api/servicemanFinanceClient.js';

const DEFAULT_PROFILE = Object.freeze({
  currency: 'GBP',
  baseHourlyRate: 0,
  overtimeRate: null,
  calloutFee: null,
  mileageRate: null,
  payoutMethod: 'wallet',
  payoutSchedule: 'weekly',
  taxRate: null,
  taxIdentifier: null,
  payoutInstructions: null,
  bankAccount: {}
});

const DEFAULT_EARNINGS = Object.freeze({ items: [], meta: { total: 0, outstanding: 0, payable: 0, paid: 0 } });
const DEFAULT_EXPENSES = Object.freeze({ items: [], meta: { total: 0, awaitingReimbursement: 0, reimbursed: 0 } });
const DEFAULT_ALLOWANCES = Object.freeze({ items: [] });

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload);

const toNumber = (value, fallback = null) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildProfileDraft = (profile = {}) => ({
  currency: profile.currency ?? DEFAULT_PROFILE.currency,
  baseHourlyRate: profile.baseHourlyRate != null ? String(profile.baseHourlyRate) : '0',
  overtimeRate: profile.overtimeRate != null ? String(profile.overtimeRate) : '',
  calloutFee: profile.calloutFee != null ? String(profile.calloutFee) : '',
  mileageRate: profile.mileageRate != null ? String(profile.mileageRate) : '',
  payoutMethod: profile.payoutMethod ?? DEFAULT_PROFILE.payoutMethod,
  payoutSchedule: profile.payoutSchedule ?? DEFAULT_PROFILE.payoutSchedule,
  taxRate: profile.taxRate != null ? String(profile.taxRate) : '',
  taxIdentifier: profile.taxIdentifier ?? '',
  payoutInstructions: profile.payoutInstructions ?? '',
  bankAccount: {
    accountName: profile.bankAccount?.accountName ?? '',
    accountNumber: profile.bankAccount?.accountNumber ?? '',
    sortCode: profile.bankAccount?.sortCode ?? '',
    iban: profile.bankAccount?.iban ?? '',
    bic: profile.bankAccount?.bic ?? ''
  }
});

const buildProfilePayload = (draft) => ({
  currency: (draft.currency || DEFAULT_PROFILE.currency).toUpperCase(),
  baseHourlyRate: toNumber(draft.baseHourlyRate, 0),
  overtimeRate: toNumber(draft.overtimeRate),
  calloutFee: toNumber(draft.calloutFee),
  mileageRate: toNumber(draft.mileageRate),
  payoutMethod: draft.payoutMethod || DEFAULT_PROFILE.payoutMethod,
  payoutSchedule: draft.payoutSchedule || DEFAULT_PROFILE.payoutSchedule,
  taxRate: toNumber(draft.taxRate),
  taxIdentifier: draft.taxIdentifier ? draft.taxIdentifier.trim() : null,
  payoutInstructions: draft.payoutInstructions ? draft.payoutInstructions.trim() : null,
  bankAccount: {
    accountName: draft.bankAccount?.accountName?.trim() || null,
    accountNumber: draft.bankAccount?.accountNumber?.trim() || null,
    sortCode: draft.bankAccount?.sortCode?.trim() || null,
    iban: draft.bankAccount?.iban?.trim() || null,
    bic: draft.bankAccount?.bic?.trim() || null
  }
});

const normaliseWorkspace = (snapshot = {}) => ({
  context: snapshot.context ?? { servicemanId: null, serviceman: null },
  profile: snapshot.profile ?? DEFAULT_PROFILE,
  summary: snapshot.summary ?? { earnings: { total: 0 }, expenses: { total: 0 }, allowances: { active: 0, inactive: 0 } },
  earnings: snapshot.earnings ?? DEFAULT_EARNINGS,
  expenses: snapshot.expenses ?? DEFAULT_EXPENSES,
  allowances: snapshot.allowances ?? DEFAULT_ALLOWANCES,
  documents: snapshot.documents ?? { receipts: [] },
  permissions: snapshot.permissions ?? {
    canManagePayments: false,
    canSubmitExpenses: false,
    canManageAllowances: false
  }
});

export function useServicemanFinanceState(initialSnapshot = {}) {
  const normalised = useMemo(() => normaliseWorkspace(initialSnapshot), [initialSnapshot]);
  const servicemanId = normalised.context?.servicemanId ?? null;

  const [workspace, setWorkspace] = useState(normalised);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [profileDraft, setProfileDraft] = useState(() => buildProfileDraft(normalised.profile));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [earnings, setEarnings] = useState(normalised.earnings ?? DEFAULT_EARNINGS);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState(null);
  const [earningsFilters, setEarningsFilters] = useState({ status: 'all', search: '' });

  const [expenses, setExpenses] = useState(normalised.expenses ?? DEFAULT_EXPENSES);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState(null);
  const [expensesFilters, setExpensesFilters] = useState({ status: 'all' });

  const [allowances, setAllowances] = useState(normalised.allowances ?? DEFAULT_ALLOWANCES);
  const [allowancesLoading, setAllowancesLoading] = useState(false);
  const [allowancesError, setAllowancesError] = useState(null);

  useEffect(() => {
    setWorkspace(normalised);
    setEarnings(normalised.earnings ?? DEFAULT_EARNINGS);
    setExpenses(normalised.expenses ?? DEFAULT_EXPENSES);
    setAllowances(normalised.allowances ?? DEFAULT_ALLOWANCES);
    setProfileDraft(buildProfileDraft(normalised.profile));
  }, [normalised]);

  const refreshWorkspace = useCallback(
    async ({ limit = 10 } = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFinanceWorkspace({ servicemanId, limit });
        const data = unwrap(response);
        const nextWorkspace = normaliseWorkspace(data);
        setWorkspace(nextWorkspace);
        setEarnings(nextWorkspace.earnings ?? DEFAULT_EARNINGS);
        setExpenses(nextWorkspace.expenses ?? DEFAULT_EXPENSES);
        setAllowances(nextWorkspace.allowances ?? DEFAULT_ALLOWANCES);
        setProfileDraft(buildProfileDraft(nextWorkspace.profile));
        return { status: 'resolved', data: nextWorkspace };
      } catch (caught) {
        console.warn('Failed to refresh serviceman finance workspace', caught);
        setError(caught);
        return { status: 'error', error: caught };
      } finally {
        setLoading(false);
      }
    },
    [servicemanId]
  );

  const saveProfile = useCallback(
    async (draft) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setProfileSaving(true);
      setProfileFeedback(null);
      setProfileError(null);
      try {
        const payload = buildProfilePayload(draft ?? profileDraft);
        const response = await updateFinanceProfile(payload, { servicemanId });
        const updated = unwrap(response);
        setWorkspace((current) => ({ ...current, profile: updated }));
        setProfileDraft(buildProfileDraft(updated));
        setProfileFeedback('Profile saved');
        return { status: 'resolved', profile: updated };
      } catch (caught) {
        console.error('Failed to update serviceman profile', caught);
        setProfileError(caught);
        return { status: 'error', error: caught };
      } finally {
        setProfileSaving(false);
      }
    },
    [profileDraft, servicemanId]
  );

  const loadEarnings = useCallback(
    async (overrides = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setEarningsLoading(true);
      setEarningsError(null);
      try {
        const params = {
          servicemanId,
          status: overrides.status ?? earningsFilters.status,
          search: overrides.search ?? earningsFilters.search,
          limit: overrides.limit ?? 25,
          offset: overrides.offset ?? 0
        };
        const response = await listFinanceEarnings(params);
        setEarnings({
          items: Array.isArray(response?.data) ? response.data : [],
          meta: response?.meta ?? {}
        });
        return { status: 'resolved', data: response };
      } catch (caught) {
        console.error('Failed to load earnings', caught);
        setEarningsError(caught);
        return { status: 'error', error: caught };
      } finally {
        setEarningsLoading(false);
      }
    },
    [earningsFilters, servicemanId]
  );

  const createEarning = useCallback(
    async (payload) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await createFinanceEarning(payload, { servicemanId });
      await Promise.all([loadEarnings(), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadEarnings, refreshWorkspace, servicemanId]
  );

  const updateEarningRecord = useCallback(
    async (earningId, payload) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await updateFinanceEarning(earningId, payload, { servicemanId });
      await Promise.all([loadEarnings(), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadEarnings, refreshWorkspace, servicemanId]
  );

  const changeEarningStatus = useCallback(
    async (earningId, status) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await updateFinanceEarningStatus(earningId, { status }, { servicemanId });
      await Promise.all([loadEarnings(), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadEarnings, refreshWorkspace, servicemanId]
  );

  const loadExpenses = useCallback(
    async (overrides = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setExpensesLoading(true);
      setExpensesError(null);
      try {
        const params = {
          servicemanId,
          status: overrides.status ?? expensesFilters.status,
          limit: overrides.limit ?? 25,
          offset: overrides.offset ?? 0
        };
        const response = await listFinanceExpenses(params);
        setExpenses({
          items: Array.isArray(response?.data) ? response.data : [],
          meta: response?.meta ?? {}
        });
        return { status: 'resolved', data: response };
      } catch (caught) {
        console.error('Failed to load expenses', caught);
        setExpensesError(caught);
        return { status: 'error', error: caught };
      } finally {
        setExpensesLoading(false);
      }
    },
    [expensesFilters, servicemanId]
  );

  const createExpense = useCallback(
    async (payload) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await createFinanceExpense(payload, { servicemanId });
      await Promise.all([loadExpenses(), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadExpenses, refreshWorkspace, servicemanId]
  );

  const updateExpenseRecord = useCallback(
    async (expenseId, payload) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await updateFinanceExpense(expenseId, payload, { servicemanId });
      await Promise.all([loadExpenses(), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadExpenses, refreshWorkspace, servicemanId]
  );

  const changeExpenseStatus = useCallback(
    async (expenseId, status) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await updateFinanceExpenseStatus(expenseId, { status }, { servicemanId });
      await Promise.all([loadExpenses(), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadExpenses, refreshWorkspace, servicemanId]
  );

  const loadAllowances = useCallback(
    async ({ includeInactive = true } = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setAllowancesLoading(true);
      setAllowancesError(null);
      try {
        const response = await listFinanceAllowances(
          { servicemanId, includeInactive },
          {}
        );
        const items = Array.isArray(response?.data) ? response.data : [];
        setAllowances({ items });
        return { status: 'resolved', data: items };
      } catch (caught) {
        console.error('Failed to load allowances', caught);
        setAllowancesError(caught);
        return { status: 'error', error: caught };
      } finally {
        setAllowancesLoading(false);
      }
    },
    [servicemanId]
  );

  const saveAllowance = useCallback(
    async (payload) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await upsertFinanceAllowance(payload, { servicemanId });
      await Promise.all([loadAllowances({ includeInactive: true }), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadAllowances, refreshWorkspace, servicemanId]
  );

  const removeAllowance = useCallback(
    async (allowanceId) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      await deleteFinanceAllowance(allowanceId, { servicemanId });
      await Promise.all([loadAllowances({ includeInactive: true }), refreshWorkspace()]);
      return { status: 'resolved' };
    },
    [loadAllowances, refreshWorkspace, servicemanId]
  );

  return {
    context: { servicemanId, serviceman: workspace.context?.serviceman ?? null },
    workspace,
    loading,
    error,
    refreshWorkspace,
    profile: {
      draft: profileDraft,
      setDraft: setProfileDraft,
      saving: profileSaving,
      feedback: profileFeedback,
      error: profileError,
      save: saveProfile
    },
    earnings: {
      ...earnings,
      loading: earningsLoading,
      error: earningsError,
      filters: earningsFilters,
      setFilters: setEarningsFilters,
      reload: loadEarnings,
      create: createEarning,
      update: updateEarningRecord,
      updateStatus: changeEarningStatus
    },
    expenses: {
      ...expenses,
      loading: expensesLoading,
      error: expensesError,
      filters: expensesFilters,
      setFilters: setExpensesFilters,
      reload: loadExpenses,
      create: createExpense,
      update: updateExpenseRecord,
      updateStatus: changeExpenseStatus
    },
    allowances: {
      ...allowances,
      loading: allowancesLoading,
      error: allowancesError,
      reload: loadAllowances,
      save: saveAllowance,
      remove: removeAllowance
    }
  };
}

export default useServicemanFinanceState;

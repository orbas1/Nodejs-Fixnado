import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getProviderStorefrontWorkspace,
  updateProviderStorefrontSettings,
  createProviderStorefrontInventory,
  updateProviderStorefrontInventory,
  archiveProviderStorefrontInventory,
  createProviderStorefrontCoupon,
  updateProviderStorefrontCoupon,
  updateProviderStorefrontCouponStatus,
  PanelApiError
} from '../../../api/panelClient.js';

const EMPTY_WORKSPACE = Object.freeze({
  storefront: {
    id: null,
    companyId: null,
    name: '',
    slug: '',
    tagline: '',
    description: '',
    heroImageUrl: '',
    contactEmail: '',
    contactPhone: '',
    primaryColor: '#0f172a',
    accentColor: '#38bdf8',
    status: 'draft',
    isPublished: false,
    publishedAt: null,
    reviewRequired: false,
    metadata: {}
  },
  inventory: [],
  coupons: [],
  inventoryMeta: { total: 0, published: 0, archived: 0, lowStock: 0 },
  couponMeta: { total: 0, active: 0, expiringSoon: 0 }
});

function computeInventoryMeta(inventory) {
  const total = inventory.length;
  const published = inventory.filter((item) => item.visibility === 'public').length;
  const archived = inventory.filter((item) => item.visibility === 'archived').length;
  const lowStock = inventory.filter((item) => item.stockOnHand <= item.reorderPoint).length;
  return { total, published, archived, lowStock };
}

function computeCouponMeta(coupons) {
  const total = coupons.length;
  const active = coupons.filter((coupon) => coupon.status === 'active').length;
  const expiringSoon = coupons.filter((coupon) => {
    if (!coupon.endsAt) {
      return false;
    }
    const end = new Date(coupon.endsAt);
    if (Number.isNaN(end.getTime())) {
      return false;
    }
    const diffDays = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= -1;
  }).length;
  return { total, active, expiringSoon };
}

export function useStorefrontManagementState({ role = 'company', persona = 'provider', companyId = null } = {}) {
  const resolvedRole = role === 'admin' ? 'admin' : 'company';
  const resolvedPersona = role === 'admin' ? 'admin' : persona || 'provider';

  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });
  const [savingSettings, setSavingSettings] = useState(false);
  const [inventoryMutation, setInventoryMutation] = useState(null);
  const [couponMutation, setCouponMutation] = useState(null);

  const loadWorkspace = useCallback(
    async ({ forceRefresh = false } = {}) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await getProviderStorefrontWorkspace({
          companyId,
          role: resolvedRole,
          persona: resolvedPersona,
          forceRefresh
        });
        setState({ loading: false, data: response.data, meta: response.meta, error: null });
        return response;
      } catch (error) {
        const fallbackError = error instanceof PanelApiError ? error : new PanelApiError('Unable to load storefront', 500, { cause: error });
        setState((current) => ({ ...current, loading: false, error: fallbackError }));
        return { error: fallbackError };
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const data = state.data ?? EMPTY_WORKSPACE;
  const meta = state.meta ?? { companyId, generatedAt: null };

  const saveSettings = useCallback(
    async (payload) => {
      setSavingSettings(true);
      try {
        const updated = await updateProviderStorefrontSettings(payload, {
          companyId,
          role: resolvedRole,
          persona: resolvedPersona
        });
        setState((current) => {
          const currentData = current.data ?? EMPTY_WORKSPACE;
          const nextStorefront = { ...currentData.storefront, ...updated };
          return {
            ...current,
            data: { ...currentData, storefront: nextStorefront },
            error: null
          };
        });
        return { status: 'success', storefront: updated };
      } catch (error) {
        const failure = error instanceof PanelApiError ? error : new PanelApiError('Unable to update storefront', 500, { cause: error });
        setState((current) => ({ ...current, error: failure }));
        throw failure;
      } finally {
        setSavingSettings(false);
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  const createInventory = useCallback(
    async (payload) => {
      setInventoryMutation('create');
      try {
        const created = await createProviderStorefrontInventory(payload, {
          companyId,
          role: resolvedRole,
          persona: resolvedPersona
        });
        setState((current) => {
          const currentData = current.data ?? EMPTY_WORKSPACE;
          const inventory = [created, ...currentData.inventory];
          return {
            ...current,
            data: {
              ...currentData,
              inventory,
              inventoryMeta: computeInventoryMeta(inventory)
            },
            error: null
          };
        });
        return created;
      } catch (error) {
        const failure = error instanceof PanelApiError ? error : new PanelApiError('Unable to create inventory item', 500, { cause: error });
        setState((current) => ({ ...current, error: failure }));
        throw failure;
      } finally {
        setInventoryMutation(null);
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  const updateInventory = useCallback(
    async (inventoryId, payload) => {
      if (!inventoryId) {
        throw new PanelApiError('Inventory identifier required', 400);
      }
      setInventoryMutation(inventoryId);
      try {
        const updated = await updateProviderStorefrontInventory(inventoryId, payload, {
          companyId,
          role: resolvedRole,
          persona: resolvedPersona
        });
        setState((current) => {
          const currentData = current.data ?? EMPTY_WORKSPACE;
          const inventory = currentData.inventory.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
          return {
            ...current,
            data: {
              ...currentData,
              inventory,
              inventoryMeta: computeInventoryMeta(inventory)
            },
            error: null
          };
        });
        return updated;
      } catch (error) {
        const failure = error instanceof PanelApiError ? error : new PanelApiError('Unable to update inventory item', 500, { cause: error });
        setState((current) => ({ ...current, error: failure }));
        throw failure;
      } finally {
        setInventoryMutation(null);
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  const archiveInventory = useCallback(
    async (inventoryId) => {
      if (!inventoryId) {
        throw new PanelApiError('Inventory identifier required', 400);
      }
      setInventoryMutation(inventoryId);
      try {
        await archiveProviderStorefrontInventory(inventoryId, {
          companyId,
          role: resolvedRole,
          persona: resolvedPersona
        });
        setState((current) => {
          const currentData = current.data ?? EMPTY_WORKSPACE;
          const inventory = currentData.inventory.map((item) =>
            item.id === inventoryId ? { ...item, visibility: 'archived' } : item
          );
          return {
            ...current,
            data: {
              ...currentData,
              inventory,
              inventoryMeta: computeInventoryMeta(inventory)
            },
            error: null
          };
        });
        return { status: 'archived' };
      } catch (error) {
        const failure = error instanceof PanelApiError ? error : new PanelApiError('Unable to archive inventory item', 500, { cause: error });
        setState((current) => ({ ...current, error: failure }));
        throw failure;
      } finally {
        setInventoryMutation(null);
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  const createCoupon = useCallback(
    async (payload) => {
      setCouponMutation('create');
      try {
        const created = await createProviderStorefrontCoupon(payload, {
          companyId,
          role: resolvedRole,
          persona: resolvedPersona
        });
        setState((current) => {
          const currentData = current.data ?? EMPTY_WORKSPACE;
          const coupons = [created, ...currentData.coupons];
          return {
            ...current,
            data: {
              ...currentData,
              coupons,
              couponMeta: computeCouponMeta(coupons)
            },
            error: null
          };
        });
        return created;
      } catch (error) {
        const failure = error instanceof PanelApiError ? error : new PanelApiError('Unable to create coupon', 500, { cause: error });
        setState((current) => ({ ...current, error: failure }));
        throw failure;
      } finally {
        setCouponMutation(null);
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  const updateCoupon = useCallback(
    async (couponId, payload) => {
      if (!couponId) {
        throw new PanelApiError('Coupon identifier required', 400);
      }
      setCouponMutation(couponId);
      try {
        const updated = await updateProviderStorefrontCoupon(couponId, payload, {
          companyId,
          role: resolvedRole,
          persona: resolvedPersona
        });
        setState((current) => {
          const currentData = current.data ?? EMPTY_WORKSPACE;
          const coupons = currentData.coupons.map((coupon) => (coupon.id === updated.id ? { ...coupon, ...updated } : coupon));
          return {
            ...current,
            data: {
              ...currentData,
              coupons,
              couponMeta: computeCouponMeta(coupons)
            },
            error: null
          };
        });
        return updated;
      } catch (error) {
        const failure = error instanceof PanelApiError ? error : new PanelApiError('Unable to update coupon', 500, { cause: error });
        setState((current) => ({ ...current, error: failure }));
        throw failure;
      } finally {
        setCouponMutation(null);
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  const updateCouponStatus = useCallback(
    async (couponId, status) => {
      if (!couponId) {
        throw new PanelApiError('Coupon identifier required', 400);
      }
      setCouponMutation(couponId);
      try {
        await updateProviderStorefrontCouponStatus(couponId, status, {
          companyId,
          role: resolvedRole,
          persona: resolvedPersona
        });
        setState((current) => {
          const currentData = current.data ?? EMPTY_WORKSPACE;
          const coupons = currentData.coupons.map((coupon) =>
            coupon.id === couponId ? { ...coupon, status } : coupon
          );
          return {
            ...current,
            data: {
              ...currentData,
              coupons,
              couponMeta: computeCouponMeta(coupons)
            },
            error: null
          };
        });
        return { status };
      } catch (error) {
        const failure = error instanceof PanelApiError ? error : new PanelApiError('Unable to update coupon status', 500, { cause: error });
        setState((current) => ({ ...current, error: failure }));
        throw failure;
      } finally {
        setCouponMutation(null);
      }
    },
    [companyId, resolvedPersona, resolvedRole]
  );

  const actions = useMemo(
    () => ({
      refresh: ({ forceRefresh = true } = {}) => loadWorkspace({ forceRefresh }),
      saveSettings,
      createInventory,
      updateInventory,
      archiveInventory,
      createCoupon,
      updateCoupon,
      updateCouponStatus
    }),
    [archiveInventory, createCoupon, createInventory, loadWorkspace, saveSettings, updateCoupon, updateCouponStatus, updateInventory]
  );

  return {
    data,
    meta,
    error: state.error,
    status: {
      loading: state.loading,
      savingSettings,
      inventoryMutation,
      couponMutation
    },
    actions
  };
}

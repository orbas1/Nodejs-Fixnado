import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  listAssets,
  createAsset,
  updateAsset,
  getAvailability,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../../api/toolRentalClient.js';
import {
  listRentals,
  createRental,
  approveRental,
  scheduleRentalPickup,
  checkoutRental,
  markRentalReturned,
  completeRentalInspection,
  cancelRental,
  updateRentalDeposit
} from '../../api/rentalClient.js';

const ToolRentalContext = createContext(null);

const defaultState = {
  assets: [],
  selectedAssetId: null,
  rentals: [],
  coupons: [],
  availability: { asset: null, totalQuantity: 0, timeline: [] },
  loading: { assets: false, rentals: false, coupons: false, availability: false, action: null },
  errors: {}
};

export function ToolRentalProvider({ companyId, children }) {
  const [state, setState] = useState(defaultState);

  const setLoading = useCallback((key, value) => {
    setState((current) => ({
      ...current,
      loading: { ...current.loading, [key]: value }
    }));
  }, []);

  const setError = useCallback((key, error) => {
    setState((current) => ({
      ...current,
      errors: { ...current.errors, [key]: error }
    }));
  }, []);

  const loadAssets = useCallback(async () => {
    if (!companyId) return;
    setLoading('assets', true);
    setError('assets', null);
    try {
      const response = await listAssets({ companyId });
      const assets = Array.isArray(response?.assets) ? response.assets : [];
      setState((current) => ({
        ...current,
        assets,
        selectedAssetId: current.selectedAssetId && assets.find((asset) => asset.id === current.selectedAssetId)
          ? current.selectedAssetId
          : assets[0]?.id || null,
        loading: { ...current.loading, assets: false }
      }));
    } catch (error) {
      setLoading('assets', false);
      setError('assets', error instanceof Error ? error.message : 'Unable to load assets');
    }
  }, [companyId, setError, setLoading]);

  const loadRentals = useCallback(async () => {
    if (!companyId) return;
    setLoading('rentals', true);
    setError('rentals', null);
    try {
      const rentals = await listRentals({ companyId, limit: 25 });
      setState((current) => ({
        ...current,
        rentals: Array.isArray(rentals) ? rentals : [],
        loading: { ...current.loading, rentals: false }
      }));
    } catch (error) {
      setLoading('rentals', false);
      setError('rentals', error instanceof Error ? error.message : 'Unable to load rentals');
    }
  }, [companyId, setError, setLoading]);

  const loadCoupons = useCallback(async () => {
    if (!companyId) return;
    setLoading('coupons', true);
    setError('coupons', null);
    try {
      const response = await listCoupons({ companyId });
      const coupons = Array.isArray(response?.coupons) ? response.coupons : [];
      setState((current) => ({
        ...current,
        coupons,
        loading: { ...current.loading, coupons: false }
      }));
    } catch (error) {
      setLoading('coupons', false);
      setError('coupons', error instanceof Error ? error.message : 'Unable to load coupons');
    }
  }, [companyId, setError, setLoading]);

  const loadAvailability = useCallback(
    async (assetId) => {
      if (!companyId || !assetId) return;
      setLoading('availability', true);
      setError('availability', null);
      try {
        const response = await getAvailability(assetId, { companyId });
        const availability = response?.availability || { asset: null, totalQuantity: 0, timeline: [] };
        setState((current) => ({
          ...current,
          availability,
          loading: { ...current.loading, availability: false }
        }));
      } catch (error) {
        setLoading('availability', false);
        setError('availability', error instanceof Error ? error.message : 'Unable to load availability');
      }
    },
    [companyId, setError, setLoading]
  );

  useEffect(() => {
    if (!companyId) {
      setState(defaultState);
      return;
    }
    loadAssets();
    loadRentals();
    loadCoupons();
  }, [companyId, loadAssets, loadCoupons, loadRentals]);

  useEffect(() => {
    if (!companyId || !state.selectedAssetId) return;
    loadAvailability(state.selectedAssetId);
  }, [companyId, loadAvailability, state.selectedAssetId]);

  const selectAsset = useCallback((assetId) => {
    setState((current) => ({ ...current, selectedAssetId: assetId }));
  }, []);

  const handleCreateAsset = useCallback(
    async (payload) => {
      if (!companyId) return null;
      setState((current) => ({ ...current, loading: { ...current.loading, action: 'createAsset' } }));
      try {
        const response = await createAsset({ ...payload, companyId });
        const asset = response?.asset;
        if (asset) {
          setState((current) => ({
            ...current,
            assets: [asset, ...current.assets.filter((entry) => entry.id !== asset.id)],
            selectedAssetId: asset.id,
            loading: { ...current.loading, action: null }
          }));
          loadAvailability(asset.id);
        } else {
          setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
        }
        return asset;
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: { ...current.loading, action: null },
          errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to create asset' }
        }));
        throw error;
      }
    },
    [companyId, loadAvailability]
  );

  const handleUpdateAsset = useCallback(
    async (assetId, payload) => {
      if (!companyId || !assetId) return null;
      setState((current) => ({ ...current, loading: { ...current.loading, action: 'updateAsset' } }));
      try {
        const response = await updateAsset(assetId, { ...payload, companyId });
        const asset = response?.asset;
        if (asset) {
          setState((current) => ({
            ...current,
            assets: current.assets.map((entry) => (entry.id === asset.id ? asset : entry)),
            loading: { ...current.loading, action: null }
          }));
          loadAvailability(asset.id);
        } else {
          setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
        }
        return asset;
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: { ...current.loading, action: null },
          errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to update asset' }
        }));
        throw error;
      }
    },
    [companyId, loadAvailability]
  );

  const handleCreatePricingTier = useCallback(
    async (assetId, payload) => {
      if (!assetId) return null;
      setState((current) => ({ ...current, loading: { ...current.loading, action: 'createPricing' } }));
      try {
        const response = await createPricingTier(assetId, payload);
        const tier = response?.tier;
        if (tier) {
          setState((current) => ({
            ...current,
            assets: current.assets.map((asset) =>
              asset.id === assetId ? { ...asset, pricingTiers: [...(asset.pricingTiers || []), tier] } : asset
            ),
            loading: { ...current.loading, action: null }
          }));
        } else {
          setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
        }
        return tier;
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: { ...current.loading, action: null },
          errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to create pricing tier' }
        }));
        throw error;
      }
    },
    []
  );

  const handleUpdatePricingTier = useCallback(async (assetId, pricingId, payload) => {
    if (!assetId || !pricingId) return null;
    setState((current) => ({ ...current, loading: { ...current.loading, action: 'updatePricing' } }));
    try {
      const response = await updatePricingTier(assetId, pricingId, payload);
      const tier = response?.tier;
      if (tier) {
        setState((current) => ({
          ...current,
          assets: current.assets.map((asset) =>
            asset.id === assetId
              ? {
                  ...asset,
                  pricingTiers: (asset.pricingTiers || []).map((entry) => (entry.id === pricingId ? tier : entry))
                }
              : asset
          ),
          loading: { ...current.loading, action: null }
        }));
      } else {
        setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
      }
      return tier;
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: { ...current.loading, action: null },
        errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to update pricing tier' }
      }));
      throw error;
    }
  }, []);

  const handleDeletePricingTier = useCallback(async (assetId, pricingId) => {
    if (!assetId || !pricingId) return;
    setState((current) => ({ ...current, loading: { ...current.loading, action: 'deletePricing' } }));
    try {
      await deletePricingTier(assetId, pricingId);
      setState((current) => ({
        ...current,
        assets: current.assets.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                pricingTiers: (asset.pricingTiers || []).filter((entry) => entry.id !== pricingId)
              }
            : asset
        ),
        loading: { ...current.loading, action: null }
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: { ...current.loading, action: null },
        errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to delete pricing tier' }
      }));
      throw error;
    }
  }, []);

  const handleCreateCoupon = useCallback(
    async (payload) => {
      if (!companyId) return null;
      setState((current) => ({ ...current, loading: { ...current.loading, action: 'createCoupon' } }));
      try {
        const response = await createCoupon({ ...payload, companyId });
        const coupon = response?.coupon;
        if (coupon) {
          setState((current) => ({
            ...current,
            coupons: [coupon, ...current.coupons.filter((entry) => entry.id !== coupon.id)],
            loading: { ...current.loading, action: null }
          }));
        } else {
          setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
        }
        return coupon;
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: { ...current.loading, action: null },
          errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to create coupon' }
        }));
        throw error;
      }
    },
    [companyId]
  );

  const handleUpdateCoupon = useCallback(
    async (couponId, payload) => {
      if (!companyId || !couponId) return null;
      setState((current) => ({ ...current, loading: { ...current.loading, action: 'updateCoupon' } }));
      try {
        const response = await updateCoupon(couponId, { ...payload, companyId });
        const coupon = response?.coupon;
        if (coupon) {
          setState((current) => ({
            ...current,
            coupons: current.coupons.map((entry) => (entry.id === coupon.id ? coupon : entry)),
            loading: { ...current.loading, action: null }
          }));
        } else {
          setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
        }
        return coupon;
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: { ...current.loading, action: null },
          errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to update coupon' }
        }));
        throw error;
      }
    },
    [companyId]
  );

  const handleDeleteCoupon = useCallback(async (couponId) => {
    if (!companyId || !couponId) return;
    setState((current) => ({ ...current, loading: { ...current.loading, action: 'deleteCoupon' } }));
    try {
      await deleteCoupon(couponId, { companyId });
      setState((current) => ({
        ...current,
        coupons: current.coupons.filter((entry) => entry.id !== couponId),
        loading: { ...current.loading, action: null }
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: { ...current.loading, action: null },
        errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to delete coupon' }
      }));
      throw error;
    }
  }, [companyId]);

  const handleCreateRental = useCallback(
    async (payload) => {
      setState((current) => ({ ...current, loading: { ...current.loading, action: 'createRental' } }));
      try {
        const response = await createRental(payload || {});
        await loadRentals();
        setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
        return response;
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: { ...current.loading, action: null },
          errors: { ...current.errors, action: error instanceof Error ? error.message : 'Unable to create rental' }
        }));
        throw error;
      }
    },
    [loadRentals]
  );

  const handleRentalAction = useCallback(
    async (rentalId, action, payload = {}) => {
      if (!rentalId) return null;
      setState((current) => ({ ...current, loading: { ...current.loading, action } }));
      try {
        let result;
        switch (action) {
          case 'approve':
            result = await approveRental(rentalId, payload);
            break;
          case 'schedule':
            result = await scheduleRentalPickup(rentalId, payload);
            break;
          case 'checkout':
            result = await checkoutRental(rentalId, payload);
            break;
          case 'return':
            result = await markRentalReturned(rentalId, payload);
            break;
          case 'inspect':
            result = await completeRentalInspection(rentalId, payload);
            break;
          case 'cancel':
            result = await cancelRental(rentalId, payload);
            break;
          case 'deposit':
            result = await updateRentalDeposit(rentalId, payload);
            break;
          default:
            result = null;
        }
        await loadRentals();
        setState((current) => ({ ...current, loading: { ...current.loading, action: null } }));
        return result;
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: { ...current.loading, action: null },
          errors: { ...current.errors, action: error instanceof Error ? error.message : 'Rental update failed' }
        }));
        throw error;
      }
    },
    [loadRentals]
  );

  const contextValue = useMemo(
    () => ({
      state,
      actions: {
        loadAssets,
        loadRentals,
        loadCoupons,
        loadAvailability,
        selectAsset,
        createAsset: handleCreateAsset,
        updateAsset: handleUpdateAsset,
        createPricingTier: handleCreatePricingTier,
        updatePricingTier: handleUpdatePricingTier,
        deletePricingTier: handleDeletePricingTier,
        createCoupon: handleCreateCoupon,
        updateCoupon: handleUpdateCoupon,
        deleteCoupon: handleDeleteCoupon,
        createRental: handleCreateRental,
        runRentalAction: handleRentalAction
      }
    }),
    [
      handleCreateAsset,
      handleCreateCoupon,
      handleCreatePricingTier,
      handleCreateRental,
      handleDeleteCoupon,
      handleDeletePricingTier,
      handleRentalAction,
      handleUpdateAsset,
      handleUpdateCoupon,
      handleUpdatePricingTier,
      loadAssets,
      loadAvailability,
      loadCoupons,
      loadRentals,
      selectAsset,
      state
    ]
  );

  return <ToolRentalContext.Provider value={contextValue}>{children}</ToolRentalContext.Provider>;
}

ToolRentalProvider.propTypes = {
  companyId: PropTypes.string,
  children: PropTypes.node.isRequired
};

ToolRentalProvider.defaultProps = {
  companyId: null
};

export function useToolRental() {
  const context = useContext(ToolRentalContext);
  if (!context) {
    throw new Error('useToolRental must be used within a ToolRentalProvider');
  }
  return context;
}

export default ToolRentalProvider;

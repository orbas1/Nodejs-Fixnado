import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  createMarketplaceMaterial,
  createMarketplaceTool,
  deleteMarketplaceMaterial,
  deleteMarketplaceTool,
  fetchMarketplaceOverview,
  updateMarketplaceMaterial,
  updateMarketplaceTool
} from '../../api/marketplaceAdminClient.js';
import TextInput from '../../components/ui/TextInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import MarketplaceSummary from './MarketplaceSummary.jsx';
import MarketplaceInventoryForm from './MarketplaceInventoryForm.jsx';
import MarketplaceInventoryTable from './MarketplaceInventoryTable.jsx';
import MarketplaceModerationQueue from './MarketplaceModerationQueue.jsx';

function useInitialForm(companyId, classification) {
  return useMemo(
    () => ({
      companyId: companyId || '',
      name: '',
      sku: '',
      category: classification === 'tool' ? 'Tools' : 'Materials',
      unitType: 'unit',
      quantityOnHand: 0,
      quantityReserved: 0,
      safetyStock: 0,
      rentalRate: '',
      rentalRateCurrency: 'GBP',
      depositAmount: '',
      depositCurrency: 'GBP',
      replacementCost: '',
      insuranceRequired: false,
      conditionRating: 'good',
      imageUrl: '',
      datasheetUrl: '',
      notes: '',
      tags: ''
    }),
    [companyId, classification]
  );
}

function mapFormToPayload(draft, classification) {
  return {
    companyId: draft.companyId || undefined,
    name: draft.name,
    sku: draft.sku,
    category: draft.category || (classification === 'tool' ? 'Tools' : 'Materials'),
    unitType: draft.unitType || 'unit',
    quantityOnHand: Number.parseInt(draft.quantityOnHand ?? 0, 10) || 0,
    quantityReserved: Number.parseInt(draft.quantityReserved ?? 0, 10) || 0,
    safetyStock: Number.parseInt(draft.safetyStock ?? 0, 10) || 0,
    rentalRate: draft.rentalRate === '' ? undefined : Number.parseFloat(draft.rentalRate),
    rentalRateCurrency: draft.rentalRateCurrency || 'GBP',
    depositAmount: draft.depositAmount === '' ? undefined : Number.parseFloat(draft.depositAmount),
    depositCurrency: draft.depositCurrency || draft.rentalRateCurrency || 'GBP',
    replacementCost: draft.replacementCost === '' ? undefined : Number.parseFloat(draft.replacementCost),
    insuranceRequired: Boolean(draft.insuranceRequired),
    conditionRating: draft.conditionRating,
    imageUrl: draft.imageUrl || undefined,
    datasheetUrl: draft.datasheetUrl || undefined,
    notes: draft.notes || undefined,
    tags:
      typeof draft.tags === 'string'
        ? draft.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : []
  };
}

export default function MarketplaceWorkspace({
  initialCompanyId,
  prefetchedOverview,
  className
}) {
  const [filters, setFilters] = useState({ companyId: initialCompanyId || '' });
  const [state, setState] = useState({
    loading: !prefetchedOverview,
    data: prefetchedOverview ?? null,
    error: null
  });

  const initialToolForm = useInitialForm(filters.companyId, 'tool');
  const initialMaterialForm = useInitialForm(filters.companyId, 'material');
  const [toolDraft, setToolDraft] = useState(initialToolForm);
  const [materialDraft, setMaterialDraft] = useState(initialMaterialForm);
  const [editingToolId, setEditingToolId] = useState(null);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [toolStatus, setToolStatus] = useState({ saving: false, success: null, error: null });
  const [materialStatus, setMaterialStatus] = useState({ saving: false, success: null, error: null });
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!editingToolId) {
      setToolDraft(initialToolForm);
    }
    if (!editingMaterialId) {
      setMaterialDraft(initialMaterialForm);
    }
  }, [initialToolForm, initialMaterialForm, editingToolId, editingMaterialId]);

  const loadOverview = useCallback(
    async ({ targetCompanyId } = {}) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const payload = await fetchMarketplaceOverview({ companyId: targetCompanyId || filters.companyId || undefined });
        setState({ loading: false, data: payload, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load marketplace overview';
        setState({ loading: false, data: null, error: message });
      }
    },
    [filters.companyId]
  );

  useEffect(() => {
    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      if (prefetchedOverview) {
        return;
      }
    }
    loadOverview({ targetCompanyId: filters.companyId });
  }, [filters.companyId, loadOverview, prefetchedOverview]);

  const resetToolForm = useCallback(() => {
    setToolDraft(initialToolForm);
    setEditingToolId(null);
    setToolStatus({ saving: false, success: null, error: null });
  }, [initialToolForm]);

  const resetMaterialForm = useCallback(() => {
    setMaterialDraft(initialMaterialForm);
    setEditingMaterialId(null);
    setMaterialStatus({ saving: false, success: null, error: null });
  }, [initialMaterialForm]);

  const handleToolSubmit = async () => {
    setToolStatus({ saving: true, success: null, error: null });
    try {
      const payload = mapFormToPayload(toolDraft, 'tool');
      if (editingToolId) {
        await updateMarketplaceTool(editingToolId, payload);
        setToolStatus({ saving: false, success: 'Tool updated successfully', error: null });
      } else {
        await createMarketplaceTool(payload);
        setToolStatus({ saving: false, success: 'Tool created successfully', error: null });
      }
      await loadOverview({ targetCompanyId: payload.companyId });
      resetToolForm();
    } catch (error) {
      setToolStatus({
        saving: false,
        success: null,
        error: error instanceof Error ? error.message : 'Unable to save tool'
      });
    }
  };

  const handleMaterialSubmit = async () => {
    setMaterialStatus({ saving: true, success: null, error: null });
    try {
      const payload = mapFormToPayload(materialDraft, 'material');
      if (editingMaterialId) {
        await updateMarketplaceMaterial(editingMaterialId, payload);
        setMaterialStatus({ saving: false, success: 'Material updated successfully', error: null });
      } else {
        await createMarketplaceMaterial(payload);
        setMaterialStatus({ saving: false, success: 'Material created successfully', error: null });
      }
      await loadOverview({ targetCompanyId: payload.companyId });
      resetMaterialForm();
    } catch (error) {
      setMaterialStatus({
        saving: false,
        success: null,
        error: error instanceof Error ? error.message : 'Unable to save material'
      });
    }
  };

  const handleEditTool = (item) => {
    setEditingToolId(item.id);
    setToolDraft({
      companyId: item.companyId || filters.companyId || '',
      name: item.name,
      sku: item.sku,
      category: item.category,
      unitType: item.unitType,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      safetyStock: item.safetyStock,
      rentalRate: item.rentalRate ?? '',
      rentalRateCurrency: item.rentalRateCurrency || 'GBP',
      depositAmount: item.depositAmount ?? '',
      depositCurrency: item.depositCurrency || 'GBP',
      replacementCost: item.replacementCost ?? '',
      insuranceRequired: item.insuranceRequired,
      conditionRating: item.conditionRating || 'good',
      imageUrl: item.imageUrl || '',
      datasheetUrl: item.datasheetUrl || '',
      notes: item.notes || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditMaterial = (item) => {
    setEditingMaterialId(item.id);
    setMaterialDraft({
      companyId: item.companyId || filters.companyId || '',
      name: item.name,
      sku: item.sku,
      category: item.category,
      unitType: item.unitType,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      safetyStock: item.safetyStock,
      rentalRate: item.rentalRate ?? '',
      rentalRateCurrency: item.rentalRateCurrency || 'GBP',
      depositAmount: item.depositAmount ?? '',
      depositCurrency: item.depositCurrency || 'GBP',
      replacementCost: item.replacementCost ?? '',
      insuranceRequired: item.insuranceRequired,
      conditionRating: item.conditionRating || 'good',
      imageUrl: item.imageUrl || '',
      datasheetUrl: item.datasheetUrl || '',
      notes: item.notes || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTool = async (itemId) => {
    if (!window.confirm('Delete this tool record? This cannot be undone.')) {
      return;
    }
    try {
      await deleteMarketplaceTool(itemId);
      await loadOverview({ targetCompanyId: filters.companyId });
      resetToolForm();
    } catch (error) {
      setToolStatus({
        saving: false,
        success: null,
        error: error instanceof Error ? error.message : 'Unable to delete tool'
      });
    }
  };

  const handleDeleteMaterial = async (itemId) => {
    if (!window.confirm('Delete this material record? This cannot be undone.')) {
      return;
    }
    try {
      await deleteMarketplaceMaterial(itemId);
      await loadOverview({ targetCompanyId: filters.companyId });
      resetMaterialForm();
    } catch (error) {
      setMaterialStatus({
        saving: false,
        success: null,
        error: error instanceof Error ? error.message : 'Unable to delete material'
      });
    }
  };

  const summary = state.data?.summary ?? { tools: { count: 0, available: 0 }, materials: { count: 0, available: 0 } };
  const tools = state.data?.tools ?? [];
  const materials = state.data?.materials ?? [];
  const moderationQueue = state.data?.moderationQueue ?? [];

  return (
    <div className={className}>
      <header className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Admin control centre</p>
            <h1 className="mt-2 text-4xl font-semibold text-primary">Marketplace management</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Govern marketplace tools, materials, and listing approvals. Updates sync instantly across dashboards and control towers.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <TextInput
              label="Focus company"
              value={filters.companyId}
              placeholder="Filter by company ID (optional)"
              onChange={(event) => setFilters({ companyId: event.target.value })}
            />
            <Button type="button" variant="secondary" onClick={() => loadOverview({ targetCompanyId: filters.companyId })}>
              Refresh overview
            </Button>
          </div>
        </div>
        <MarketplaceSummary
          summary={summary}
          moderationCount={moderationQueue.length}
          companyScope={filters.companyId}
        />
      </header>

      {state.loading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-accent/10 bg-white/70 p-6 text-primary">
          <Spinner size="sm" /> Loading marketplace overview…
        </div>
      ) : state.error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700">
          <p className="font-semibold">{state.error}</p>
          <p className="mt-2 text-sm">Retry or adjust the company filter to load marketplace insights.</p>
        </div>
      ) : null}

      {state.data ? (
        <div className="mt-8 space-y-10">
          <MarketplaceInventoryForm
            title="Tool management"
            classification="tool"
            draft={toolDraft}
            onChange={(field, value) => setToolDraft((current) => ({ ...current, [field]: value }))}
            onSubmit={handleToolSubmit}
            onReset={resetToolForm}
            saving={toolStatus.saving}
            successMessage={toolStatus.success}
            errorMessage={toolStatus.error}
            mode={editingToolId ? 'edit' : 'create'}
          />

          <MarketplaceInventoryForm
            title="Material management"
            classification="material"
            draft={materialDraft}
            onChange={(field, value) => setMaterialDraft((current) => ({ ...current, [field]: value }))}
            onSubmit={handleMaterialSubmit}
            onReset={resetMaterialForm}
            saving={materialStatus.saving}
            successMessage={materialStatus.success}
            errorMessage={materialStatus.error}
            mode={editingMaterialId ? 'edit' : 'create'}
          />

          <MarketplaceInventoryTable title="Tools inventory" items={tools} onEdit={handleEditTool} onDelete={handleDeleteTool} />

          <MarketplaceInventoryTable
            title="Materials inventory"
            items={materials}
            onEdit={handleEditMaterial}
            onDelete={handleDeleteMaterial}
          />

          <MarketplaceModerationQueue
            items={moderationQueue}
            onFocusCompany={(companyId) => setFilters((current) => ({ ...current, companyId: companyId || current.companyId }))}
          />
        </div>
      ) : null}

      {!state.loading && !state.data && !state.error ? (
        <div className="mt-8 rounded-3xl border border-accent/10 bg-white/80 p-6 text-sm text-slate-600">
          No marketplace data found for this scope yet.
        </div>
      ) : null}
    </div>
  );
}

MarketplaceWorkspace.propTypes = {
  initialCompanyId: PropTypes.string,
  prefetchedOverview: PropTypes.shape({
    summary: PropTypes.shape({
      tools: PropTypes.object,
      materials: PropTypes.object
    }),
    tools: PropTypes.array,
    materials: PropTypes.array,
    moderationQueue: PropTypes.array
  }),
  className: PropTypes.string
};

MarketplaceWorkspace.defaultProps = {
  initialCompanyId: '',
  prefetchedOverview: null,
  className: 'space-y-12'
};

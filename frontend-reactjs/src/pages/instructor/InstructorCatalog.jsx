import { useCallback, useEffect, useState } from 'react';
import InstructorCatalogueTable from '../../components/instructor/InstructorCatalogueTable.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import {
  fetchCommerceCatalogue,
  updateCatalogueItemAvailability
} from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function InstructorCatalog() {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const loadCatalogue = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const { items: data, pagination: pager } = await fetchCommerceCatalogue(
        {
          page: pagination.page,
          search: appliedSearch || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
          availability: availabilityFilter === 'all' ? undefined : availabilityFilter
        },
        { signal }
      );
      setItems(data);
      setPagination((current) => ({ ...current, ...pager }));
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[InstructorCatalog] Failed to fetch catalogue', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, availabilityFilter, pagination.page, typeFilter]);

  useEffect(() => {
    const controller = new AbortController();
    loadCatalogue(controller.signal);
    return () => controller.abort();
  }, [loadCatalogue]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 1 }));
    setAppliedSearch(search.trim());
  };

  const handlePageChange = (page) => {
    setPagination((current) => ({ ...current, page: Math.max(1, Math.min(page, current.totalPages)) }));
  };

  const handleUpdate = async (item, payload) => {
    setUpdatingItemId(item.id);
    try {
      await updateCatalogueItemAvailability(item.id, payload);
      await loadCatalogue();
    } catch (err) {
      console.error('[InstructorCatalog] Failed to update item availability', err);
      setError(err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="space-y-6 px-4 py-8 md:px-8" data-qa="instructor-catalogue">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.catalogue.eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-primary">{t('instructor.catalogue.title')}</h1>
        <p className="text-sm text-slate-600">{t('instructor.catalogue.description')}</p>
      </header>

      <form onSubmit={handleSearch} className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:grid-cols-4">
        <label className="md:col-span-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.catalogue.searchLabel')}
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('instructor.catalogue.searchPlaceholder')}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.catalogue.typeFilter')}
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPagination((current) => ({ ...current, page: 1 }));
            }}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="all">{t('instructor.catalogue.filterAll')}</option>
            <option value="course">{t('instructor.catalogue.type.course')}</option>
            <option value="service">{t('instructor.catalogue.type.service')}</option>
            <option value="rental">{t('instructor.catalogue.type.rental')}</option>
            <option value="material">{t('instructor.catalogue.type.material')}</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.catalogue.availabilityFilter')}
          <select
            value={availabilityFilter}
            onChange={(event) => {
              setAvailabilityFilter(event.target.value);
              setPagination((current) => ({ ...current, page: 1 }));
            }}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="all">{t('instructor.catalogue.filterAll')}</option>
            <option value="available">{t('instructor.catalogue.availability.available')}</option>
            <option value="limited">{t('instructor.catalogue.availability.limited')}</option>
            <option value="unavailable">{t('instructor.catalogue.availability.unavailable')}</option>
            <option value="retired">{t('instructor.catalogue.availability.retired')}</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            {t('instructor.catalogue.searchCta')}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.catalogue.errorTitle')}</p>
          <p className="mt-2">{error.message || t('instructor.catalogue.errorDescription')}</p>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="space-y-4">
          <Skeleton lines={8} className="h-64" />
          <div className="flex justify-center py-8">
            <Spinner label={t('instructor.catalogue.loading')} />
          </div>
        </div>
      ) : null}

      <InstructorCatalogueTable
        items={items}
        onUpdate={handleUpdate}
        isUpdating={Boolean(updatingItemId)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>
          {t('instructor.catalogue.paginationSummary', {
            page: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems ?? items.length
          })}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePageChange(pagination.page - 1)}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
            disabled={pagination.page <= 1}
          >
            {t('instructor.catalogue.prevPage')}
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(pagination.page + 1)}
            className="rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
            disabled={pagination.page >= pagination.totalPages}
          >
            {t('instructor.catalogue.nextPage')}
          </button>
        </div>
      </div>
    </div>
  );
}

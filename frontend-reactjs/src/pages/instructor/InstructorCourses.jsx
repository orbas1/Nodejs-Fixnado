import { useCallback, useEffect, useState } from 'react';
import InstructorCourseTable from '../../components/instructor/InstructorCourseTable.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import {
  fetchInstructorCourses,
  updateCoursePublishing
} from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function InstructorCourses() {
  const { t } = useLocale();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [availableFilters, setAvailableFilters] = useState({ statuses: [], deliveryModes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingCourseId, setSavingCourseId] = useState(null);

  const loadCourses = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const { courses: data, pagination: pager, filters } = await fetchInstructorCourses(
        {
          page: pagination.page,
          search: appliedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          deliveryMode: deliveryFilter === 'all' ? undefined : deliveryFilter
        },
        { signal }
      );
      setCourses(data);
      setPagination((current) => ({ ...current, ...pager }));
      setAvailableFilters(filters);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[InstructorCourses] Failed to fetch courses', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, deliveryFilter, pagination.page, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    loadCourses(controller.signal);
    return () => controller.abort();
  }, [loadCourses]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 1 }));
    setAppliedSearch(search.trim());
  };

  const handlePageChange = (nextPage) => {
    setPagination((current) => ({ ...current, page: Math.max(1, Math.min(nextPage, current.totalPages)) }));
  };

  const handlePublishToggle = async (course, payload) => {
    setSavingCourseId(course.id);
    try {
      await updateCoursePublishing(course.id, payload);
      await loadCourses();
    } catch (err) {
      console.error('[InstructorCourses] Failed to update publishing state', err);
      setError(err);
    } finally {
      setSavingCourseId(null);
    }
  };

  const statusOptions = ['all', ...(availableFilters.statuses || [])];
  const deliveryOptions = ['all', ...(availableFilters.deliveryModes || [])];

  return (
    <div className="space-y-6 px-4 py-8 md:px-8" data-qa="instructor-courses">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.courses.eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-primary">{t('instructor.courses.title')}</h1>
        <p className="text-sm text-slate-600">{t('instructor.courses.description')}</p>
      </header>

      <form onSubmit={handleSearchSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:grid-cols-4">
        <label className="md:col-span-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.courses.searchLabel')}
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('instructor.courses.searchPlaceholder')}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.courses.statusFilter')}
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPagination((current) => ({ ...current, page: 1 }));
            }}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? t('instructor.courses.filterAll') : t(`instructor.courses.status.${option}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.courses.deliveryFilter')}
          <select
            value={deliveryFilter}
            onChange={(event) => {
              setDeliveryFilter(event.target.value);
              setPagination((current) => ({ ...current, page: 1 }));
            }}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            {deliveryOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? t('instructor.courses.filterAll') : t(`instructor.courses.delivery.${option}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            {t('instructor.courses.searchCta')}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.courses.errorTitle')}</p>
          <p className="mt-2">{error.message || t('instructor.courses.errorDescription')}</p>
        </div>
      ) : null}

      {loading && courses.length === 0 ? (
        <div className="space-y-4">
          <Skeleton lines={8} className="h-64" />
          <div className="flex justify-center py-8">
            <Spinner label={t('instructor.courses.loading')} />
          </div>
        </div>
      ) : null}

      <InstructorCourseTable
        courses={courses}
        onTogglePublish={handlePublishToggle}
        isUpdating={Boolean(savingCourseId)}
        filters={availableFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>
          {t('instructor.courses.paginationSummary', {
            page: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems ?? courses.length
          })}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePageChange(pagination.page - 1)}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
            disabled={pagination.page <= 1}
          >
            {t('instructor.courses.prevPage')}
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(pagination.page + 1)}
            className="rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
            disabled={pagination.page >= pagination.totalPages}
          >
            {t('instructor.courses.nextPage')}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listAdminUsers } from '../../../api/adminUsersClient.js';
import { PAGE_SIZE } from './constants.js';

export function useUserDirectory({ pageSize = PAGE_SIZE } = {}) {
  const [filters, setFilters] = useState({ role: 'all', status: 'all', search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, error: null, items: [], summary: null, pagination: null });
  const abortRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search]);

  const requestParams = useMemo(
    () => ({
      page,
      pageSize,
      role: filters.role !== 'all' ? filters.role : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      search: debouncedSearch || undefined
    }),
    [page, pageSize, filters.role, filters.status, debouncedSearch]
  );

  const fetchUsers = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await listAdminUsers({ ...requestParams, signal: controller.signal });
      const nextPage = response?.pagination?.page;
      const requestedPage = response?.pagination?.requestedPage;
      const targetPage = Number.isFinite(nextPage) && nextPage > 0 ? nextPage : requestedPage;
      if (Number.isFinite(targetPage) && targetPage > 0 && targetPage !== requestParams.page) {
        skipNextFetchRef.current = true;
        setPage(targetPage);
      }
      setState({
        loading: false,
        error: null,
        items: response?.items ?? [],
        summary: response?.summary ?? null,
        pagination: response?.pagination ?? null
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message ?? 'Unable to load users',
        items: [],
        pagination: null
      }));
    } finally {
      abortRef.current = null;
    }
  }, [requestParams]);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return () => {
        if (abortRef.current) {
          abortRef.current.abort();
        }
      };
    }
    fetchUsers();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchUsers]);

  const setFilter = useCallback((field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    if (field !== 'search') {
      setPage(1);
    }
  }, []);

  const setSearch = useCallback((value) => {
    setFilters((current) => ({ ...current, search: value }));
  }, []);

  const refresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const paginationMeta = useMemo(() => {
    const data = state.pagination;
    const totalPages = data?.totalPages ?? 1;
    const activePage = Number.isFinite(data?.page) ? data.page : page;
    const requestedPage = data?.requestedPage;
    const showPageAdjustment =
      Number.isFinite(requestedPage) && Number.isFinite(data?.page) && requestedPage !== data.page;

    return {
      totalPages,
      activePage,
      showPageAdjustment,
      requestedPageLabel: requestedPage?.toLocaleString?.() ?? requestedPage,
      paginationLabel: `${showPageAdjustment ? `Showing page ${activePage}` : `Page ${activePage}`} of ${totalPages}`,
      totalUsersLabel: data?.total?.toLocaleString?.() ?? state.items.length
    };
  }, [state.pagination, page, state.items.length]);

  return {
    filters,
    setFilter,
    setSearch,
    page,
    setPage,
    state,
    refresh,
    paginationMeta
  };
}

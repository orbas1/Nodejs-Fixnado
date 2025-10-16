import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  listAutomationBacklog,
  createAutomationBacklogItem,
  updateAutomationBacklogItem,
  archiveAutomationBacklogItem
} from '../../../api/automationClient.js';
import SectionHeader from './SectionHeader.jsx';
import AutomationBacklogFilters from './AutomationBacklogFilters.jsx';
import AutomationBacklogGrid from './AutomationBacklogGrid.jsx';
import AutomationBacklogDetailDialog from './AutomationBacklogDetailDialog.jsx';
import AutomationBacklogFormModal from './AutomationBacklogFormModal.jsx';
import { DEFAULT_FORM_STATE } from './constants.js';
import { ensureArray, extractFieldErrors, formatDateInput } from './utils.js';

export default function AutomationBacklogSection({ section }) {
  const hydratedItems = useMemo(() => ensureArray(section.data?.items), [section.data]);
  const [items, setItems] = useState(hydratedItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ priority: 'all', status: 'all', search: '', includeArchived: false });
  const [detailItem, setDetailItem] = useState(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(hydratedItems);
  }, [hydratedItems]);

  const loadItems = useCallback(
    async ({ includeArchived, signal, forceRefresh } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await listAutomationBacklog({
          includeArchived: includeArchived ?? filters.includeArchived,
          signal,
          forceRefresh
        });
        setItems(payload ?? []);
      } catch (err) {
        if (err?.name === 'AbortError') {
          return;
        }
        setError(err?.message || 'Unable to load automation backlog');
      } finally {
        setLoading(false);
      }
    },
    [filters.includeArchived]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadItems({ includeArchived: filters.includeArchived, signal: controller.signal });
    return () => controller.abort();
  }, [filters.includeArchived, loadItems]);

  const filteredItems = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.priority !== 'all' && item.priority !== filters.priority) {
        return false;
      }
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      if (!searchTerm) {
        return true;
      }
      return [item.name, item.summary, item.owner, item.sponsor]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));
    });
  }, [items, filters.priority, filters.status, filters.search]);

  const handleFiltersChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadItems({ includeArchived: filters.includeArchived, forceRefresh: true });
  }, [filters.includeArchived, loadItems]);

  const openDetail = useCallback((item) => {
    setDetailItem(item);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailItem(null);
  }, []);

  const resetFormState = useCallback(() => {
    setFormData(DEFAULT_FORM_STATE);
    setFormError(null);
    setFieldErrors({});
  }, []);

  const openCreateForm = useCallback(() => {
    resetFormState();
    setFormOpen(true);
  }, [resetFormState]);

  const openEditForm = useCallback((item) => {
    setFormData({
      ...DEFAULT_FORM_STATE,
      ...item,
      estimatedSavings: item.estimatedSavings ?? '',
      expectedLaunchAt: formatDateInput(item.expectedLaunchAt),
      nextMilestoneOn: formatDateInput(item.nextMilestoneOn),
      lastReviewedAt: formatDateInput(item.lastReviewedAt),
      dependencies: ensureArray(item.dependencies),
      blockers: ensureArray(item.blockers),
      attachments: ensureArray(item.attachments),
      images: ensureArray(item.images),
      allowedRoles: ensureArray(item.allowedRoles).length ? ensureArray(item.allowedRoles) : ['admin']
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    resetFormState();
  }, [resetFormState]);

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleRoleToggle = useCallback((role) => {
    setFormData((prev) => {
      const nextRoles = new Set(prev.allowedRoles);
      if (nextRoles.has(role)) {
        nextRoles.delete(role);
      } else {
        nextRoles.add(role);
      }
      const roles = Array.from(nextRoles);
      return { ...prev, allowedRoles: roles.length ? roles : ['admin'] };
    });
  }, []);

  const submitForm = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving(true);
      setFormError(null);
      setFieldErrors({});

      const payload = {
        ...formData,
        estimatedSavings:
          formData.estimatedSavings === '' || formData.estimatedSavings == null
            ? null
            : Number.parseFloat(formData.estimatedSavings),
        allowedRoles: formData.allowedRoles,
        dependencies: ensureArray(formData.dependencies),
        blockers: ensureArray(formData.blockers),
        attachments: ensureArray(formData.attachments),
        images: ensureArray(formData.images)
      };

      try {
        if (formData.id) {
          const updated = await updateAutomationBacklogItem(formData.id, payload);
          await loadItems({ includeArchived: filters.includeArchived, forceRefresh: true });
          setDetailItem(updated);
        } else {
          await createAutomationBacklogItem(payload);
          await loadItems({ includeArchived: filters.includeArchived, forceRefresh: true });
        }
        closeForm();
      } catch (err) {
        if (err?.name === 'AbortError') {
          return;
        }
        const errors = extractFieldErrors(err?.details);
        setFieldErrors(errors);
        setFormError(err?.message || 'Unable to save automation initiative');
      } finally {
        setSaving(false);
      }
    },
    [formData, filters.includeArchived, loadItems, closeForm]
  );

  const handleArchive = useCallback(
    async (initiative) => {
      try {
        await archiveAutomationBacklogItem(initiative.id);
        await loadItems({ includeArchived: filters.includeArchived, forceRefresh: true });
        if (detailItem?.id === initiative.id) {
          closeDetail();
        }
      } catch (err) {
        setError(err?.message || 'Unable to archive initiative');
      }
    },
    [closeDetail, detailItem?.id, filters.includeArchived, loadItems]
  );

  return (
    <div>
      <SectionHeader label={section.label} description={section.description} />
      <AutomationBacklogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        onCreate={openCreateForm}
      />
      <div className="mt-6">
        <AutomationBacklogGrid
          loading={loading}
          error={error}
          items={filteredItems}
          onEdit={openEditForm}
          onDetail={openDetail}
          onArchive={handleArchive}
        />
      </div>
      <AutomationBacklogDetailDialog
        open={isDetailOpen}
        item={detailItem}
        onClose={closeDetail}
        onEdit={(item) => {
          openEditForm(item);
          setDetailOpen(false);
        }}
        onArchive={handleArchive}
      />
      <AutomationBacklogFormModal
        open={isFormOpen}
        formData={formData}
        fieldErrors={fieldErrors}
        formError={formError}
        saving={saving}
        onClose={closeForm}
        onChange={handleFormChange}
        onRoleToggle={handleRoleToggle}
        onSubmit={submitForm}
      />
    </div>
  );
}

AutomationBacklogSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({ items: PropTypes.array })
  }).isRequired
};

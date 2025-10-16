import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowPathIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  fetchBookingOverview,
  fetchBookingSettings as fetchBookingSettingsApi,
  updateBookingSettings as updateBookingSettingsApi,
  createBooking,
  fetchBooking,
  updateBookingStatus,
  updateBookingSchedule,
  updateBookingMeta,
  applyTemplateToBooking,
  listBookingTemplates,
  createBookingTemplateClient,
  updateBookingTemplateClient,
  archiveBookingTemplateClient
} from '../api/adminBookingClient.js';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import { Button, Card, Checkbox, SegmentedControl, Spinner, StatusPill, TextInput } from '../components/ui/index.js';
import FormField from '../components/ui/FormField.jsx';

const DEFAULT_FILTERS = {
  timeframe: '7d',
  status: '',
  type: '',
  demandLevel: '',
  search: '',
  companyId: '',
  zoneId: ''
};

const INITIAL_CREATE_BOOKING = {
  customerEmail: '',
  customerFirstName: '',
  customerLastName: '',
  companyId: '',
  zoneId: '',
  title: '',
  summary: '',
  notes: '',
  baseAmount: '',
  currency: 'GBP',
  type: 'scheduled',
  demandLevel: 'medium',
  scheduledStart: '',
  scheduledEnd: '',
  templateId: '',
  heroImageUrl: ''
};

const INITIAL_TEMPLATE = {
  id: null,
  name: '',
  slug: '',
  category: '',
  status: 'draft',
  defaultType: 'scheduled',
  defaultDemandLevel: 'medium',
  defaultBaseAmount: '',
  defaultCurrency: 'GBP',
  defaultDurationMinutes: '',
  description: '',
  instructions: '',
  heroImageUrl: '',
  checklist: [],
  attachments: []
};

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input, length = 2) => String(input).padStart(length, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function templateStatuses() {
  return [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'retired', label: 'Retired' }
  ];
}

function demandLevels() {
  return [
    { value: 'high', label: 'High demand' },
    { value: 'medium', label: 'Balanced demand' },
    { value: 'low', label: 'Emerging demand' }
  ];
}

function bookingTypes() {
  return [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'on_demand', label: 'On-demand' }
  ];
}

function createChecklistItem() {
  return { id: '', label: '', mandatory: false };
}

function createAttachmentItem() {
  return { label: '', url: '', type: 'document' };
}

const ATTACHMENT_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'External link' }
];

const STATUS_TONES = {
  pending: 'warning',
  awaiting_assignment: 'warning',
  scheduled: 'info',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
  disputed: 'danger'
};

const DEMAND_BADGE = {
  high: 'bg-rose-100 text-rose-700 ring-rose-200',
  medium: 'bg-sky-100 text-sky-700 ring-sky-200',
  low: 'bg-emerald-100 text-emerald-700 ring-emerald-200'
};

const TEMPLATE_TONES = {
  draft: 'info',
  published: 'success',
  retired: 'neutral'
};

function createInitialTemplateForm() {
  return JSON.parse(JSON.stringify(INITIAL_TEMPLATE));
}

function normaliseTemplateForm(template = {}) {
  const base = createInitialTemplateForm();
  return {
    ...base,
    id: template.id ?? null,
    name: template.name ?? '',
    slug: template.slug ?? '',
    category: template.category ?? '',
    status: template.status ?? 'draft',
    defaultType: template.defaultType ?? 'scheduled',
    defaultDemandLevel: template.defaultDemandLevel ?? 'medium',
    defaultBaseAmount:
      template.defaultBaseAmount != null && template.defaultBaseAmount !== ''
        ? String(template.defaultBaseAmount)
        : '',
    defaultCurrency: template.defaultCurrency ?? 'GBP',
    defaultDurationMinutes:
      template.defaultDurationMinutes != null && template.defaultDurationMinutes !== ''
        ? String(template.defaultDurationMinutes)
        : '',
    description: template.description ?? '',
    instructions: template.instructions ?? '',
    heroImageUrl: template.heroImageUrl ?? '',
    checklist: Array.isArray(template.checklist)
      ? template.checklist.map((item) => ({
          id: item.id ?? '',
          label: item.label ?? '',
          mandatory: item.mandatory === true
        }))
      : [],
    attachments: Array.isArray(template.attachments)
      ? template.attachments.map((item) => ({
          label: item.label ?? '',
          url: item.url ?? '',
          type: item.type ?? 'document'
        }))
      : []
  };
}

function slugify(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function statusTone(status) {
  return STATUS_TONES[status] ?? 'neutral';
}

function statusLabel(status) {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function demandLabel(level) {
  if (!level) return 'Unknown';
  return level.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function templateTone(status) {
  return TEMPLATE_TONES[status] ?? 'neutral';
}

function formatDateTime(value, options = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch (error) {
    console.warn('Failed to format date', error);
    return date.toLocaleString();
  }
}

function formatNumber(value) {
  if (!Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value));
}

function formatMinutes(value) {
  if (!Number.isFinite(Number(value))) return '—';
  return `${Number.parseInt(value, 10)} mins`;
}

export default function AdminBookings() {
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [overviewState, setOverviewState] = useState({ loading: true, error: null, data: null });
  const [settingsState, setSettingsState] = useState({ loading: true, error: null, data: null, saving: false, success: null });
  const [createState, setCreateState] = useState({
    form: { ...INITIAL_CREATE_BOOKING },
    saving: false,
    success: null,
    error: null
  });
  const [bookingDetail, setBookingDetail] = useState({ loading: false, error: null, data: null, saving: false });
  const [bookingEditor, setBookingEditor] = useState(null);
  const [templatesState, setTemplatesState] = useState({ loading: true, error: null, data: [], success: null });
  const [templateEditor, setTemplateEditor] = useState({
    open: false,
    form: createInitialTemplateForm(),
    saving: false,
    error: null,
    success: null
  });

  const loadOverview = useCallback(
    async (override = {}) => {
      setOverviewState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await fetchBookingOverview(
          {
            timeframe: override.timeframe ?? filters.timeframe,
            status: override.status ?? filters.status,
            type: override.type ?? filters.type,
            demandLevel: override.demandLevel ?? filters.demandLevel,
            search: override.search ?? filters.search,
            companyId: override.companyId ?? filters.companyId,
            zoneId: override.zoneId ?? filters.zoneId,
            limit: pagination.limit,
            offset: override.offset ?? pagination.offset
          },
          {}
        );
        setOverviewState({ loading: false, error: null, data: response });
      } catch (error) {
        setOverviewState({ loading: false, error: error.message || 'Unable to load overview', data: null });
      }
    },
    [filters, pagination.limit, pagination.offset]
  );

  const loadSettings = useCallback(async () => {
    setSettingsState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await fetchBookingSettingsApi();
      setSettingsState({ loading: false, error: null, data: response.settings, saving: false, success: null });
    } catch (error) {
      setSettingsState({ loading: false, error: error.message || 'Unable to load settings', data: null, saving: false, success: null });
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setTemplatesState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await listBookingTemplates({ includeRetired: true });
      setTemplatesState((current) => ({
        ...current,
        loading: false,
        error: null,
        data: response.templates || []
      }));
      return response.templates || [];
    } catch (error) {
      setTemplatesState({ loading: false, error: error.message || 'Unable to load templates', data: [], success: null });
      return [];
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (bookingDetail.data) {
      const data = bookingDetail.data;
      setBookingEditor({
        id: data.id,
        title: data.summary || data.reference || '',
        summary: data.summary || '',
        instructions: data.instructions || '',
        notes: data.notes || '',
        heroImageUrl: data.heroImageUrl || '',
        demandLevel: data.demandLevel || 'medium',
        autoAssignEnabled: data.autoAssignEnabled !== false,
        allowCustomerEdits: data.allowCustomerEdits === true,
        tagsText: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        checklist: Array.isArray(data.checklist) ? data.checklist.map((item) => ({ ...item })) : [],
        attachments: Array.isArray(data.attachments) ? data.attachments.map((item) => ({ ...item })) : [],
        scheduledStart: toDateTimeLocal(data.scheduledStart),
        scheduledEnd: toDateTimeLocal(data.scheduledEnd),
        slaExpiresAt: toDateTimeLocal(data.slaExpiresAt),
        status: data.status,
        templateId: data.templateId || ''
      });
    } else {
      setBookingEditor(null);
    }
  }, [bookingDetail.data]);

  const metrics = overviewState.data?.metrics;
  const referenceData = overviewState.data?.referenceData || { companies: [], zones: [], customers: [] };
  const timeframeOptions = overviewState.data?.filters?.timeframeOptions || [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' }
  ];
  const statusOptions = overviewState.data?.filters?.statuses || [];
  const typeOptions = overviewState.data?.filters?.types || [];
  const demandOptions = overviewState.data?.filters?.demandLevels || [];

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    if (key !== 'search') {
      setPagination((current) => ({ ...current, offset: 0 }));
    }
  };

  useEffect(() => {
    loadOverview();
  }, [filters.timeframe, filters.status, filters.type, filters.demandLevel, filters.companyId, filters.zoneId, pagination.offset, loadOverview]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, offset: 0 }));
    loadOverview({ search: filters.search, offset: 0 });
  };
  const handleSettingsChange = (path, value) => {
    setSettingsState((current) => {
      if (!current.data) return current;
      const updated = JSON.parse(JSON.stringify(current.data));
      const segments = path.split('.');
      let cursor = updated;
      for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        cursor[segment] = cursor[segment] ?? {};
        cursor = cursor[segment];
      }
      cursor[segments[segments.length - 1]] = value;
      return { ...current, data: updated };
    });
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    if (!settingsState.data) return;
    setSettingsState((current) => ({ ...current, saving: true, success: null, error: null }));
    try {
      const payload = await updateBookingSettingsApi({ bookings: settingsState.data });
      setSettingsState({ loading: false, data: payload.settings, saving: false, success: 'Settings saved', error: null });
    } catch (error) {
      setSettingsState((current) => ({ ...current, saving: false, success: null, error: error.message || 'Unable to save settings' }));
    }
  };

  const handleCreateChange = (field, value) => {
    setCreateState((current) => ({ ...current, form: { ...current.form, [field]: value } }));
  };

  const handleAddChecklistItem = () => {
    setBookingEditor((current) => ({ ...current, checklist: [...(current?.checklist || []), createChecklistItem()] }));
  };

  const handleRemoveChecklistItem = (index) => {
    setBookingEditor((current) => ({
      ...current,
      checklist: current.checklist.filter((_, idx) => idx !== index)
    }));
  };

  const handleChecklistChange = (index, field, value) => {
    setBookingEditor((current) => ({
      ...current,
      checklist: current.checklist.map((item, idx) => (idx === index ? { ...item, [field]: field === 'mandatory' ? Boolean(value) : value } : item))
    }));
  };

  const handleAddAttachment = () => {
    setBookingEditor((current) => ({ ...current, attachments: [...(current?.attachments || []), createAttachmentItem()] }));
  };

  const handleRemoveAttachment = (index) => {
    setBookingEditor((current) => ({
      ...current,
      attachments: current.attachments.filter((_, idx) => idx !== index)
    }));
  };

  const handleAttachmentChange = (index, field, value) => {
    setBookingEditor((current) => ({
      ...current,
      attachments: current.attachments.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    }));
  };

  const handleOpenBooking = async (bookingId) => {
    setBookingDetail({ loading: true, error: null, data: null, saving: false });
    try {
      const response = await fetchBooking(bookingId);
      setBookingDetail({ loading: false, error: null, data: response, saving: false });
    } catch (error) {
      setBookingDetail({ loading: false, error: error.message || 'Unable to load booking', data: null, saving: false });
    }
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    setCreateState((current) => ({ ...current, saving: true, success: null, error: null }));
    try {
      const payload = {
        customerEmail: createState.form.customerEmail,
        customerFirstName: createState.form.customerFirstName,
        customerLastName: createState.form.customerLastName,
        companyId: createState.form.companyId,
        zoneId: createState.form.zoneId,
        type: createState.form.type,
        demandLevel: createState.form.demandLevel,
        baseAmount: createState.form.baseAmount ? Number.parseFloat(createState.form.baseAmount) : undefined,
        currency: createState.form.currency,
        scheduledStart: toIso(createState.form.scheduledStart),
        scheduledEnd: toIso(createState.form.scheduledEnd),
        templateId: createState.form.templateId || undefined,
        heroImageUrl: createState.form.heroImageUrl || undefined,
        summary: createState.form.summary || undefined,
        notes: createState.form.notes || undefined
      };
      await createBooking(payload);
      setCreateState({ form: { ...INITIAL_CREATE_BOOKING }, saving: false, success: 'Booking created', error: null });
      await loadOverview();
    } catch (error) {
      setCreateState((current) => ({ ...current, saving: false, success: null, error: error.message || 'Unable to create booking' }));
    }
  };

  const handleUpdateStatus = async () => {
    if (!bookingEditor?.id) return;
    setBookingDetail((current) => ({ ...current, saving: true }));
    try {
      await updateBookingStatus(bookingEditor.id, { status: bookingEditor.status });
      await handleOpenBooking(bookingEditor.id);
      await loadOverview();
    } catch (error) {
      setBookingDetail((current) => ({ ...current, saving: false, error: error.message || 'Unable to update status' }));
    }
  };

  const handleSaveSchedule = async () => {
    if (!bookingEditor?.id) return;
    setBookingDetail((current) => ({ ...current, saving: true, error: null }));
    try {
      await updateBookingSchedule(bookingEditor.id, {
        scheduledStart: bookingEditor.scheduledStart ? toIso(bookingEditor.scheduledStart) : undefined,
        scheduledEnd: bookingEditor.scheduledEnd ? toIso(bookingEditor.scheduledEnd) : undefined,
        slaExpiresAt: bookingEditor.slaExpiresAt ? toIso(bookingEditor.slaExpiresAt) : undefined
      });
      await handleOpenBooking(bookingEditor.id);
      await loadOverview();
    } catch (error) {
      setBookingDetail((current) => ({ ...current, saving: false, error: error.message || 'Unable to update schedule' }));
    }
  };

  const handleSaveMeta = async () => {
    if (!bookingEditor?.id) return;
    setBookingDetail((current) => ({ ...current, saving: true, error: null }));
    try {
      const tags = bookingEditor.tagsText
        ? bookingEditor.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];
      await updateBookingMeta(bookingEditor.id, {
        title: bookingEditor.title,
        summary: bookingEditor.summary,
        instructions: bookingEditor.instructions,
        notes: bookingEditor.notes,
        heroImageUrl: bookingEditor.heroImageUrl,
        demandLevel: bookingEditor.demandLevel,
        attachments: bookingEditor.attachments,
        checklist: bookingEditor.checklist,
        tags,
        autoAssignEnabled: bookingEditor.autoAssignEnabled,
        allowCustomerEdits: bookingEditor.allowCustomerEdits
      });
      await handleOpenBooking(bookingEditor.id);
      await loadOverview();
    } catch (error) {
      setBookingDetail((current) => ({ ...current, saving: false, error: error.message || 'Unable to update booking details' }));
    }
  };

  const handleApplyTemplate = async (templateId) => {
    if (!bookingEditor?.id || !templateId) return;
    setBookingDetail((current) => ({ ...current, saving: true, error: null }));
    try {
      await applyTemplateToBooking(bookingEditor.id, templateId);
      await handleOpenBooking(bookingEditor.id);
      await loadOverview();
    } catch (error) {
      setBookingDetail((current) => ({ ...current, saving: false, error: error.message || 'Unable to apply template' }));
    }
  };

  const handleOpenTemplateEditor = (template = null) => {
    if (template) {
      setTemplateEditor({
        open: true,
        saving: false,
        error: null,
        success: null,
        form: normaliseTemplateForm(template)
      });
    } else {
      setTemplateEditor({
        open: true,
        saving: false,
        error: null,
        success: null,
        form: createInitialTemplateForm()
      });
    }
  };

  const handleTemplateFieldChange = (field, value) => {
    setTemplateEditor((current) => {
      const nextForm = { ...current.form, [field]: value };
      if (field === 'name') {
        const generated = slugify(value);
        const previousGenerated = slugify(current.form.name || '');
        if (!current.form.slug || current.form.slug === previousGenerated) {
          nextForm.slug = generated;
        }
      }
      if (field === 'slug') {
        nextForm.slug = slugify(value);
      }
      return { ...current, form: nextForm };
    });
  };

  const handleTemplateChecklistChange = (index, field, value) => {
    setTemplateEditor((current) => ({
      ...current,
      form: {
        ...current.form,
        checklist: current.form.checklist.map((item, idx) =>
          idx === index ? { ...item, [field]: field === 'mandatory' ? Boolean(value) : value } : item
        )
      }
    }));
  };

  const handleTemplateAttachmentChange = (index, field, value) => {
    setTemplateEditor((current) => ({
      ...current,
      form: {
        ...current.form,
        attachments: current.form.attachments.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
      }
    }));
  };

  const addTemplateChecklistItem = () => {
    setTemplateEditor((current) => ({
      ...current,
      form: { ...current.form, checklist: [...current.form.checklist, createChecklistItem()] }
    }));
  };

  const removeTemplateChecklistItem = (index) => {
    setTemplateEditor((current) => ({
      ...current,
      form: { ...current.form, checklist: current.form.checklist.filter((_, idx) => idx !== index) }
    }));
  };

  const addTemplateAttachment = () => {
    setTemplateEditor((current) => ({
      ...current,
      form: { ...current.form, attachments: [...current.form.attachments, createAttachmentItem()] }
    }));
  };

  const removeTemplateAttachment = (index) => {
    setTemplateEditor((current) => ({
      ...current,
      form: { ...current.form, attachments: current.form.attachments.filter((_, idx) => idx !== index) }
    }));
  };
  const handleTemplateSubmit = async (event) => {
    event.preventDefault();
    const editorForm = templateEditor.form;
    if (!editorForm) return;
    const isUpdate = Boolean(editorForm.id);
    const payload = {
      name: editorForm.name?.trim() || undefined,
      slug: editorForm.slug?.trim() ? slugify(editorForm.slug) : undefined,
      category: editorForm.category?.trim() || undefined,
      status: editorForm.status || 'draft',
      defaultType: editorForm.defaultType || 'scheduled',
      defaultDemandLevel: editorForm.defaultDemandLevel || 'medium',
      defaultBaseAmount:
        editorForm.defaultBaseAmount && editorForm.defaultBaseAmount.trim()
          ? Number.parseFloat(editorForm.defaultBaseAmount)
          : undefined,
      defaultCurrency: editorForm.defaultCurrency?.trim() || undefined,
      defaultDurationMinutes:
        editorForm.defaultDurationMinutes && editorForm.defaultDurationMinutes.trim()
          ? Number.parseInt(editorForm.defaultDurationMinutes, 10)
          : undefined,
      description: editorForm.description?.trim() || undefined,
      instructions: editorForm.instructions?.trim() || undefined,
      heroImageUrl: editorForm.heroImageUrl?.trim() || undefined,
      checklist: Array.isArray(editorForm.checklist)
        ? editorForm.checklist
            .filter((item) => item.label && item.label.trim())
            .map((item) => ({
              id: item.id?.trim() || undefined,
              label: item.label.trim(),
              mandatory: Boolean(item.mandatory)
            }))
        : [],
      attachments: Array.isArray(editorForm.attachments)
        ? editorForm.attachments
            .filter((item) => item.url && item.url.trim())
            .map((item) => ({
              label: item.label?.trim() || item.url.trim(),
              url: item.url.trim(),
              type: item.type || 'document'
            }))
        : []
    };

    setTemplateEditor((current) => ({ ...current, saving: true, error: null, success: null }));

    try {
      const response = isUpdate
        ? await updateBookingTemplateClient(editorForm.id, payload)
        : await createBookingTemplateClient(payload);
      const template = response?.template ?? payload;
      const successMessage = isUpdate ? 'Template updated' : 'Template created';
      setTemplateEditor((current) => ({
        ...current,
        saving: false,
        error: null,
        success: successMessage,
        form: normaliseTemplateForm(template)
      }));
      await loadTemplates();
      setTemplatesState((current) => ({ ...current, success: successMessage }));
    } catch (error) {
      const message = error?.message || 'Unable to save template';
      setTemplateEditor((current) => ({ ...current, saving: false, error: message, success: null }));
    }
  };

  const handleArchiveTemplate = async (templateId) => {
    if (!templateId) return;
    try {
      await archiveBookingTemplateClient(templateId);
      await loadTemplates();
      setTemplatesState((current) => ({ ...current, success: 'Template archived', error: null }));
      if (templateEditor.open && templateEditor.form?.id === templateId) {
        setTemplateEditor({
          open: false,
          form: createInitialTemplateForm(),
          saving: false,
          error: null,
          success: null
        });
      }
    } catch (error) {
      setTemplatesState((current) => ({
        ...current,
        error: error?.message || 'Unable to archive template',
        success: null
      }));
    }
  };

  const handleCloseTemplateEditor = () => {
    setTemplateEditor({
      open: false,
      form: createInitialTemplateForm(),
      saving: false,
      error: null,
      success: null
    });
  };

  const handleBookingEditorChange = (field, value) => {
    setBookingEditor((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setPagination((current) => ({ ...current, offset: 0 }));
    loadOverview({
      timeframe: DEFAULT_FILTERS.timeframe,
      status: DEFAULT_FILTERS.status,
      type: DEFAULT_FILTERS.type,
      demandLevel: DEFAULT_FILTERS.demandLevel,
      search: DEFAULT_FILTERS.search,
      companyId: DEFAULT_FILTERS.companyId,
      zoneId: DEFAULT_FILTERS.zoneId,
      offset: 0
    });
  };

  const handlePageChange = (direction) => {
    setPagination((current) => {
      const delta = direction === 'next' ? current.limit : -current.limit;
      const nextOffset = Math.max(0, current.offset + delta);
      if (nextOffset === current.offset) {
        return current;
      }
      return { ...current, offset: nextOffset };
    });
  };

  const handleRefreshOverview = () => {
    loadOverview({ offset: pagination.offset });
  };

  const bookingsData = overviewState.data?.bookings;
  const bookings = bookingsData || [];
  const paginationMeta = overviewState.data?.pagination || {
    total: 0,
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore: false
  };
  const assignments = overviewState.data?.assignments || { outstanding: [], upcoming: [] };
  const templateSummary = overviewState.data?.templates || [];

  const revenueCurrency = useMemo(() => {
    const source = Array.isArray(bookingsData) ? bookingsData : [];
    const withCurrency = source.find((booking) => booking.currency);
    return (withCurrency?.currency || 'GBP').toUpperCase();
  }, [bookingsData]);

  const revenueFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: revenueCurrency,
        maximumFractionDigits: 2
      }),
    [revenueCurrency]
  );

  const timeframeLabel =
    overviewState.data?.timeframeLabel ||
    timeframeOptions.find((option) => option.value === filters.timeframe)?.label ||
    '';

  const headerMeta = [
    {
      label: 'Reporting window',
      value: timeframeLabel || '—',
      caption: overviewState.data?.generatedAt
        ? `Generated ${formatDateTime(overviewState.data.generatedAt)}`
        : undefined
    },
    {
      label: 'Bookings processed',
      value: formatNumber(metrics?.totals?.total ?? 0),
      caption: `${formatNumber(metrics?.totals?.active ?? 0)} active`
    },
    {
      label: 'Revenue captured',
      value: revenueFormatter.format(metrics?.totals?.revenue ?? 0),
      caption: metrics?.totals?.disputed
        ? `${formatNumber(metrics.totals.disputed)} flagged`
        : undefined
    },
    {
      label: 'SLA compliance',
      value: metrics ? `${metrics.sla.onTimePercentage}% on time` : '—',
      caption: metrics ? `Avg completion ${formatMinutes(metrics.sla.averageCompletionMinutes)}` : undefined
    }
  ];

  const headerActions = [
    {
      label: 'Refresh snapshot',
      onClick: handleRefreshOverview,
      variant: 'secondary',
      icon: ArrowPathIcon,
      iconPosition: 'start'
    },
    {
      label: 'Create booking',
      as: 'a',
      href: '#create-booking',
      variant: 'primary',
      icon: PlusIcon,
      iconPosition: 'start'
    }
  ];

  const breadcrumbs = [
    { label: 'Admin command', to: '/admin/dashboard' },
    { label: 'Booking management' }
  ];

  const activeTemplates = useMemo(
    () => templatesState.data.filter((template) => template.status !== 'retired'),
    [templatesState.data]
  );

  const templateSelectOptions = useMemo(
    () => activeTemplates.map((template) => ({ value: template.id, label: template.name })),
    [activeTemplates]
  );

  const currentPage = paginationMeta.limit
    ? Math.floor(paginationMeta.offset / paginationMeta.limit) + 1
    : 1;
  const totalPages = paginationMeta.limit
    ? Math.max(1, Math.ceil(paginationMeta.total / paginationMeta.limit))
    : 1;

  const outstandingAssignments = assignments.outstanding || [];
  const upcomingBookings = assignments.upcoming || [];

  const bookingTemplatesForDetail = useMemo(
    () => templatesState.data.filter((template) => template.status !== 'retired'),
    [templatesState.data]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Control centre"
        title="Booking management"
        description="Oversee live demand, bookings, and operational guardrails across Fixnado surfaces."
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1.2fr)]">
          <Card padding="lg" className="bg-white shadow-lg shadow-primary/5">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary">Operating filters</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Refine the snapshot by lifecycle status, demand profile, and territory.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
              >
                Reset filters
              </Button>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSearch}>
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Timeframe
                  <SegmentedControl
                    name="Timeframe"
                    value={filters.timeframe}
                    options={timeframeOptions}
                    onChange={(value) => handleFilterChange('timeframe', value)}
                    size="sm"
                    className="mt-3"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Status
                  <select
                    value={filters.status}
                    onChange={(event) => handleFilterChange('status', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Booking type
                  <select
                    value={filters.type}
                    onChange={(event) => handleFilterChange('type', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Demand level
                  <select
                    value={filters.demandLevel}
                    onChange={(event) => handleFilterChange('demandLevel', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {demandOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Company
                  <select
                    value={filters.companyId}
                    onChange={(event) => handleFilterChange('companyId', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All companies</option>
                    {referenceData.companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Zone
                  <select
                    value={filters.zoneId}
                    onChange={(event) => handleFilterChange('zoneId', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All zones</option>
                    {referenceData.zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <TextInput
                  label="Search"
                  placeholder="Reference, customer, or metadata"
                  value={filters.search}
                  onChange={(event) => handleFilterChange('search', event.target.value)}
                  className="md:flex-1"
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="primary">
                    Apply search
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      handleFilterChange('search', '');
                      loadOverview({ search: '', offset: 0 });
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          <Card padding="lg" className="bg-white shadow-lg shadow-primary/5">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-primary">Operational insights</h2>
              <p className="text-sm text-slate-600">
                Monitor assignments awaiting triage, the next scheduled work, and trending templates.
              </p>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Outstanding assignments
                  </h3>
                  <StatusPill tone={outstandingAssignments.length ? 'warning' : 'success'}>
                    {outstandingAssignments.length ? `${outstandingAssignments.length} pending` : 'Queue clear'}
                  </StatusPill>
                </div>
                <ul className="mt-3 space-y-3">
                  {outstandingAssignments.length ? (
                    outstandingAssignments.map((assignment) => (
                      <li
                        key={assignment.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {assignment.booking?.summary || assignment.booking?.reference}
                            </p>
                            <p className="text-xs text-slate-500">
                              {assignment.booking?.zone?.name || 'Unzoned'} • {assignment.role}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="tertiary"
                            onClick={() => handleOpenBooking(assignment.bookingId)}
                          >
                            Open
                          </Button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No assignments awaiting routing.
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Upcoming bookings
                </h3>
                <ul className="mt-3 space-y-3">
                  {upcomingBookings.length ? (
                    upcomingBookings.map((booking) => (
                      <li
                        key={booking.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">{booking.title}</p>
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                              {formatDateTime(booking.scheduledStart)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {booking.zone?.name || 'Any zone'} • {booking.company?.name || 'Unassigned company'}
                          </p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No upcoming scheduled work in this window.
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Template traction
                  </h3>
                  <Button size="sm" variant="secondary" onClick={() => handleOpenTemplateEditor()}>
                    New template
                  </Button>
                </div>
                <ul className="mt-3 space-y-3">
                  {templateSummary.length ? (
                    templateSummary.map((template) => (
                      <li
                        key={template.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{template.name}</p>
                            <p className="text-xs text-slate-500">
                              {demandLabel(template.defaultDemandLevel)} • {statusLabel(template.status)}
                            </p>
                          </div>
                          <StatusPill tone={templateTone(template.status)}>
                            {statusLabel(template.status)}
                          </StatusPill>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Templates will appear here once published.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </section>

        <Card padding="lg" className="bg-white shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Bookings</h2>
              <p className="text-sm text-slate-600">
                Inspect live and historical bookings across the reporting window.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone="info">
                Page {currentPage} of {totalPages}
              </StatusPill>
              {overviewState.error ? <StatusPill tone="danger">{overviewState.error}</StatusPill> : null}
            </div>
          </div>

          {overviewState.loading && !overviewState.data ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Company / Zone</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Demand</th>
                    <th className="px-3 py-2">Window</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.length ? (
                    bookings.map((booking) => (
                      <tr key={booking.id} className="text-sm text-slate-700">
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{booking.reference}</span>
                            {booking.outstandingAssignments ? (
                              <span className="text-xs text-slate-500">
                                {booking.outstandingAssignments} assignment
                                {booking.outstandingAssignments === 1 ? '' : 's'} pending
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span>{booking.customer?.name || 'Customer'}</span>
                            <span className="text-xs text-slate-500">{booking.customer?.email || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span>{booking.company?.name || 'Internal booking'}</span>
                            <span className="text-xs text-slate-500">{booking.zone?.name || 'No zone'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill tone={statusTone(booking.status)}>
                            {statusLabel(booking.status)}
                          </StatusPill>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={clsx(
                              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
                              DEMAND_BADGE[booking.demandLevel] || 'bg-slate-100 text-slate-700 ring-slate-200'
                            )}
                          >
                            {demandLabel(booking.demandLevel)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span>{formatDateTime(booking.scheduledStart)}</span>
                            <span className="text-xs text-slate-500">{formatDateTime(booking.scheduledEnd)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600">
                          {formatDateTime(booking.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenBooking(booking.id)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-slate-500">
                        No bookings captured in this window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              Showing {bookings.length ? paginationMeta.offset + bookings.length : 0} of {paginationMeta.total}{' '}
              bookings
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange('previous')}
                disabled={paginationMeta.offset === 0 || overviewState.loading}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange('next')}
                disabled={!paginationMeta.hasMore || overviewState.loading}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-white shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Booking detail</h2>
              <p className="text-sm text-slate-600">
                Adjust lifecycle status, schedule, metadata, and applied templates.
              </p>
            </div>
            {bookingEditor ? (
              <Button type="button" variant="ghost" onClick={() => setBookingEditor(null)}>
                Close detail
              </Button>
            ) : null}
          </div>

          {bookingDetail.error ? <StatusPill tone="danger" className="mt-4">{bookingDetail.error}</StatusPill> : null}

          {bookingDetail.loading && !bookingEditor ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : null}

          {!bookingEditor && !bookingDetail.loading ? (
            <p className="mt-6 text-sm text-slate-500">
              Select a booking to begin editing. Updates apply instantly across web and mobile command centres.
            </p>
          ) : null}

          {bookingEditor ? (
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-8">
                <section className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Lifecycle
                    </h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Status
                        <select
                          value={bookingEditor.status}
                          onChange={(event) => handleBookingEditorChange('status', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleUpdateStatus}
                        loading={bookingDetail.saving}
                      >
                        Update status
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Schedule & SLA
                    </h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <TextInput
                        label="Scheduled start"
                        type="datetime-local"
                        value={bookingEditor.scheduledStart || ''}
                        onChange={(event) => handleBookingEditorChange('scheduledStart', event.target.value)}
                      />
                      <TextInput
                        label="Scheduled end"
                        type="datetime-local"
                        value={bookingEditor.scheduledEnd || ''}
                        onChange={(event) => handleBookingEditorChange('scheduledEnd', event.target.value)}
                      />
                      <TextInput
                        label="SLA deadline"
                        type="datetime-local"
                        value={bookingEditor.slaExpiresAt || ''}
                        onChange={(event) => handleBookingEditorChange('slaExpiresAt', event.target.value)}
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSaveSchedule}
                        loading={bookingDetail.saving}
                      >
                        Save schedule
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Booking content
                    </h3>
                    <div className="mt-4 grid gap-4">
                      <TextInput
                        label="Title"
                        value={bookingEditor.title}
                        onChange={(event) => handleBookingEditorChange('title', event.target.value)}
                      />
                      <FormField id="booking-summary" label="Summary">
                        <textarea
                          id="booking-summary"
                          value={bookingEditor.summary}
                          onChange={(event) => handleBookingEditorChange('summary', event.target.value)}
                          className="fx-text-input min-h-[120px] resize-y"
                        />
                      </FormField>
                      <FormField id="booking-instructions" label="Instructions">
                        <textarea
                          id="booking-instructions"
                          value={bookingEditor.instructions}
                          onChange={(event) => handleBookingEditorChange('instructions', event.target.value)}
                          className="fx-text-input min-h-[160px] resize-y"
                        />
                      </FormField>
                      <FormField id="booking-notes" label="Internal notes" optionalLabel="Visible to staff only">
                        <textarea
                          id="booking-notes"
                          value={bookingEditor.notes}
                          onChange={(event) => handleBookingEditorChange('notes', event.target.value)}
                          className="fx-text-input min-h-[120px] resize-y"
                        />
                      </FormField>
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextInput
                          label="Hero image URL"
                          type="url"
                          value={bookingEditor.heroImageUrl}
                          onChange={(event) => handleBookingEditorChange('heroImageUrl', event.target.value)}
                          optionalLabel="Optional"
                        />
                        <TextInput
                          label="Tags"
                          value={bookingEditor.tagsText}
                          onChange={(event) => handleBookingEditorChange('tagsText', event.target.value)}
                          hint="Comma separated"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                          Demand level
                          <SegmentedControl
                            name="Demand level"
                            className="mt-3"
                            size="sm"
                            value={bookingEditor.demandLevel}
                            options={demandLevels()}
                            onChange={(value) => handleBookingEditorChange('demandLevel', value)}
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                          Template
                          <select
                            value={bookingEditor.templateId || ''}
                            onChange={(event) => handleBookingEditorChange('templateId', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">No template</option>
                            {bookingTemplatesForDetail.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2">
                          <Checkbox
                            label="Auto assignment"
                            description="Dispatch the next available field technician"
                            checked={bookingEditor.autoAssignEnabled}
                            onChange={(event) => handleBookingEditorChange('autoAssignEnabled', event.target.checked)}
                          />
                          <Checkbox
                            label="Allow customer edits"
                            description="Customers can reschedule and adjust contact details"
                            checked={bookingEditor.allowCustomerEdits}
                            onChange={(event) => handleBookingEditorChange('allowCustomerEdits', event.target.checked)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleApplyTemplate(bookingEditor.templateId)}
                            disabled={!bookingEditor.templateId}
                            loading={bookingDetail.saving}
                          >
                            Apply template
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={handleSaveMeta}
                            loading={bookingDetail.saving}
                          >
                            Save booking content
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Checklist
                      </h3>
                      <Button type="button" variant="secondary" size="sm" onClick={handleAddChecklistItem} icon={PlusIcon}>
                        Add item
                      </Button>
                    </div>
                    <div className="mt-4 space-y-4">
                      {bookingEditor.checklist.length ? (
                        bookingEditor.checklist.map((item, index) => (
                          <div key={`checklist-${index}`} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <TextInput
                                label="Label"
                                value={item.label}
                                onChange={(event) => handleChecklistChange(index, 'label', event.target.value)}
                                className="md:flex-1"
                              />
                              <div className="flex gap-2">
                                <TextInput
                                  label="Identifier"
                                  value={item.id}
                                  onChange={(event) => handleChecklistChange(index, 'id', event.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveChecklistItem(index)}
                                  icon={XMarkIcon}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                            <Checkbox
                              label="Mandatory"
                              checked={item.mandatory}
                              onChange={(event) => handleChecklistChange(index, 'mandatory', event.target.checked)}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No checklist steps defined.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Attachments
                      </h3>
                      <Button type="button" variant="secondary" size="sm" onClick={handleAddAttachment} icon={PlusIcon}>
                        Add attachment
                      </Button>
                    </div>
                    <div className="mt-4 space-y-4">
                      {bookingEditor.attachments.length ? (
                        bookingEditor.attachments.map((item, index) => (
                          <div key={`attachment-${index}`} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <TextInput
                                label="Label"
                                value={item.label}
                                onChange={(event) => handleAttachmentChange(index, 'label', event.target.value)}
                              />
                              <TextInput
                                label="URL"
                                type="url"
                                value={item.url}
                                onChange={(event) => handleAttachmentChange(index, 'url', event.target.value)}
                              />
                              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Type
                                <select
                                  value={item.type}
                                  onChange={(event) => handleAttachmentChange(index, 'type', event.target.value)}
                                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  {ATTACHMENT_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAttachment(index)}
                              icon={TrashIcon}
                            >
                              Remove attachment
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No attachments supplied.</p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
              <aside className="space-y-6">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Summary
                  </h3>
                  <dl className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Booking ID</dt>
                      <dd className="font-semibold text-slate-900">{bookingDetail.data?.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Customer</dt>
                      <dd>{bookingDetail.data?.customer?.name || 'Customer'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Company</dt>
                      <dd>{bookingDetail.data?.company?.name || 'Internal booking'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Zone</dt>
                      <dd>{bookingDetail.data?.zone?.name || 'No zone'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Created</dt>
                      <dd>{formatDateTime(bookingDetail.data?.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Last status change</dt>
                      <dd>{formatDateTime(bookingDetail.data?.lastStatusTransitionAt)}</dd>
                    </div>
                  </dl>
                </div>

                {bookingEditor.heroImageUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <img
                      src={bookingEditor.heroImageUrl}
                      alt="Booking hero"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}
        </Card>

        <Card id="create-booking" padding="lg" className="bg-white shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Create booking</h2>
              <p className="text-sm text-slate-600">
                Raise a booking directly from the control centre, applying templates and SLA guardrails.
              </p>
            </div>
            {createState.success ? <StatusPill tone="success">{createState.success}</StatusPill> : null}
            {createState.error ? <StatusPill tone="danger">{createState.error}</StatusPill> : null}
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleCreateBooking}>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                label="Customer email"
                type="email"
                value={createState.form.customerEmail}
                onChange={(event) => handleCreateChange('customerEmail', event.target.value)}
                required
              />
              <TextInput
                label="Customer first name"
                value={createState.form.customerFirstName}
                onChange={(event) => handleCreateChange('customerFirstName', event.target.value)}
              />
              <TextInput
                label="Customer last name"
                value={createState.form.customerLastName}
                onChange={(event) => handleCreateChange('customerLastName', event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Company
                <select
                  value={createState.form.companyId}
                  onChange={(event) => handleCreateChange('companyId', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select company</option>
                  {referenceData.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Zone
                <select
                  value={createState.form.zoneId}
                  onChange={(event) => handleCreateChange('zoneId', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select zone</option>
                  {referenceData.zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Template
                <select
                  value={createState.form.templateId}
                  onChange={(event) => handleCreateChange('templateId', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No template</option>
                  {templateSelectOptions.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Booking type
                <SegmentedControl
                  name="Booking type"
                  className="mt-3"
                  size="sm"
                  value={createState.form.type}
                  options={bookingTypes()}
                  onChange={(value) => handleCreateChange('type', value)}
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Demand level
                <SegmentedControl
                  name="Demand level"
                  className="mt-3"
                  size="sm"
                  value={createState.form.demandLevel}
                  options={demandLevels()}
                  onChange={(value) => handleCreateChange('demandLevel', value)}
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Base amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createState.form.baseAmount}
                  onChange={(event) => handleCreateChange('baseAmount', event.target.value)}
                  optionalLabel="Optional"
                />
                <TextInput
                  label="Currency"
                  value={createState.form.currency}
                  onChange={(event) => handleCreateChange('currency', event.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Scheduled start"
                type="datetime-local"
                value={createState.form.scheduledStart}
                onChange={(event) => handleCreateChange('scheduledStart', event.target.value)}
              />
              <TextInput
                label="Scheduled end"
                type="datetime-local"
                value={createState.form.scheduledEnd}
                onChange={(event) => handleCreateChange('scheduledEnd', event.target.value)}
              />
            </div>
            <FormField id="create-summary" label="Summary">
              <textarea
                id="create-summary"
                value={createState.form.summary}
                onChange={(event) => handleCreateChange('summary', event.target.value)}
                className="fx-text-input min-h-[120px] resize-y"
              />
            </FormField>
            <FormField id="create-notes" label="Internal notes">
              <textarea
                id="create-notes"
                value={createState.form.notes}
                onChange={(event) => handleCreateChange('notes', event.target.value)}
                className="fx-text-input min-h-[120px] resize-y"
              />
            </FormField>
            <TextInput
              label="Hero image URL"
              type="url"
              value={createState.form.heroImageUrl}
              onChange={(event) => handleCreateChange('heroImageUrl', event.target.value)}
              optionalLabel="Optional"
            />

            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={createState.saving} icon={PlusIcon}>
                Create booking
              </Button>
            </div>
          </form>
        </Card>

        <Card padding="lg" className="bg-white shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Booking guardrails</h2>
              <p className="text-sm text-slate-600">
                Update platform-wide automation, SLA cadences, and document requirements.
              </p>
            </div>
            {settingsState.success ? <StatusPill tone="success">{settingsState.success}</StatusPill> : null}
            {settingsState.error ? <StatusPill tone="danger">{settingsState.error}</StatusPill> : null}
          </div>

          {settingsState.loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : null}

          {settingsState.data ? (
            <form className="mt-6 space-y-8" onSubmit={handleSettingsSubmit}>
              <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Automation
                </h3>
                <Checkbox
                  label="Auto assignment enabled"
                  description="Allow dispatch to automatically assign the next available technician."
                  checked={settingsState.data.autoAssignEnabled}
                  onChange={(event) => handleSettingsChange('autoAssignEnabled', event.target.checked)}
                />
                <Checkbox
                  label="Allow manual assignments"
                  description="Operations managers can manually override assignments."
                  checked={settingsState.data.allowManualAssignments}
                  onChange={(event) => handleSettingsChange('allowManualAssignments', event.target.checked)}
                />
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Default demand level
                  <select
                    value={settingsState.data.defaultDemandLevel}
                    onChange={(event) => handleSettingsChange('defaultDemandLevel', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {demandLevels().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <TextInput
                  label="Default currency"
                  value={settingsState.data.defaultCurrency}
                  onChange={(event) => handleSettingsChange('defaultCurrency', event.target.value.toUpperCase())}
                />
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Service levels</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextInput
                    label="On-demand SLA (minutes)"
                    type="number"
                    min="5"
                    value={settingsState.data.sla.onDemandMinutes}
                    onChange={(event) => handleSettingsChange('sla.onDemandMinutes', event.target.value)}
                  />
                  <TextInput
                    label="Scheduled SLA (hours)"
                    type="number"
                    min="1"
                    value={settingsState.data.sla.scheduledHours}
                    onChange={(event) => handleSettingsChange('sla.scheduledHours', event.target.value)}
                  />
                  <TextInput
                    label="Follow-up SLA (minutes)"
                    type="number"
                    min="5"
                    value={settingsState.data.sla.followUpMinutes}
                    onChange={(event) => handleSettingsChange('sla.followUpMinutes', event.target.value)}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Cancellations</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextInput
                    label="Cancellation window (hours)"
                    type="number"
                    min="0"
                    value={settingsState.data.cancellation.windowHours}
                    onChange={(event) => handleSettingsChange('cancellation.windowHours', event.target.value)}
                  />
                  <TextInput
                    label="Cancellation fee (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={Number.parseFloat(settingsState.data.cancellation.feePercent ?? 0) * 100}
                    onChange={(event) => handleSettingsChange('cancellation.feePercent', Number(event.target.value) / 100)}
                  />
                  <TextInput
                    label="Grace period (minutes)"
                    type="number"
                    min="0"
                    value={settingsState.data.cancellation.gracePeriodMinutes}
                    onChange={(event) => handleSettingsChange('cancellation.gracePeriodMinutes', event.target.value)}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Reminders</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextInput
                    label="Assignment reminder (minutes)"
                    type="number"
                    min="0"
                    value={settingsState.data.reminders.assignmentMinutes}
                    onChange={(event) => handleSettingsChange('reminders.assignmentMinutes', event.target.value)}
                  />
                  <TextInput
                    label="Start reminder (minutes)"
                    type="number"
                    min="0"
                    value={settingsState.data.reminders.startMinutes}
                    onChange={(event) => handleSettingsChange('reminders.startMinutes', event.target.value)}
                  />
                  <TextInput
                    label="Completion reminder (minutes)"
                    type="number"
                    min="0"
                    value={settingsState.data.reminders.completionMinutes}
                    onChange={(event) => handleSettingsChange('reminders.completionMinutes', event.target.value)}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Documents</h3>
                <Checkbox
                  label="Require risk assessment"
                  checked={settingsState.data.documents.requireRiskAssessment}
                  onChange={(event) => handleSettingsChange('documents.requireRiskAssessment', event.target.checked)}
                />
                <Checkbox
                  label="Require insurance proof"
                  checked={settingsState.data.documents.requireInsuranceProof}
                  onChange={(event) => handleSettingsChange('documents.requireInsuranceProof', event.target.checked)}
                />
                <Checkbox
                  label="Require permit uploads"
                  checked={settingsState.data.documents.requirePermit}
                  onChange={(event) => handleSettingsChange('documents.requirePermit', event.target.checked)}
                />
              </section>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={settingsState.saving}>
                  Save guardrails
                </Button>
              </div>
            </form>
          ) : null}
        </Card>

        <Card padding="lg" className="bg-white shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Template library</h2>
              <p className="text-sm text-slate-600">
                Manage booking templates that prefill demand profiles, attachments, and checklists.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {templatesState.success ? <StatusPill tone="success">{templatesState.success}</StatusPill> : null}
              {templatesState.error ? <StatusPill tone="danger">{templatesState.error}</StatusPill> : null}
              <Button variant="secondary" size="sm" icon={PlusIcon} onClick={() => handleOpenTemplateEditor()}>
                New template
              </Button>
            </div>
          </div>

          {templatesState.loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : null}

          {!templatesState.loading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {templatesState.data.length ? (
                templatesState.data.map((template) => (
                  <Card key={template.id} padding="lg" className="bg-white shadow-sm shadow-primary/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{template.name}</h3>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                          {statusLabel(template.status)} • {demandLabel(template.defaultDemandLevel)} demand
                        </p>
                      </div>
                      <StatusPill tone={templateTone(template.status)}>{statusLabel(template.status)}</StatusPill>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={PencilSquareIcon}
                        onClick={() => handleOpenTemplateEditor(template)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={TrashIcon}
                        onClick={() => handleArchiveTemplate(template.id)}
                      >
                        Archive
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                  No templates available yet. Create one to accelerate booking creation.
                </div>
              )}
            </div>
          ) : null}
        </Card>
      </div>

      {templateEditor.open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-10">
          <div className="w-full max-w-4xl">
            <Card padding="lg" className="relative bg-white shadow-2xl">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-primary">
                    {templateEditor.form.id ? 'Edit template' : 'Create template'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Configure demand defaults, checklists, and attachments applied to new bookings.
                  </p>
                </div>
                <Button variant="ghost" size="sm" icon={XMarkIcon} onClick={handleCloseTemplateEditor}>
                  Close
                </Button>
              </div>

              <form className="mt-6 space-y-6" onSubmit={handleTemplateSubmit}>
                {templateEditor.error ? <StatusPill tone="danger">{templateEditor.error}</StatusPill> : null}
                {templateEditor.success ? <StatusPill tone="success">{templateEditor.success}</StatusPill> : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="Template name"
                    value={templateEditor.form.name}
                    onChange={(event) => handleTemplateFieldChange('name', event.target.value)}
                    required
                  />
                  <TextInput
                    label="Slug"
                    value={templateEditor.form.slug}
                    onChange={(event) => handleTemplateFieldChange('slug', event.target.value)}
                    required
                  />
                  <TextInput
                    label="Category"
                    value={templateEditor.form.category}
                    onChange={(event) => handleTemplateFieldChange('category', event.target.value)}
                  />
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Status
                    <select
                      value={templateEditor.form.status}
                      onChange={(event) => handleTemplateFieldChange('status', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {templateStatuses().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Booking type
                    <SegmentedControl
                      name="Template booking type"
                      className="mt-3"
                      size="sm"
                      value={templateEditor.form.defaultType}
                      options={bookingTypes()}
                      onChange={(value) => handleTemplateFieldChange('defaultType', value)}
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Demand level
                    <SegmentedControl
                      name="Template demand level"
                      className="mt-3"
                      size="sm"
                      value={templateEditor.form.defaultDemandLevel}
                      options={demandLevels()}
                      onChange={(value) => handleTemplateFieldChange('defaultDemandLevel', value)}
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="Base amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={templateEditor.form.defaultBaseAmount}
                      onChange={(event) => handleTemplateFieldChange('defaultBaseAmount', event.target.value)}
                      optionalLabel="Optional"
                    />
                    <TextInput
                      label="Currency"
                      value={templateEditor.form.defaultCurrency}
                      onChange={(event) => handleTemplateFieldChange('defaultCurrency', event.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="Duration (minutes)"
                    type="number"
                    min="0"
                    value={templateEditor.form.defaultDurationMinutes}
                    onChange={(event) => handleTemplateFieldChange('defaultDurationMinutes', event.target.value)}
                  />
                  <TextInput
                    label="Hero image URL"
                    type="url"
                    value={templateEditor.form.heroImageUrl}
                    onChange={(event) => handleTemplateFieldChange('heroImageUrl', event.target.value)}
                    optionalLabel="Optional"
                  />
                </div>

                <FormField id="template-description" label="Description">
                  <textarea
                    id="template-description"
                    value={templateEditor.form.description}
                    onChange={(event) => handleTemplateFieldChange('description', event.target.value)}
                    className="fx-text-input min-h-[120px] resize-y"
                  />
                </FormField>

                <FormField id="template-instructions" label="Instructions">
                  <textarea
                    id="template-instructions"
                    value={templateEditor.form.instructions}
                    onChange={(event) => handleTemplateFieldChange('instructions', event.target.value)}
                    className="fx-text-input min-h-[160px] resize-y"
                  />
                </FormField>

                <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Checklist</h3>
                    <Button type="button" variant="secondary" size="sm" onClick={addTemplateChecklistItem} icon={PlusIcon}>
                      Add item
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {templateEditor.form.checklist.length ? (
                      templateEditor.form.checklist.map((item, index) => (
                        <div key={`template-checklist-${index}`} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <TextInput
                              label="Label"
                              value={item.label}
                              onChange={(event) => handleTemplateChecklistChange(index, 'label', event.target.value)}
                              className="md:flex-1"
                            />
                            <div className="flex gap-2">
                              <TextInput
                                label="Identifier"
                                value={item.id}
                                onChange={(event) => handleTemplateChecklistChange(index, 'id', event.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTemplateChecklistItem(index)}
                                icon={XMarkIcon}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                          <Checkbox
                            label="Mandatory"
                            checked={item.mandatory}
                            onChange={(event) => handleTemplateChecklistChange(index, 'mandatory', event.target.checked)}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No checklist items configured.</p>
                    )}
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Attachments</h3>
                    <Button type="button" variant="secondary" size="sm" onClick={addTemplateAttachment} icon={PlusIcon}>
                      Add attachment
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {templateEditor.form.attachments.length ? (
                      templateEditor.form.attachments.map((item, index) => (
                        <div key={`template-attachment-${index}`} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <TextInput
                              label="Label"
                              value={item.label}
                              onChange={(event) => handleTemplateAttachmentChange(index, 'label', event.target.value)}
                            />
                            <TextInput
                              label="URL"
                              type="url"
                              value={item.url}
                              onChange={(event) => handleTemplateAttachmentChange(index, 'url', event.target.value)}
                            />
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                              Type
                              <select
                                value={item.type}
                                onChange={(event) => handleTemplateAttachmentChange(index, 'type', event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                {ATTACHMENT_TYPES.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTemplateAttachment(index)}
                            icon={TrashIcon}
                          >
                            Remove attachment
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No attachments configured.</p>
                    )}
                  </div>
                </section>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={handleCloseTemplateEditor}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={templateEditor.saving}>
                    Save template
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

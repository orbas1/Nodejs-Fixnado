import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  PlusIcon,
  Squares2X2Icon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  SegmentedControl,
  Spinner,
  StatusPill,
  TextInput
} from '../components/ui/index.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';
import {
  archiveAdminTaxonomyCategory,
  archiveAdminTaxonomyType,
  fetchAdminTaxonomy,
  upsertAdminTaxonomyCategory,
  upsertAdminTaxonomyType
} from '../api/adminTaxonomyClient.js';

const TYPE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

const CATEGORY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' }
];

const feedbackToneStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700'
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function createClientId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function splitList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function joinList(value) {
  if (!Array.isArray(value)) {
    return '';
  }
  return value.join(', ');
}

function toNumber(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function formatCount(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numeric.toLocaleString();
}

function formatDate(value) {
  if (!value) {
    return 'Awaiting updates';
  }
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    return 'Awaiting updates';
  }
}

function computeMetaSnapshot(types, categories) {
  const totals = {
    types: types.length,
    activeTypes: types.filter((type) => type.status === 'active').length,
    archivedTypes: types.filter((type) => type.status === 'archived').length,
    categories: categories.length,
    activeCategories: categories.filter((category) => category.status === 'active').length,
    archivedCategories: categories.filter((category) => category.status === 'archived').length,
    featuredCategories: categories.filter((category) => category.isFeatured).length
  };

  const timestamps = [...types, ...categories]
    .map((entry) => {
      if (entry.updatedAt) {
        const value = new Date(entry.updatedAt).getTime();
        return Number.isFinite(value) ? value : null;
      }
      if (entry.createdAt) {
        const value = new Date(entry.createdAt).getTime();
        return Number.isFinite(value) ? value : null;
      }
      return null;
    })
    .filter((value) => Number.isFinite(value));

  const lastUpdatedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

  return { totals, lastUpdatedAt };
}

function prepareTypeForm(type) {
  return {
    clientId: type.id ?? createClientId('type'),
    id: type.id ?? null,
    name: type.name ?? '',
    key: type.key ?? '',
    description: type.description ?? '',
    accentColor: type.accentColor ?? '',
    icon: type.icon ?? '',
    displayOrder: String(type.displayOrder ?? 0),
    status: type.status ?? 'active',
    metadataDocumentationUrl: type.metadata?.documentationUrl ?? '',
    metadataPlaybookUrl: type.metadata?.playbookUrl ?? '',
    metadataPreviewUrl: type.metadata?.previewUrl ?? '',
    metadataRoleAccess: joinList(type.metadata?.roleAccess),
    metadataNotes: type.metadata?.notes ?? '',
    categoryCount: type.categoryCount ?? 0,
    activeCategoryCount: type.activeCategoryCount ?? 0,
    createdAt: type.createdAt ?? null,
    updatedAt: type.updatedAt ?? null,
    isNew: !type.id,
    isDirty: false,
    isSaving: false
  };
}

function prepareCategoryForm(category) {
  return {
    clientId: category.id ?? createClientId('category'),
    id: category.id ?? null,
    typeId: category.typeId ?? '',
    name: category.name ?? '',
    slug: category.slug ?? '',
    description: category.description ?? '',
    status: category.status ?? 'active',
    displayOrder: String(category.displayOrder ?? 0),
    defaultTags: joinList(category.defaultTags),
    searchKeywords: joinList(category.searchKeywords),
    heroImageUrl: category.heroImageUrl ?? '',
    heroImageAlt: category.heroImageAlt ?? '',
    iconUrl: category.iconUrl ?? '',
    previewUrl: category.previewUrl ?? '',
    isFeatured: Boolean(category.isFeatured),
    metadataAssetPackUrl: category.metadata?.assetPackUrl ?? '',
    metadataContentGuidelines: category.metadata?.contentGuidelines ?? '',
    metadataHeroVideoUrl: category.metadata?.heroVideoUrl ?? '',
    metadataRoleAccess: joinList(category.metadata?.roleAccess),
    metadataNotes: category.metadata?.notes ?? '',
    typeKey: category.typeKey ?? null,
    typeName: category.typeName ?? null,
    createdAt: category.createdAt ?? null,
    updatedAt: category.updatedAt ?? null,
    isNew: !category.id,
    isDirty: false,
    isSaving: false
  };
}

function createEmptyTypeForm() {
  return {
    clientId: createClientId('type'),
    id: null,
    name: '',
    key: '',
    description: '',
    accentColor: '',
    icon: '',
    displayOrder: '0',
    status: 'active',
    metadataDocumentationUrl: '',
    metadataPlaybookUrl: '',
    metadataPreviewUrl: '',
    metadataRoleAccess: '',
    metadataNotes: '',
    categoryCount: 0,
    activeCategoryCount: 0,
    createdAt: null,
    updatedAt: null,
    isNew: true,
    isDirty: true,
    isSaving: false
  };
}

function createEmptyCategoryForm(defaultTypeId = '') {
  return {
    clientId: createClientId('category'),
    id: null,
    typeId: defaultTypeId ?? '',
    name: '',
    slug: '',
    description: '',
    status: 'active',
    displayOrder: '0',
    defaultTags: '',
    searchKeywords: '',
    heroImageUrl: '',
    heroImageAlt: '',
    iconUrl: '',
    previewUrl: '',
    isFeatured: false,
    metadataAssetPackUrl: '',
    metadataContentGuidelines: '',
    metadataHeroVideoUrl: '',
    metadataRoleAccess: '',
    metadataNotes: '',
    typeKey: null,
    typeName: null,
    createdAt: null,
    updatedAt: null,
    isNew: true,
    isDirty: true,
    isSaving: false
  };
}

export default function AdminTaxonomy() {
  const { isAuthenticated } = useAdminSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const loadTaxonomy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAdminTaxonomy({ includeArchived: true });
      const hydratedTypes = (payload.taxonomy?.types ?? []).map(prepareTypeForm);
      const hydratedCategories = (payload.taxonomy?.categories ?? []).map(prepareCategoryForm);
      setTypes(hydratedTypes);
      setCategories(hydratedCategories);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load taxonomy records');
      setTypes([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadTaxonomy();
  }, [isAuthenticated, loadTaxonomy]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }
    const timeout = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    setTypes((current) => {
      if (current.length === 0) {
        return current;
      }
      const activeCounts = new Map();
      categories.forEach((category) => {
        if (!category.typeId) return;
        const bucket = activeCounts.get(category.typeId) ?? { total: 0, active: 0 };
        if (category.status !== 'archived') {
          bucket.total += 1;
          if (category.status === 'active') {
            bucket.active += 1;
          }
        }
        activeCounts.set(category.typeId, bucket);
      });

      let mutated = false;
      const next = current.map((type) => {
        if (!type.id) {
          return type;
        }
        const stats = activeCounts.get(type.id) ?? { total: 0, active: 0 };
        if (type.categoryCount === stats.total && type.activeCategoryCount === stats.active) {
          return type;
        }
        mutated = true;
        return { ...type, categoryCount: stats.total, activeCategoryCount: stats.active };
      });

      return mutated ? next : current;
    });
  }, [categories]);

  const meta = useMemo(() => computeMetaSnapshot(types, categories), [types, categories]);

  const headerMeta = useMemo(
    () => [
      {
        label: 'Service types',
        value: formatCount(meta.totals.types),
        caption: `${formatCount(meta.totals.activeTypes)} active`,
        emphasis: true
      },
      {
        label: 'Categories',
        value: formatCount(meta.totals.categories),
        caption: `${formatCount(meta.totals.activeCategories)} active`
      },
      {
        label: 'Featured categories',
        value: formatCount(meta.totals.featuredCategories ?? 0),
        caption: 'Highlighted in storefront and search'
      },
      {
        label: 'Last updated',
        value: formatDate(meta.lastUpdatedAt),
        caption: 'Includes write operations'
      }
    ],
    [meta]
  );

  const handleRefresh = useCallback(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  const handleTypeChange = useCallback((clientId, field, value) => {
    setFeedback(null);
    setTypes((current) =>
      current.map((type) =>
        type.clientId === clientId
          ? {
              ...type,
              [field]: value,
              isDirty: true
            }
          : type
      )
    );
  }, []);

  const handleCategoryChange = useCallback((clientId, field, value) => {
    setFeedback(null);
    setCategories((current) =>
      current.map((category) =>
        category.clientId === clientId
          ? {
              ...category,
              [field]: value,
              isDirty: true
            }
          : category
      )
    );
  }, []);

  const handleToggleCategoryFeatured = useCallback((clientId, checked) => {
    setFeedback(null);
    setCategories((current) =>
      current.map((category) =>
        category.clientId === clientId
          ? {
              ...category,
              isFeatured: checked,
              isDirty: true
            }
          : category
      )
    );
  }, []);

  const handleSaveType = useCallback(
    async (clientId) => {
      const currentType = types.find((type) => type.clientId === clientId);
      if (!currentType) {
        return;
      }

      const payload = {
        id: currentType.id ?? undefined,
        name: trim(currentType.name),
        key: trim(currentType.key),
        description: trim(currentType.description),
        accentColor: trim(currentType.accentColor) || null,
        icon: trim(currentType.icon) || null,
        displayOrder: toNumber(currentType.displayOrder, 0),
        status: currentType.status,
        metadata: {
          documentationUrl: trim(currentType.metadataDocumentationUrl),
          playbookUrl: trim(currentType.metadataPlaybookUrl),
          previewUrl: trim(currentType.metadataPreviewUrl),
          notes: trim(currentType.metadataNotes),
          roleAccess: splitList(currentType.metadataRoleAccess)
        }
      };

      if (!payload.name) {
        setFeedback({ tone: 'danger', message: 'Enter a name before saving the service type.' });
        return;
      }

      setTypes((state) =>
        state.map((type) =>
          type.clientId === clientId
            ? {
                ...type,
                isSaving: true
              }
            : type
        )
      );

      try {
        const saved = await upsertAdminTaxonomyType(payload);
        setTypes((state) =>
          state.map((type) =>
            type.clientId === clientId
              ? {
                  ...prepareTypeForm(saved ?? {}),
                  clientId,
                  isNew: false,
                  isDirty: false,
                  isSaving: false
                }
              : type
          )
        );
        setCategories((state) =>
          state.map((category) =>
            category.typeId === saved?.id
              ? {
                  ...category,
                  typeName: saved?.name ?? category.typeName,
                  typeKey: saved?.key ?? category.typeKey
                }
              : category
          )
        );
        setFeedback({ tone: 'success', message: 'Service type saved successfully.' });
      } catch (caught) {
        setTypes((state) =>
          state.map((type) =>
            type.clientId === clientId
              ? {
                  ...type,
                  isSaving: false
                }
              : type
          )
        );
        setFeedback({ tone: 'danger', message: caught instanceof Error ? caught.message : 'Unable to save service type.' });
      }
    },
    [types]
  );

  const handleArchiveType = useCallback(
    async (clientId) => {
      const currentType = types.find((type) => type.clientId === clientId);
      if (!currentType) {
        return;
      }

      if (!currentType.id) {
        setTypes((state) => state.filter((type) => type.clientId !== clientId));
        setCategories((state) => state.filter((category) => category.typeId !== currentType.id));
        setFeedback({ tone: 'info', message: 'Draft service type removed.' });
        return;
      }

      if (!window.confirm('Archive this service type and any associated categories?')) {
        return;
      }

      setTypes((state) =>
        state.map((type) =>
          type.clientId === clientId
            ? {
                ...type,
                isSaving: true
              }
            : type
        )
      );

      try {
        const archived = await archiveAdminTaxonomyType(currentType.id);
        setTypes((state) =>
          state.map((type) =>
            type.clientId === clientId
              ? {
                  ...prepareTypeForm(archived ?? {}),
                  clientId,
                  status: 'archived',
                  isSaving: false,
                  isDirty: false
                }
              : type
          )
        );
        setCategories((state) =>
          state.map((category) =>
            category.typeId === currentType.id
              ? {
                  ...category,
                  status: 'archived'
                }
              : category
          )
        );
        setFeedback({ tone: 'info', message: 'Service type archived. Categories were archived as well.' });
      } catch (caught) {
        setTypes((state) =>
          state.map((type) =>
            type.clientId === clientId
              ? {
                  ...type,
                  isSaving: false
                }
              : type
          )
        );
        setFeedback({ tone: 'danger', message: caught instanceof Error ? caught.message : 'Unable to archive service type.' });
      }
    },
    [types]
  );

  const handleSaveCategory = useCallback(
    async (clientId) => {
      const currentCategory = categories.find((category) => category.clientId === clientId);
      if (!currentCategory) {
        return;
      }

      if (!trim(currentCategory.typeId)) {
        setFeedback({ tone: 'danger', message: 'Select an active service type before saving the category.' });
        return;
      }

      const payload = {
        id: currentCategory.id ?? undefined,
        typeId: currentCategory.typeId,
        name: trim(currentCategory.name),
        slug: trim(currentCategory.slug),
        description: trim(currentCategory.description),
        status: currentCategory.status,
        displayOrder: toNumber(currentCategory.displayOrder, 0),
        defaultTags: splitList(currentCategory.defaultTags),
        searchKeywords: splitList(currentCategory.searchKeywords),
        heroImageUrl: trim(currentCategory.heroImageUrl),
        heroImageAlt: trim(currentCategory.heroImageAlt),
        iconUrl: trim(currentCategory.iconUrl),
        previewUrl: trim(currentCategory.previewUrl),
        isFeatured: currentCategory.isFeatured,
        metadata: {
          assetPackUrl: trim(currentCategory.metadataAssetPackUrl),
          contentGuidelines: trim(currentCategory.metadataContentGuidelines),
          heroVideoUrl: trim(currentCategory.metadataHeroVideoUrl),
          notes: trim(currentCategory.metadataNotes),
          roleAccess: splitList(currentCategory.metadataRoleAccess)
        }
      };

      if (!payload.name) {
        setFeedback({ tone: 'danger', message: 'Enter a name before saving the category.' });
        return;
      }

      setCategories((state) =>
        state.map((category) =>
          category.clientId === clientId
            ? {
                ...category,
                isSaving: true
              }
            : category
        )
      );

      try {
        const saved = await upsertAdminTaxonomyCategory(payload);
        setCategories((state) =>
          state.map((category) =>
            category.clientId === clientId
              ? {
                  ...prepareCategoryForm(saved ?? {}),
                  clientId,
                  isNew: false,
                  isDirty: false,
                  isSaving: false
                }
              : category
          )
        );
        setFeedback({ tone: 'success', message: 'Category saved successfully.' });
      } catch (caught) {
        setCategories((state) =>
          state.map((category) =>
            category.clientId === clientId
              ? {
                  ...category,
                  isSaving: false
                }
              : category
          )
        );
        setFeedback({ tone: 'danger', message: caught instanceof Error ? caught.message : 'Unable to save category.' });
      }
    },
    [categories]
  );

  const handleArchiveCategory = useCallback(
    async (clientId) => {
      const currentCategory = categories.find((category) => category.clientId === clientId);
      if (!currentCategory) {
        return;
      }

      if (!currentCategory.id) {
        setCategories((state) => state.filter((category) => category.clientId !== clientId));
        setFeedback({ tone: 'info', message: 'Draft category removed.' });
        return;
      }

      if (!window.confirm('Archive this category? It will no longer appear in storefronts or dashboards.')) {
        return;
      }

      setCategories((state) =>
        state.map((category) =>
          category.clientId === clientId
            ? {
                ...category,
                isSaving: true
              }
            : category
        )
      );

      try {
        const archived = await archiveAdminTaxonomyCategory(currentCategory.id);
        setCategories((state) =>
          state.map((category) =>
            category.clientId === clientId
              ? {
                  ...prepareCategoryForm(archived ?? {}),
                  clientId,
                  status: 'archived',
                  isSaving: false,
                  isDirty: false
                }
              : category
          )
        );
        setFeedback({ tone: 'info', message: 'Category archived successfully.' });
      } catch (caught) {
        setCategories((state) =>
          state.map((category) =>
            category.clientId === clientId
              ? {
                  ...category,
                  isSaving: false
                }
              : category
          )
        );
        setFeedback({ tone: 'danger', message: caught instanceof Error ? caught.message : 'Unable to archive category.' });
      }
    },
    [categories]
  );

  const handleAddType = useCallback(() => {
    setFeedback(null);
    setTypes((current) => [...current, createEmptyTypeForm()]);
  }, []);

  const handleAddCategory = useCallback(() => {
    setFeedback(null);
    const defaultTypeId = types.find((type) => type.id && type.status !== 'archived')?.id ?? '';
    setCategories((current) => [...current, createEmptyCategoryForm(defaultTypeId)]);
  }, [types]);

  const editableTypes = useMemo(() => types.filter((type) => type.status !== 'archived'), [types]);
  const editableCategories = useMemo(
    () => categories.filter((category) => category.status !== 'archived'),
    [categories]
  );

  const savedTypeOptions = useMemo(
    () =>
      types
        .filter((type) => type.id && type.status !== 'archived')
        .map((type) => ({ value: type.id, label: type.name || type.key || 'Service type' })),
    [types]
  );

  return (
    <>
      <PageHeader
        eyebrow="Admin Control Tower"
        title="Taxonomies & categories"
        description="Curate service groupings, storefront imagery, and role-specific access controls for Fixnado tenants."
        breadcrumbs={[
          { label: 'Admin dashboard', to: '/admin/dashboard' },
          { label: 'Taxonomies' }
        ]}
        actions={[
          {
            label: 'Refresh snapshot',
            variant: 'secondary',
            icon: ArrowPathIcon,
            onClick: handleRefresh,
            disabled: loading
          }
        ]}
        meta={headerMeta}
      />
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        {feedback ? (
          <div className={clsx('rounded-2xl border p-4 text-sm shadow-sm', feedbackToneStyles[feedback.tone] ?? feedbackToneStyles.info)}>
            {feedback.message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}
        {loading ? (
          <Card className="flex min-h-[220px] items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="sr-only">Loading taxonomy configuration</span>
          </Card>
        ) : (
          <>
            <Card className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                    <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
                    <span>Service types</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    Group related marketplace services, define automation guardrails, and control which roles can access each
                    stream.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={PlusIcon}
                  onClick={handleAddType}
                  disabled={loading}
                >
                  Add service type
                </Button>
              </div>
              {editableTypes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-600">
                  No service types configured yet. Add your first type to begin organising categories.
                </div>
              ) : (
                <div className="space-y-6">
                  {editableTypes.map((type) => {
                    const canSave = Boolean(trim(type.name)) && !type.isSaving;
                    const previewColor = trim(type.accentColor) || '#1f4ed8';

                    return (
                      <div
                        key={type.clientId}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-primary/5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <StatusPill tone={type.status === 'active' ? 'success' : 'warning'}>
                                {type.status === 'active' ? 'Active' : 'Inactive'}
                              </StatusPill>
                              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Key: {type.key || 'pending'}
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Categories: {formatCount(type.activeCategoryCount)}/{formatCount(type.categoryCount)} active
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-primary">{type.name || 'Untitled service type'}</h3>
                            <p className="max-w-2xl text-sm text-slate-600">
                              {type.description || 'Provide an overview to help operations teams understand the service grouping.'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-xs font-semibold uppercase"
                              style={{ color: previewColor, borderColor: `${previewColor}33` }}
                            >
                              {previewColor.replace('#', '')}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              icon={CheckCircleIcon}
                              iconPosition="start"
                              onClick={() => handleSaveType(type.clientId)}
                              disabled={!canSave}
                              loading={type.isSaving}
                            >
                              Save changes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              icon={TrashIcon}
                              iconPosition="start"
                              onClick={() => handleArchiveType(type.clientId)}
                              disabled={type.isSaving}
                            >
                              Archive
                            </Button>
                          </div>
                        </div>
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                          <FormField id={`type-name-${type.clientId}`} label="Display name">
                            <TextInput
                              value={type.name}
                              onChange={(event) => handleTypeChange(type.clientId, 'name', event.target.value)}
                              placeholder="e.g. Trade services"
                              required
                            />
                          </FormField>
                          <FormField id={`type-key-${type.clientId}`} label="Key">
                            <TextInput
                              value={type.key}
                              onChange={(event) => handleTypeChange(type.clientId, 'key', event.target.value)}
                              placeholder="trade-services"
                            />
                          </FormField>
                          <div className="lg:col-span-2">
                            <FormField id={`type-description-${type.clientId}`} label="Description" optionalLabel="Optional">
                              <textarea
                                id={`type-description-${type.clientId}`}
                                value={type.description}
                                onChange={(event) => handleTypeChange(type.clientId, 'description', event.target.value)}
                                className="fx-text-input min-h-[112px]"
                                placeholder="Outline how this service grouping should be positioned."
                              />
                            </FormField>
                          </div>
                          <FormField id={`type-accent-${type.clientId}`} label="Accent colour" optionalLabel="HEX or CSS variable">
                            <TextInput
                              value={type.accentColor}
                              onChange={(event) => handleTypeChange(type.clientId, 'accentColor', event.target.value)}
                              placeholder="#1F4ED8"
                            />
                          </FormField>
                          <FormField id={`type-icon-${type.clientId}`} label="Icon reference" optionalLabel="Optional">
                            <TextInput
                              value={type.icon}
                              onChange={(event) => handleTypeChange(type.clientId, 'icon', event.target.value)}
                              placeholder="e.g. squares-2x2"
                            />
                          </FormField>
                          <FormField id={`type-display-${type.clientId}`} label="Display order" optionalLabel="0 = top">
                            <TextInput
                              type="number"
                              value={type.displayOrder}
                              onChange={(event) => handleTypeChange(type.clientId, 'displayOrder', event.target.value)}
                              min="0"
                            />
                          </FormField>
                          <div className="space-y-2">
                            <span className="text-sm font-semibold text-slate-700">Availability</span>
                            <SegmentedControl
                              name={`type-status-${type.clientId}`}
                              size="sm"
                              value={type.status === 'inactive' ? 'inactive' : 'active'}
                              options={TYPE_STATUS_OPTIONS}
                              onChange={(next) => handleTypeChange(type.clientId, 'status', next)}
                            />
                          </div>
                        </div>
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                          <FormField id={`type-docs-${type.clientId}`} label="Documentation URL" optionalLabel="Optional">
                            <TextInput
                              type="url"
                              value={type.metadataDocumentationUrl}
                              onChange={(event) =>
                                handleTypeChange(type.clientId, 'metadataDocumentationUrl', event.target.value)
                              }
                              placeholder="https://docs.fixnado.com/service-type"
                            />
                          </FormField>
                          <FormField id={`type-playbook-${type.clientId}`} label="Playbook URL" optionalLabel="Optional">
                            <TextInput
                              type="url"
                              value={type.metadataPlaybookUrl}
                              onChange={(event) =>
                                handleTypeChange(type.clientId, 'metadataPlaybookUrl', event.target.value)
                              }
                              placeholder="https://internal.fixnado.com/playbooks"
                            />
                          </FormField>
                          <FormField id={`type-preview-${type.clientId}`} label="Preview URL" optionalLabel="Optional">
                            <TextInput
                              type="url"
                              value={type.metadataPreviewUrl}
                              onChange={(event) =>
                                handleTypeChange(type.clientId, 'metadataPreviewUrl', event.target.value)
                              }
                              placeholder="https://fixnado.com/services?type=trade-services"
                            />
                          </FormField>
                          <FormField
                            id={`type-roles-${type.clientId}`}
                            label="Role access"
                            optionalLabel="Comma separated canonical roles"
                          >
                            <TextInput
                              value={type.metadataRoleAccess}
                              onChange={(event) =>
                                handleTypeChange(type.clientId, 'metadataRoleAccess', event.target.value)
                              }
                              placeholder="admin, operations, provider_admin"
                            />
                          </FormField>
                          <div className="lg:col-span-2">
                            <FormField id={`type-notes-${type.clientId}`} label="Operational notes" optionalLabel="Optional">
                              <textarea
                                id={`type-notes-${type.clientId}`}
                                value={type.metadataNotes}
                                onChange={(event) => handleTypeChange(type.clientId, 'metadataNotes', event.target.value)}
                                className="fx-text-input min-h-[96px]"
                                placeholder="Document rollout plans, dependencies, or governance notes."
                              />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                    <TagIcon className="h-4 w-4" aria-hidden="true" />
                    <span>Categories</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    Configure storefront presentation, hero assets, and audience controls for each service category.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={PlusIcon}
                  onClick={handleAddCategory}
                  disabled={loading}
                >
                  Add category
                </Button>
              </div>
              {types.filter((type) => type.id && type.status !== 'archived').length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-800">
                  Create and save at least one service type before assigning categories.
                </div>
              ) : null}
              {editableCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-600">
                  No categories configured yet. Add categories to populate storefront navigation and dashboards.
                </div>
              ) : (
                <div className="space-y-6">
                  {editableCategories.map((category) => {
                    const previewTarget = trim(category.previewUrl)
                      || (trim(category.slug) ? `/services?category=${encodeURIComponent(trim(category.slug))}` : null);
                    const canSave = Boolean(trim(category.name)) && Boolean(trim(category.typeId)) && !category.isSaving;

                    return (
                      <div
                        key={category.clientId}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-primary/5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <StatusPill
                                tone={
                                  category.status === 'active'
                                    ? 'success'
                                    : category.status === 'draft'
                                      ? 'info'
                                      : 'warning'
                                }
                              >
                                {category.status === 'active'
                                  ? 'Active'
                                  : category.status === 'draft'
                                    ? 'Draft'
                                    : 'Inactive'}
                              </StatusPill>
                              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Type: {category.typeName || 'Unassigned'}
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Slug: {category.slug || 'pending'}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-primary">{category.name || 'Untitled category'}</h3>
                            <p className="max-w-2xl text-sm text-slate-600">
                              {category.description || 'Describe the services, SLAs, and fulfilment expectations for this category.'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {previewTarget ? (
                              <Button
                                as="a"
                                href={previewTarget}
                                target="_blank"
                                rel="noreferrer"
                                size="sm"
                                variant="ghost"
                                icon={ArrowTopRightOnSquareIcon}
                                iconPosition="end"
                              >
                                Preview
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              icon={CheckCircleIcon}
                              iconPosition="start"
                              onClick={() => handleSaveCategory(category.clientId)}
                              disabled={!canSave}
                              loading={category.isSaving}
                            >
                              Save changes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              icon={TrashIcon}
                              iconPosition="start"
                              onClick={() => handleArchiveCategory(category.clientId)}
                              disabled={category.isSaving}
                            >
                              Archive
                            </Button>
                          </div>
                        </div>
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                          <FormField id={`category-name-${category.clientId}`} label="Display name">
                            <TextInput
                              value={category.name}
                              onChange={(event) => handleCategoryChange(category.clientId, 'name', event.target.value)}
                              placeholder="e.g. Emergency HVAC"
                              required
                            />
                          </FormField>
                          <FormField id={`category-slug-${category.clientId}`} label="Slug">
                            <TextInput
                              value={category.slug}
                              onChange={(event) => handleCategoryChange(category.clientId, 'slug', event.target.value)}
                              placeholder="emergency-hvac"
                            />
                          </FormField>
                          <div className="lg:col-span-2">
                            <FormField id={`category-description-${category.clientId}`} label="Description" optionalLabel="Optional">
                              <textarea
                                id={`category-description-${category.clientId}`}
                                value={category.description}
                                onChange={(event) => handleCategoryChange(category.clientId, 'description', event.target.value)}
                                className="fx-text-input min-h-[112px]"
                                placeholder="Capture the value proposition, certifications, and fulfilment scope for this category."
                              />
                            </FormField>
                          </div>
                          <FormField id={`category-type-${category.clientId}`} label="Service type">
                            <select
                              id={`category-type-${category.clientId}`}
                              value={category.typeId}
                              onChange={(event) => handleCategoryChange(category.clientId, 'typeId', event.target.value)}
                              className="fx-text-input"
                            >
                              <option value="">Select a service type</option>
                              {savedTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField id={`category-status-${category.clientId}`} label="Status">
                            <SegmentedControl
                              name={`category-status-${category.clientId}`}
                              size="sm"
                              value={CATEGORY_STATUS_OPTIONS.some((option) => option.value === category.status)
                                ? category.status
                                : 'inactive'}
                              options={CATEGORY_STATUS_OPTIONS}
                              onChange={(next) => handleCategoryChange(category.clientId, 'status', next)}
                            />
                          </FormField>
                          <FormField id={`category-order-${category.clientId}`} label="Display order" optionalLabel="0 = top">
                            <TextInput
                              type="number"
                              value={category.displayOrder}
                              onChange={(event) => handleCategoryChange(category.clientId, 'displayOrder', event.target.value)}
                              min="0"
                            />
                          </FormField>
                          <FormField
                            id={`category-tags-${category.clientId}`}
                            label="Default tags"
                            optionalLabel="Comma separated"
                          >
                            <TextInput
                              value={category.defaultTags}
                              onChange={(event) => handleCategoryChange(category.clientId, 'defaultTags', event.target.value)}
                              placeholder="emergency, rapid-response"
                            />
                          </FormField>
                          <FormField
                            id={`category-keywords-${category.clientId}`}
                            label="Search keywords"
                            optionalLabel="Comma separated"
                          >
                            <TextInput
                              value={category.searchKeywords}
                              onChange={(event) => handleCategoryChange(category.clientId, 'searchKeywords', event.target.value)}
                              placeholder="outage, urgent repair"
                            />
                          </FormField>
                          <FormField id={`category-hero-${category.clientId}`} label="Hero image URL" optionalLabel="Optional">
                            <TextInput
                              type="url"
                              value={category.heroImageUrl}
                              onChange={(event) => handleCategoryChange(category.clientId, 'heroImageUrl', event.target.value)}
                              placeholder="https://cdn.fixnado.com/media/emergency-hvac.jpg"
                            />
                          </FormField>
                          <FormField id={`category-hero-alt-${category.clientId}`} label="Hero image alt text" optionalLabel="Optional">
                            <TextInput
                              value={category.heroImageAlt}
                              onChange={(event) => handleCategoryChange(category.clientId, 'heroImageAlt', event.target.value)}
                              placeholder="Field engineer repairing rooftop HVAC unit"
                            />
                          </FormField>
                          <FormField id={`category-icon-${category.clientId}`} label="Icon URL" optionalLabel="Optional">
                            <TextInput
                              type="url"
                              value={category.iconUrl}
                              onChange={(event) => handleCategoryChange(category.clientId, 'iconUrl', event.target.value)}
                              placeholder="https://cdn.fixnado.com/icons/hvac.svg"
                            />
                          </FormField>
                          <FormField id={`category-preview-${category.clientId}`} label="Preview URL" optionalLabel="Optional">
                            <TextInput
                              type="url"
                              value={category.previewUrl}
                              onChange={(event) => handleCategoryChange(category.clientId, 'previewUrl', event.target.value)}
                              placeholder="https://fixnado.com/services/emergency-hvac"
                            />
                          </FormField>
                          <div className="space-y-2">
                            <Checkbox
                              id={`category-featured-${category.clientId}`}
                              label="Featured category"
                              description="Promote this category on the home page and dashboards."
                              checked={category.isFeatured}
                              onChange={(event) => handleToggleCategoryFeatured(category.clientId, event.target.checked)}
                            />
                          </div>
                          <FormField
                            id={`category-asset-${category.clientId}`}
                            label="Asset pack URL"
                            optionalLabel="Optional"
                          >
                            <TextInput
                              type="url"
                              value={category.metadataAssetPackUrl}
                              onChange={(event) =>
                                handleCategoryChange(category.clientId, 'metadataAssetPackUrl', event.target.value)
                              }
                              placeholder="https://drive.fixnado.com/asset-packs/emergency-hvac"
                            />
                          </FormField>
                          <FormField
                            id={`category-guidelines-${category.clientId}`}
                            label="Content guidelines"
                            optionalLabel="Optional"
                          >
                            <textarea
                              id={`category-guidelines-${category.clientId}`}
                              value={category.metadataContentGuidelines}
                              onChange={(event) =>
                                handleCategoryChange(category.clientId, 'metadataContentGuidelines', event.target.value)
                              }
                              className="fx-text-input min-h-[96px]"
                              placeholder="Outline messaging, tone, and asset requirements for this category."
                            />
                          </FormField>
                          <FormField
                            id={`category-video-${category.clientId}`}
                            label="Hero video URL"
                            optionalLabel="Optional"
                          >
                            <TextInput
                              type="url"
                              value={category.metadataHeroVideoUrl}
                              onChange={(event) =>
                                handleCategoryChange(category.clientId, 'metadataHeroVideoUrl', event.target.value)
                              }
                              placeholder="https://cdn.fixnado.com/video/emergency-hvac.mp4"
                            />
                          </FormField>
                          <FormField
                            id={`category-roles-${category.clientId}`}
                            label="Role access"
                            optionalLabel="Comma separated canonical roles"
                          >
                            <TextInput
                              value={category.metadataRoleAccess}
                              onChange={(event) =>
                                handleCategoryChange(category.clientId, 'metadataRoleAccess', event.target.value)
                              }
                              placeholder="admin, operations, enterprise"
                            />
                          </FormField>
                          <div className="lg:col-span-2">
                            <FormField id={`category-notes-${category.clientId}`} label="Operational notes" optionalLabel="Optional">
                              <textarea
                                id={`category-notes-${category.clientId}`}
                                value={category.metadataNotes}
                                onChange={(event) => handleCategoryChange(category.clientId, 'metadataNotes', event.target.value)}
                                className="fx-text-input min-h-[96px]"
                                placeholder="Capture escalation paths, underwriting requirements, or review cadences."
                              />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </>
  );
}

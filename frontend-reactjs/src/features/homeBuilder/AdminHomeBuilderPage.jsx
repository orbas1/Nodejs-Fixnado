import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExclamationTriangleIcon,
  GlobeAltIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button, Card, Spinner, StatusPill, TextInput } from '../../components/ui/index.js';
import {
  listAdminHomePages,
  createAdminHomePage,
  getAdminHomePage,
  updateAdminHomePage,
  publishAdminHomePage,
  archiveAdminHomePage,
  deleteAdminHomePage,
  createAdminHomePageSection,
  updateAdminHomePageSection,
  reorderAdminHomePageSection,
  deleteAdminHomePageSection,
  createAdminHomePageComponent,
  updateAdminHomePageComponent,
  reorderAdminHomePageComponent,
  deleteAdminHomePageComponent,
  duplicateAdminHomePage,
  duplicateAdminHomePageSection,
  duplicateAdminHomePageComponent
} from '../../api/adminHomeBuilderClient.js';
import { useAdminSession } from '../../providers/AdminSessionProvider.jsx';
import PageSidebar from './components/PageSidebar.jsx';
import PageSettingsForm from './components/PageSettingsForm.jsx';
import SectionEditor from './components/SectionEditor.jsx';
import { DEFAULT_PAGE_FORM, DEFAULT_SECTION_FORM } from './constants.js';

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function hydratePageForm(page) {
  return {
    ...DEFAULT_PAGE_FORM,
    ...page,
    settings: { ...DEFAULT_PAGE_FORM.settings, ...(page?.settings ?? {}) }
  };
}

function computeComponentCount(page) {
  return (page?.sections ?? []).reduce(
    (acc, section) => acc + ((section.components ?? []).length),
    0
  );
}

export default function AdminHomeBuilderPage() {
  const { user } = useAdminSession();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageDetail, setPageDetail] = useState(null);
  const [pageForm, setPageForm] = useState(DEFAULT_PAGE_FORM);
  const [pageSaving, setPageSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [duplicatingPageId, setDuplicatingPageId] = useState(null);
  const [newSectionForm, setNewSectionForm] = useState({
    title: '',
    layout: DEFAULT_SECTION_FORM.layout
  });
  const [savingSections, setSavingSections] = useState([]);
  const [savingComponents, setSavingComponents] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 6000);
  }, []);

  const refreshPages = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await listAdminHomePages();
      const data = response?.data ?? [];
      setPages(data);
      return data;
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to list pages', error);
      showFeedback('error', error.message || 'Unable to load home pages.');
      throw error;
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [showFeedback]);

  const loadPageDetail = useCallback(
    async (pageId) => {
      if (!pageId) {
        setPageDetail(null);
        setPageForm(DEFAULT_PAGE_FORM);
        return null;
      }
      setPageLoading(true);
      try {
        const response = await getAdminHomePage(pageId);
        const page = response?.data;
        setPageDetail(page);
        setPageForm(hydratePageForm(page));
        return page;
      } catch (error) {
        console.error('[AdminHomeBuilder] failed to load page', error);
        showFeedback('error', error.message || 'Unable to load the selected page.');
        setPageDetail(null);
        setPageForm(DEFAULT_PAGE_FORM);
        return null;
      } finally {
        setPageLoading(false);
      }
    },
    [showFeedback]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await refreshPages();
        if (!mounted) return;
        const initialId = data[0]?.id ?? null;
        setSelectedPageId((current) => current ?? initialId);
        if (initialId) {
          await loadPageDetail(initialId);
        } else {
          setLoading(false);
        }
      } catch {
        /* handled in refresh */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshPages, loadPageDetail]);

  useEffect(() => {
    if (!selectedPageId) {
      setPageDetail(null);
      setPageForm(DEFAULT_PAGE_FORM);
      return;
    }
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      try {
        const response = await getAdminHomePage(selectedPageId);
        if (cancelled) return;
        const page = response?.data;
        setPageDetail(page);
        setPageForm(hydratePageForm(page));
      } catch (error) {
        if (cancelled) return;
        console.error('[AdminHomeBuilder] failed to load page', error);
        showFeedback('error', error.message || 'Unable to load the selected page.');
        setPageDetail(null);
        setPageForm(DEFAULT_PAGE_FORM);
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPageId, showFeedback]);

  const handleSelectPage = (pageId) => {
    setSelectedPageId(pageId);
  };

  const handleCreatePage = async () => {
    try {
      setRefreshing(true);
      const response = await createAdminHomePage({
        name: 'New home page',
        description: 'Draft marketing home page',
        layout: DEFAULT_PAGE_FORM.layout,
        theme: DEFAULT_PAGE_FORM.theme,
        accentColor: DEFAULT_PAGE_FORM.accentColor,
        backgroundColor: DEFAULT_PAGE_FORM.backgroundColor,
        heroLayout: DEFAULT_PAGE_FORM.heroLayout,
        settings: DEFAULT_PAGE_FORM.settings
      });
      const created = response?.data;
      await refreshPages();
      setSelectedPageId(created?.id ?? null);
      if (created?.id) {
        await loadPageDetail(created.id);
      }
      showFeedback('success', 'Created a new marketing home page.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to create page', error);
      showFeedback('error', error.message || 'Unable to create the page.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeletePage = async () => {
    if (!selectedPageId) {
      return;
    }
    if (!window.confirm('Delete this page and all sections?')) {
      return;
    }
    try {
      setPageSaving(true);
      await deleteAdminHomePage(selectedPageId);
      showFeedback('success', 'Deleted page.');
      const data = await refreshPages();
      const nextId = data.find((page) => page.id !== selectedPageId)?.id ?? data[0]?.id ?? null;
      setSelectedPageId(nextId);
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to delete page', error);
      showFeedback('error', error.message || 'Unable to delete page.');
    } finally {
      setPageSaving(false);
    }
  };

  const handleSavePage = async () => {
    if (!selectedPageId) return;
    try {
      setPageSaving(true);
      const response = await updateAdminHomePage(selectedPageId, pageForm);
      const updated = response?.data;
      setPageDetail(updated);
      setPageForm(hydratePageForm(updated));
      await refreshPages();
      showFeedback('success', 'Page settings saved.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to save page', error);
      showFeedback('error', error.message || 'Unable to save page settings.');
    } finally {
      setPageSaving(false);
    }
  };

  const handlePublishPage = async () => {
    if (!selectedPageId) return;
    try {
      setPageSaving(true);
      const response = await publishAdminHomePage(selectedPageId, {});
      const updated = response?.data;
      setPageDetail(updated);
      setPageForm(hydratePageForm(updated));
      await refreshPages();
      showFeedback('success', 'Page published to production.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to publish page', error);
      showFeedback('error', error.message || 'Unable to publish page.');
    } finally {
      setPageSaving(false);
    }
  };

  const handleArchivePage = async () => {
    if (!selectedPageId) return;
    try {
      setPageSaving(true);
      const response = await archiveAdminHomePage(selectedPageId);
      const updated = response?.data;
      setPageDetail(updated);
      setPageForm(hydratePageForm(updated));
      await refreshPages();
      showFeedback('success', 'Page archived.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to archive page', error);
      showFeedback('error', error.message || 'Unable to archive page.');
    } finally {
      setPageSaving(false);
    }
  };

  const markSectionSaving = (id, saving) => {
    setSavingSections((current) => {
      if (saving) {
        return Array.from(new Set([...current, id]));
      }
      return current.filter((item) => item !== id);
    });
  };

  const markComponentSaving = (id, saving) => {
    setSavingComponents((current) => {
      if (saving) {
        return Array.from(new Set([...current, id]));
      }
      return current.filter((item) => item !== id);
    });
  };

  const handleDuplicatePage = async (pageId) => {
    if (!pageId) {
      return;
    }
    setDuplicatingPageId(pageId);
    try {
      const response = await duplicateAdminHomePage(pageId);
      const duplicated = response?.data;
      await refreshPages();
      if (duplicated?.id) {
        setSelectedPageId(duplicated.id);
        await loadPageDetail(duplicated.id);
      }
      showFeedback('success', 'Page duplicated as a new draft.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to duplicate page', error);
      showFeedback('error', error.message || 'Unable to duplicate page.');
    } finally {
      setDuplicatingPageId(null);
    }
  };

  const handleCreateSection = async () => {
    if (!selectedPageId) return;
    try {
      setPageSaving(true);
      const payload = {
        title: newSectionForm.title || `Section ${pageDetail?.sections?.length ? pageDetail.sections.length + 1 : 1}`,
        layout: newSectionForm.layout,
        description: DEFAULT_SECTION_FORM.description,
        backgroundColor: DEFAULT_SECTION_FORM.backgroundColor,
        textColor: DEFAULT_SECTION_FORM.textColor,
        accentColor: DEFAULT_SECTION_FORM.accentColor,
        settings: DEFAULT_SECTION_FORM.settings
      };
      const response = await createAdminHomePageSection(selectedPageId, payload);
      const created = response?.data;
      setPageDetail((current) =>
        current
          ? {
              ...current,
              sections: [...(current.sections ?? []), created].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            }
          : current
      );
      setNewSectionForm({ title: '', layout: DEFAULT_SECTION_FORM.layout });
      await refreshPages();
      showFeedback('success', 'Section created.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to create section', error);
      showFeedback('error', error.message || 'Unable to create section.');
    } finally {
      setPageSaving(false);
    }
  };

  const handleUpdateSection = async (sectionId, payload) => {
    markSectionSaving(sectionId, true);
    try {
      const response = await updateAdminHomePageSection(sectionId, payload);
      const updated = response?.data;
      setPageDetail((current) =>
        current
          ? {
              ...current,
              sections: (current.sections ?? []).map((section) => (section.id === sectionId ? updated : section))
            }
          : current
      );
      await refreshPages();
      showFeedback('success', 'Section updated.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to update section', error);
      showFeedback('error', error.message || 'Unable to update section.');
    } finally {
      markSectionSaving(sectionId, false);
    }
  };

  const handleMoveSection = async (sectionId, direction) => {
    const section = pageDetail?.sections?.find((item) => item.id === sectionId);
    if (!section) return;
    markSectionSaving(sectionId, true);
    try {
      const target = direction === 'up' ? section.position - 1 : section.position + 1;
      const response = await reorderAdminHomePageSection(sectionId, { position: target });
      const ordered = response?.data ?? [];
      setPageDetail((current) => (current ? { ...current, sections: ordered } : current));
      await refreshPages();
      showFeedback('success', 'Section reordered.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to reorder section', error);
      showFeedback('error', error.message || 'Unable to reorder section.');
    } finally {
      markSectionSaving(sectionId, false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Remove this section and its components?')) {
      return;
    }
    markSectionSaving(sectionId, true);
    try {
      await deleteAdminHomePageSection(sectionId);
      setPageDetail((current) =>
        current
          ? { ...current, sections: (current.sections ?? []).filter((section) => section.id !== sectionId) }
          : current
      );
      await refreshPages();
      showFeedback('success', 'Section removed.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to delete section', error);
      showFeedback('error', error.message || 'Unable to delete section.');
    } finally {
      markSectionSaving(sectionId, false);
    }
  };

  const handleDuplicateSection = async (sectionId) => {
    markSectionSaving(sectionId, true);
    try {
      const response = await duplicateAdminHomePageSection(sectionId);
      const sections = response?.data ?? [];
      setPageDetail((current) => (current ? { ...current, sections } : current));
      await refreshPages();
      showFeedback('success', 'Section duplicated.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to duplicate section', error);
      showFeedback('error', error.message || 'Unable to duplicate section.');
    } finally {
      markSectionSaving(sectionId, false);
    }
  };

  const handleCreateComponent = async (sectionId, payload) => {
    markSectionSaving(sectionId, true);
    try {
      const response = await createAdminHomePageComponent(sectionId, payload);
      const created = response?.data;
      setPageDetail((current) =>
        current
          ? {
              ...current,
              sections: (current.sections ?? []).map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      components: [...(section.components ?? []), created].sort(
                        (a, b) => (a.position ?? 0) - (b.position ?? 0)
                      )
                    }
                  : section
              )
            }
          : current
      );
      await refreshPages();
      showFeedback('success', 'Component created.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to create component', error);
      showFeedback('error', error.message || 'Unable to create component.');
    } finally {
      markSectionSaving(sectionId, false);
    }
  };

  const handleUpdateComponent = async (componentId, payload) => {
    markComponentSaving(componentId, true);
    try {
      const response = await updateAdminHomePageComponent(componentId, payload);
      const updated = response?.data;
      setPageDetail((current) => {
        if (!current) return current;
        return {
          ...current,
          sections: (current.sections ?? []).map((section) => ({
            ...section,
            components: (section.components ?? []).map((component) =>
              component.id === componentId ? updated : component
            )
          }))
        };
      });
      await refreshPages();
      showFeedback('success', 'Component updated.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to update component', error);
      showFeedback('error', error.message || 'Unable to update component.');
    } finally {
      markComponentSaving(componentId, false);
    }
  };

  const handleReorderComponent = async (componentId, direction) => {
    const section = pageDetail?.sections?.find((candidate) =>
      candidate.components?.some((component) => component.id === componentId)
    );
    if (!section) return;
    const component = section.components?.find((item) => item.id === componentId);
    if (!component) return;
    markComponentSaving(componentId, true);
    try {
      const target = direction === 'up' ? component.position - 1 : component.position + 1;
      const response = await reorderAdminHomePageComponent(componentId, { position: target });
      const ordered = response?.data ?? [];
      setPageDetail((current) => {
        if (!current) return current;
        return {
          ...current,
          sections: (current.sections ?? []).map((candidate) =>
            candidate.id === section.id ? { ...candidate, components: ordered } : candidate
          )
        };
      });
      await refreshPages();
      showFeedback('success', 'Component reordered.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to reorder component', error);
      showFeedback('error', error.message || 'Unable to reorder component.');
    } finally {
      markComponentSaving(componentId, false);
    }
  };

  const handleDeleteComponent = async (componentId) => {
    if (!window.confirm('Remove this component?')) {
      return;
    }
    markComponentSaving(componentId, true);
    try {
      await deleteAdminHomePageComponent(componentId);
      setPageDetail((current) => {
        if (!current) return current;
        return {
          ...current,
          sections: (current.sections ?? []).map((section) => ({
            ...section,
            components: (section.components ?? []).filter((component) => component.id !== componentId)
          }))
        };
      });
      await refreshPages();
      showFeedback('success', 'Component removed.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to delete component', error);
      showFeedback('error', error.message || 'Unable to delete component.');
    } finally {
      markComponentSaving(componentId, false);
    }
  };

  const handleDuplicateComponent = async (componentId) => {
    markComponentSaving(componentId, true);
    try {
      const response = await duplicateAdminHomePageComponent(componentId);
      const result = response?.data;
      if (result?.sectionId && Array.isArray(result.components)) {
        setPageDetail((current) => {
          if (!current) return current;
          return {
            ...current,
            sections: (current.sections ?? []).map((section) =>
              section.id === result.sectionId ? { ...section, components: result.components } : section
            )
          };
        });
      }
      await refreshPages();
      showFeedback('success', 'Component duplicated.');
    } catch (error) {
      console.error('[AdminHomeBuilder] failed to duplicate component', error);
      showFeedback('error', error.message || 'Unable to duplicate component.');
    } finally {
      markComponentSaving(componentId, false);
    }
  };

  const headerMeta = useMemo(() => {
    return [
      {
        label: 'Status',
        value: pageDetail ? pageDetail.status : 'No page selected',
        caption: pageDetail ? `Last updated ${formatDateTime(pageDetail.updatedAt)}` : 'Create a page to begin',
        emphasis: true
      },
      {
        label: 'Sections',
        value: String(pageDetail?.sections?.length ?? 0),
        caption: 'Modular blocks per page'
      },
      {
        label: 'Components',
        value: String(computeComponentCount(pageDetail)),
        caption: 'Individual widgets inside sections'
      },
      {
        label: 'Editor',
        value: user?.email ?? 'Admin session',
        caption: user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Changes attributed to this account'
      }
    ];
  }, [pageDetail, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      <PageHeader
        eyebrow="Admin Control Centre"
        title="Home page builder"
        description="Compose Fixnado marketing home pages with modular sections, reusable components, and live previews."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Home page builder' }
        ]}
        actions={
          pageDetail && [
            {
              label: 'View live',
              variant: 'tertiary',
              icon: GlobeAltIcon,
              onClick: () => {
                const url = pageDetail.slug ? `/${pageDetail.slug}` : '/';
                window.open(url, '_blank', 'noopener');
              }
            }
          ]
        }
        meta={headerMeta}
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        <PageSidebar
          pages={pages}
          activePageId={selectedPageId}
          loading={loading}
          refreshing={refreshing}
          duplicatingPageId={duplicatingPageId}
          onSelect={handleSelectPage}
          onCreate={handleCreatePage}
          onDuplicate={handleDuplicatePage}
        />

        <div className="space-y-8">
          {feedback && (
            <Card
              className={`flex items-start gap-3 border ${
                feedback.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              <div className="mt-1">
                {feedback.type === 'error' ? (
                  <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {feedback.type === 'error' ? 'Something went wrong' : 'Update complete'}
                </p>
                <p className="text-sm">{feedback.message}</p>
              </div>
            </Card>
          )}

          {loading || pageLoading ? (
            <Card className="flex items-center justify-center gap-3 py-12 text-primary">
              <Spinner className="h-6 w-6" />
              <span className="text-sm font-semibold">Loading workspace…</span>
            </Card>
          ) : pageDetail ? (
            <>
              <PageSettingsForm
                value={pageForm}
                status={pageDetail.status}
                publishedAt={pageDetail.publishedAt}
                disabled={pageDetail.status === 'archived'}
                saving={pageSaving}
                onChange={setPageForm}
                onSubmit={handleSavePage}
                onPublish={handlePublishPage}
                onArchive={handleArchivePage}
                onDelete={handleDeletePage}
              />

              <Card className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Add section</h3>
                  <p className="text-sm text-slate-500">
                    Drop in a new layout block to expand the page. Sections can be reordered and themed individually.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="Section title"
                    value={newSectionForm.title}
                    onChange={(event) => setNewSectionForm((current) => ({ ...current, title: event.target.value }))}
                    disabled={pageSaving}
                  />
                  <label className="fx-field">
                    <span className="fx-field__label">Layout</span>
                    <select
                      className="fx-select"
                      value={newSectionForm.layout}
                      onChange={(event) => setNewSectionForm((current) => ({ ...current, layout: event.target.value }))}
                      disabled={pageSaving}
                    >
                      <option value="full-width">Full width</option>
                      <option value="split">Split columns</option>
                      <option value="grid">Grid</option>
                      <option value="feature">Feature highlight</option>
                    </select>
                  </label>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  icon={PlusIcon}
                  onClick={handleCreateSection}
                  disabled={pageSaving || pageDetail.status === 'archived'}
                >
                  Add section
                </Button>
              </Card>

              <div className="space-y-8">
                {(pageDetail.sections ?? []).map((section, index) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    canMoveUp={index > 0}
                    canMoveDown={index < (pageDetail.sections?.length ?? 0) - 1}
                    disabled={pageDetail.status === 'archived'}
                    saving={savingSections.includes(section.id)}
                    componentSavingIds={savingComponents}
                    onSave={(payload) => handleUpdateSection(section.id, payload)}
                    onMove={(direction) => handleMoveSection(section.id, direction)}
                    onDelete={() => handleDeleteSection(section.id)}
                    onDuplicate={() => handleDuplicateSection(section.id)}
                    onCreateComponent={(payload) => handleCreateComponent(section.id, payload)}
                    onUpdateComponent={(componentId, payload) => handleUpdateComponent(componentId, payload)}
                    onDeleteComponent={(componentId) => handleDeleteComponent(componentId)}
                    onReorderComponent={(componentId, direction) => handleReorderComponent(componentId, direction)}
                    onDuplicateComponent={(componentId) => handleDuplicateComponent(componentId)}
                  />
                ))}
                {!pageDetail.sections?.length && (
                  <Card className="flex items-center justify-between gap-4 border border-dashed border-slate-300 bg-white/60 p-6">
                    <div>
                      <p className="text-base font-semibold text-primary">No sections yet</p>
                      <p className="text-sm text-slate-500">
                        Start by adding your first section — hero, story, CTA, or testimonial modules are ready to use.
                      </p>
                    </div>
                    <StatusPill tone="info">Ready for content</StatusPill>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center text-slate-600">
              <SparklesIcon className="h-10 w-10 text-primary" aria-hidden="true" />
              <p className="text-lg font-semibold text-primary">Create your first marketing home page</p>
              <p className="max-w-md text-sm">
                Launch a new page to orchestrate hero banners, story grids, and testimonials. Every section is modular and fully editable.
              </p>
              <Button type="button" variant="primary" onClick={handleCreatePage} icon={PlusIcon}>
                Create home page
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

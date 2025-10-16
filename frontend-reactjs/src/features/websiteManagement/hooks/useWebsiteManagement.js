import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listWebsitePages,
  getWebsitePage,
  createWebsitePage,
  updateWebsitePage,
  deleteWebsitePage,
  createWebsiteBlock,
  updateWebsiteBlock,
  deleteWebsiteBlock,
  listWebsiteNavigation,
  createWebsiteNavigationMenu,
  updateWebsiteNavigationMenu,
  deleteWebsiteNavigationMenu,
  createWebsiteNavigationItem,
  updateWebsiteNavigationItem,
  deleteWebsiteNavigationItem
} from '../../../api/websiteClient.js';
import { useAdminSession } from '../../../providers/AdminSessionProvider.jsx';
import {
  NEW_PAGE_ID,
  NEW_MENU_ID,
  emptyBlockDraft,
  emptyMenuDraft,
  emptyMenuItemDraft,
  emptyPageDraft
} from '../constants.js';
import {
  generateSlugCandidate,
  isDefaultPreviewPath,
  normalisePreviewPath,
  normaliseSlugInput,
  optionalString,
  parseRoles
} from '../utils/index.js';
import { toBlockForm, toMenuDraft, toMenuItemForm, toPageDraft } from '../utils/transformers.js';

const createPageTouchState = () => ({ slug: false, previewPath: false });

export function useWebsiteManagement() {
  const { isAuthenticated } = useAdminSession();
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageDraft, setPageDraft] = useState({ ...emptyPageDraft });
  const [pageTouched, setPageTouched] = useState(() => createPageTouchState());
  const [blocks, setBlocks] = useState([]);
  const [newBlockDraft, setNewBlockDraft] = useState({ ...emptyBlockDraft });
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingPageDetail, setLoadingPageDetail] = useState(false);
  const [savingPage, setSavingPage] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState({});
  const [creatingBlock, setCreatingBlock] = useState(false);

  const [navigationMenus, setNavigationMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [menuDraft, setMenuDraft] = useState({ ...emptyMenuDraft });
  const [menuItems, setMenuItems] = useState([]);
  const [newMenuItemDraft, setNewMenuItemDraft] = useState({ ...emptyMenuItemDraft });
  const [loadingNavigation, setLoadingNavigation] = useState(true);
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingMenuItems, setSavingMenuItems] = useState({});
  const [creatingMenuItem, setCreatingMenuItem] = useState(false);

  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const loadPages = useCallback(
    async (options = {}) => {
      setLoadingPages(true);
      try {
        const payload = await listWebsitePages();
        const data = payload?.data ?? payload ?? [];
        setPages(data);
        const desiredId = options.selectId ?? selectedPageId;
        if (desiredId === NEW_PAGE_ID) {
          setSelectedPageId(NEW_PAGE_ID);
        } else if (desiredId && data.some((page) => page.id === desiredId)) {
          setSelectedPageId(desiredId);
        } else if (data.length > 0) {
          setSelectedPageId(data[0].id);
        } else {
          setSelectedPageId(null);
        }
      } catch (caught) {
        console.error('Failed to load website pages', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load website pages');
        setPages([]);
        setSelectedPageId(null);
      } finally {
        setLoadingPages(false);
      }
    },
    [selectedPageId]
  );

  const loadNavigation = useCallback(
    async (options = {}) => {
      setLoadingNavigation(true);
      try {
        const payload = await listWebsiteNavigation();
        const data = payload?.data ?? payload ?? [];
        setNavigationMenus(data);
        const desiredId = options.selectId ?? selectedMenuId;
        if (desiredId === NEW_MENU_ID) {
          setSelectedMenuId(NEW_MENU_ID);
        } else if (desiredId && data.some((menu) => menu.id === desiredId)) {
          setSelectedMenuId(desiredId);
        } else if (data.length > 0) {
          setSelectedMenuId(data[0].id);
        } else {
          setSelectedMenuId(null);
        }
      } catch (caught) {
        console.error('Failed to load navigation menus', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load website navigation');
        setNavigationMenus([]);
        setSelectedMenuId(null);
      } finally {
        setLoadingNavigation(false);
      }
    },
    [selectedMenuId]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadPages();
    loadNavigation();
  }, [isAuthenticated, loadPages, loadNavigation]);

  useEffect(() => {
    if (!selectedPageId || selectedPageId === NEW_PAGE_ID) {
      setPageDraft({ ...emptyPageDraft });
      setPageTouched(createPageTouchState());
      setBlocks([]);
      setLoadingPageDetail(false);
      return;
    }

    const controller = new AbortController();
    setLoadingPageDetail(true);
    (async () => {
      try {
        const payload = await getWebsitePage(selectedPageId, { signal: controller.signal });
        const data = payload?.data ?? payload ?? {};
        setPageDraft(toPageDraft(data.page));
        setPageTouched({ slug: true, previewPath: true });
        setBlocks((data.blocks ?? []).map(toBlockForm));
      } catch (caught) {
        if (controller.signal.aborted) return;
        console.error('Failed to load page detail', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load page detail');
        setPageDraft({ ...emptyPageDraft });
        setPageTouched(createPageTouchState());
        setBlocks([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPageDetail(false);
        }
      }
    })();

    return () => controller.abort();
  }, [selectedPageId]);

  useEffect(() => {
    if (!selectedMenuId || selectedMenuId === NEW_MENU_ID) {
      setMenuDraft({ ...emptyMenuDraft });
      setMenuItems([]);
      return;
    }
    const menu = navigationMenus.find((entry) => entry.id === selectedMenuId);
    if (!menu) {
      setMenuDraft({ ...emptyMenuDraft });
      setMenuItems([]);
      return;
    }
    setMenuDraft(toMenuDraft(menu));
    setMenuItems((menu.items ?? []).map(toMenuItemForm));
  }, [navigationMenus, selectedMenuId]);

  const pageSelection = useMemo(
    () =>
      pages.map((page) => ({
        id: page.id,
        title: page.title,
        status: page.status,
        updatedAt: page.updatedAt
      })),
    [pages]
  );

  const menuSelection = useMemo(
    () =>
      navigationMenus.map((menu) => ({
        id: menu.id,
        name: menu.name,
        location: menu.location,
        isPrimary: menu.isPrimary
      })),
    [navigationMenus]
  );

  const showFeedback = useCallback((tone, message) => {
    setFeedback({ tone, message });
    window.setTimeout(() => {
      setFeedback(null);
    }, 5000);
  }, []);

  const handlePageTitleChange = useCallback(
    (event) => {
      const nextTitle = event.target.value;
      setPageDraft((current) => {
        const nextState = { ...current, title: nextTitle };
        if (!pageTouched.slug) {
          const autoSlug = generateSlugCandidate(nextTitle);
          nextState.slug = autoSlug;
        }
        if (!pageTouched.previewPath) {
          const referenceSlug = !pageTouched.slug ? generateSlugCandidate(nextTitle) : nextState.slug;
          if (isDefaultPreviewPath(current.previewPath, current.slug) || !current.previewPath) {
            nextState.previewPath = referenceSlug ? `/${referenceSlug}` : '';
          }
        }
        return nextState;
      });
    },
    [pageTouched.slug, pageTouched.previewPath]
  );

  const handlePageSlugChange = useCallback(
    (event) => {
      const input = event.target.value;
      setPageTouched((current) => ({ ...current, slug: true }));
      setPageDraft((current) => ({ ...current, slug: input }));
    },
    []
  );

  const handlePageSlugBlur = useCallback(() => {
    setPageDraft((current) => {
      const normalised = normaliseSlugInput(current.slug);
      if (normalised === current.slug) {
        return current;
      }
      const nextState = { ...current, slug: normalised };
      if (!pageTouched.previewPath && isDefaultPreviewPath(current.previewPath, current.slug)) {
        nextState.previewPath = normalisePreviewPath(current.previewPath, normalised);
      }
      return nextState;
    });
  }, [pageTouched.previewPath]);

  const regenerateSlug = useCallback(() => {
    let generated = null;
    let previewUpdated = false;
    setPageTouched((current) => ({ ...current, slug: true }));
    setPageDraft((current) => {
      const source = current.title || current.slug;
      const nextSlug = generateSlugCandidate(source);
      if (!nextSlug) {
        return current;
      }
      generated = nextSlug;
      const nextState = { ...current, slug: nextSlug };
      if (!pageTouched.previewPath && isDefaultPreviewPath(current.previewPath, current.slug)) {
        nextState.previewPath = normalisePreviewPath(current.previewPath, nextSlug);
        previewUpdated = true;
      }
      return nextState;
    });

    if (!generated) {
      showFeedback('danger', 'Add a title before generating a slug');
    } else if (previewUpdated) {
      showFeedback('info', 'Slug and preview path updated');
    }
  }, [pageTouched.previewPath, showFeedback]);

  const handlePreviewPathChange = useCallback((event) => {
    const nextValue = event.target.value;
    setPageTouched((current) => ({ ...current, previewPath: true }));
    setPageDraft((current) => ({ ...current, previewPath: nextValue }));
  }, []);

  const handlePreviewPathBlur = useCallback(() => {
    setPageDraft((current) => {
      const normalised = normalisePreviewPath(current.previewPath, current.slug);
      if (normalised === current.previewPath) {
        return current;
      }
      return { ...current, previewPath: normalised };
    });
  }, []);

  const syncPreviewPath = useCallback(() => {
    setPageTouched((current) => ({ ...current, previewPath: true }));
    setPageDraft((current) => {
      const slug = current.slug || generateSlugCandidate(current.title);
      return { ...current, previewPath: normalisePreviewPath(current.previewPath, slug) };
    });
  }, []);

  const selectPage = useCallback((pageId) => {
    if (pageId === NEW_PAGE_ID) {
      setSelectedPageId(NEW_PAGE_ID);
      setPageDraft({ ...emptyPageDraft });
      setPageTouched(createPageTouchState());
      setBlocks([]);
      return;
    }
    setSelectedPageId(pageId);
  }, []);

  const savePage = useCallback(async () => {
    if (!pageDraft.title?.trim()) {
      showFeedback('danger', 'Page title is required');
      return;
    }

    let metadata;
    try {
      metadata = pageDraft.metadata && pageDraft.metadata.trim() ? JSON.parse(pageDraft.metadata) : {};
    } catch {
      showFeedback('danger', 'Page metadata must be valid JSON');
      return;
    }

    const payload = {
      title: pageDraft.title.trim(),
      slug: optionalString(pageDraft.slug),
      status: pageDraft.status,
      layout: optionalString(pageDraft.layout) || 'default',
      visibility: optionalString(pageDraft.visibility) || 'public',
      heroHeadline: optionalString(pageDraft.heroHeadline),
      heroSubheading: optionalString(pageDraft.heroSubheading),
      heroImageUrl: optionalString(pageDraft.heroImageUrl),
      heroCtaLabel: optionalString(pageDraft.heroCtaLabel),
      heroCtaUrl: optionalString(pageDraft.heroCtaUrl),
      featureImageUrl: optionalString(pageDraft.featureImageUrl),
      seoTitle: optionalString(pageDraft.seoTitle),
      seoDescription: optionalString(pageDraft.seoDescription),
      previewPath: optionalString(pageDraft.previewPath),
      allowedRoles: parseRoles(pageDraft.allowedRoles),
      metadata
    };

    setSavingPage(true);
    try {
      if (!selectedPageId || selectedPageId === NEW_PAGE_ID) {
        const response = await createWebsitePage(payload);
        const created = response?.data ?? response;
        showFeedback('success', 'Page created successfully');
        await loadPages({ selectId: created?.id });
      } else {
        await updateWebsitePage(selectedPageId, payload);
        const detail = await getWebsitePage(selectedPageId);
        const data = detail?.data ?? detail ?? {};
        setPageDraft(toPageDraft(data.page));
        setPageTouched({ slug: true, previewPath: true });
        setBlocks((data.blocks ?? []).map(toBlockForm));
        showFeedback('success', 'Page updated successfully');
        await loadPages({ selectId: selectedPageId });
      }
    } catch (caught) {
      console.error('Failed to save page', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to save page');
      showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to save page');
    } finally {
      setSavingPage(false);
    }
  }, [
    loadPages,
    pageDraft.allowedRoles,
    pageDraft.heroCtaLabel,
    pageDraft.heroCtaUrl,
    pageDraft.heroHeadline,
    pageDraft.heroImageUrl,
    pageDraft.featureImageUrl,
    pageDraft.heroSubheading,
    pageDraft.layout,
    pageDraft.metadata,
    pageDraft.previewPath,
    pageDraft.seoDescription,
    pageDraft.seoTitle,
    pageDraft.slug,
    pageDraft.status,
    pageDraft.title,
    pageDraft.visibility,
    selectedPageId,
    showFeedback
  ]);

  const deletePage = useCallback(async () => {
    if (!selectedPageId || selectedPageId === NEW_PAGE_ID) {
      showFeedback('danger', 'Select a saved page before deleting');
      return;
    }
    if (!window.confirm('Delete this page? This action cannot be undone.')) {
      return;
    }
    setSavingPage(true);
    try {
      await deleteWebsitePage(selectedPageId);
      showFeedback('success', 'Page deleted');
      await loadPages();
    } catch (caught) {
      console.error('Failed to delete website page', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to delete website page');
      showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to delete page');
    } finally {
      setSavingPage(false);
    }
  }, [loadPages, selectedPageId, showFeedback]);

  const saveBlock = useCallback(
    async (blockId) => {
      const block = blocks.find((entry) => entry.id === blockId);
      if (!block) {
        return;
      }

      let media;
      let settings;
      try {
        media = block.media && block.media.trim() ? JSON.parse(block.media) : {};
      } catch {
        showFeedback('danger', 'Block media must be valid JSON');
        return;
      }
      try {
        settings = block.settings && block.settings.trim() ? JSON.parse(block.settings) : {};
      } catch {
        showFeedback('danger', 'Block settings must be valid JSON');
        return;
      }

      const payload = {
        type: block.type,
        title: optionalString(block.title),
        subtitle: optionalString(block.subtitle),
        body: optionalString(block.body),
        layout: optionalString(block.layout) || 'stacked',
        accentColor: optionalString(block.accentColor),
        backgroundImageUrl: optionalString(block.backgroundImageUrl),
        media,
        settings,
        allowedRoles: parseRoles(block.allowedRoles),
        analyticsTag: optionalString(block.analyticsTag),
        embedUrl: optionalString(block.embedUrl),
        ctaLabel: optionalString(block.ctaLabel),
        ctaUrl: optionalString(block.ctaUrl),
        position: block.position !== '' ? Number.parseInt(block.position, 10) : undefined,
        isVisible: block.isVisible
      };

      setSavingBlocks((current) => ({ ...current, [blockId]: true }));
      try {
        await updateWebsiteBlock(blockId, payload);
        if (selectedPageId && selectedPageId !== NEW_PAGE_ID) {
          const detail = await getWebsitePage(selectedPageId);
          const data = detail?.data ?? detail ?? {};
          setBlocks((data.blocks ?? []).map(toBlockForm));
        }
        showFeedback('success', 'Block updated');
      } catch (caught) {
        console.error('Failed to save block', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to save block');
        showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to save block');
      } finally {
        setSavingBlocks((current) => ({ ...current, [blockId]: false }));
      }
    },
    [blocks, selectedPageId, showFeedback]
  );

  const addBlock = useCallback(async () => {
    if (!selectedPageId || selectedPageId === NEW_PAGE_ID) {
      showFeedback('danger', 'Save the page before adding blocks');
      return;
    }

    let media;
    let settings;
    try {
      media = newBlockDraft.media && newBlockDraft.media.trim() ? JSON.parse(newBlockDraft.media) : {};
    } catch {
      showFeedback('danger', 'Block media must be valid JSON');
      return;
    }
    try {
      settings = newBlockDraft.settings && newBlockDraft.settings.trim() ? JSON.parse(newBlockDraft.settings) : {};
    } catch {
      showFeedback('danger', 'Block settings must be valid JSON');
      return;
    }

    const payload = {
      type: newBlockDraft.type || 'rich_text',
      title: optionalString(newBlockDraft.title),
      subtitle: optionalString(newBlockDraft.subtitle),
      body: optionalString(newBlockDraft.body),
      layout: optionalString(newBlockDraft.layout) || 'stacked',
      accentColor: optionalString(newBlockDraft.accentColor),
      backgroundImageUrl: optionalString(newBlockDraft.backgroundImageUrl),
      media,
      settings,
      allowedRoles: parseRoles(newBlockDraft.allowedRoles),
      analyticsTag: optionalString(newBlockDraft.analyticsTag),
      embedUrl: optionalString(newBlockDraft.embedUrl),
      ctaLabel: optionalString(newBlockDraft.ctaLabel),
      ctaUrl: optionalString(newBlockDraft.ctaUrl),
      position: newBlockDraft.position !== '' ? Number.parseInt(newBlockDraft.position, 10) : undefined,
      isVisible: newBlockDraft.isVisible
    };

    setCreatingBlock(true);
    try {
      await createWebsiteBlock(selectedPageId, payload);
      const detail = await getWebsitePage(selectedPageId);
      const data = detail?.data ?? detail ?? {};
      setBlocks((data.blocks ?? []).map(toBlockForm));
      setNewBlockDraft({ ...emptyBlockDraft });
      showFeedback('success', 'Block added');
    } catch (caught) {
      console.error('Failed to create block', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to create block');
      showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to create block');
    } finally {
      setCreatingBlock(false);
    }
  }, [
    newBlockDraft.accentColor,
    newBlockDraft.allowedRoles,
    newBlockDraft.analyticsTag,
    newBlockDraft.backgroundImageUrl,
    newBlockDraft.body,
    newBlockDraft.ctaLabel,
    newBlockDraft.ctaUrl,
    newBlockDraft.embedUrl,
    newBlockDraft.isVisible,
    newBlockDraft.layout,
    newBlockDraft.media,
    newBlockDraft.position,
    newBlockDraft.settings,
    newBlockDraft.subtitle,
    newBlockDraft.title,
    newBlockDraft.type,
    selectedPageId,
    showFeedback
  ]);

  const removeBlock = useCallback(
    async (blockId) => {
      if (!window.confirm('Remove this content block?')) {
        return;
      }
      setSavingBlocks((current) => ({ ...current, [blockId]: true }));
      try {
        await deleteWebsiteBlock(blockId);
        if (selectedPageId && selectedPageId !== NEW_PAGE_ID) {
          const detail = await getWebsitePage(selectedPageId);
          const data = detail?.data ?? detail ?? {};
          setBlocks((data.blocks ?? []).map(toBlockForm));
        }
        showFeedback('success', 'Block deleted');
      } catch (caught) {
        console.error('Failed to delete block', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to delete block');
        showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to delete block');
      } finally {
        setSavingBlocks((current) => ({ ...current, [blockId]: false }));
      }
    },
    [selectedPageId, showFeedback]
  );

  const selectMenu = useCallback((menuId) => {
    if (menuId === NEW_MENU_ID) {
      setSelectedMenuId(NEW_MENU_ID);
      setMenuDraft({ ...emptyMenuDraft });
      setMenuItems([]);
      return;
    }
    setSelectedMenuId(menuId);
  }, []);

  const saveMenu = useCallback(async () => {
    if (!menuDraft.name?.trim()) {
      showFeedback('danger', 'Menu name is required');
      return;
    }

    let metadata;
    try {
      metadata = menuDraft.metadata && menuDraft.metadata.trim() ? JSON.parse(menuDraft.metadata) : {};
    } catch {
      showFeedback('danger', 'Menu metadata must be valid JSON');
      return;
    }

    const payload = {
      name: menuDraft.name.trim(),
      location: menuDraft.location.trim() || undefined,
      description: optionalString(menuDraft.description),
      isPrimary: Boolean(menuDraft.isPrimary),
      allowedRoles: parseRoles(menuDraft.allowedRoles),
      metadata
    };

    setSavingMenu(true);
    try {
      if (!selectedMenuId || selectedMenuId === NEW_MENU_ID) {
        const response = await createWebsiteNavigationMenu(payload);
        const created = response?.data ?? response;
        showFeedback('success', 'Navigation menu created');
        await loadNavigation({ selectId: created?.id });
      } else {
        await updateWebsiteNavigationMenu(selectedMenuId, payload);
        showFeedback('success', 'Navigation menu updated');
        await loadNavigation({ selectId: selectedMenuId });
      }
    } catch (caught) {
      console.error('Failed to save navigation menu', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to save navigation menu');
      showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to save navigation menu');
    } finally {
      setSavingMenu(false);
    }
  }, [
    loadNavigation,
    menuDraft.allowedRoles,
    menuDraft.description,
    menuDraft.isPrimary,
    menuDraft.location,
    menuDraft.metadata,
    menuDraft.name,
    selectedMenuId,
    showFeedback
  ]);

  const deleteMenu = useCallback(async () => {
    if (!selectedMenuId || selectedMenuId === NEW_MENU_ID) {
      showFeedback('danger', 'Select a saved navigation menu before deleting');
      return;
    }
    if (!window.confirm('Delete this navigation menu and all of its items?')) {
      return;
    }
    try {
      await deleteWebsiteNavigationMenu(selectedMenuId);
      showFeedback('success', 'Navigation menu deleted');
      setSelectedMenuId(null);
      await loadNavigation();
    } catch (caught) {
      console.error('Failed to delete navigation menu', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to delete navigation menu');
      showFeedback('danger', 'Unable to delete menu');
    }
  }, [loadNavigation, selectedMenuId, showFeedback]);

  const saveMenuItem = useCallback(
    async (itemId) => {
      const item = menuItems.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }

      let settings;
      try {
        settings = item.settings && item.settings.trim() ? JSON.parse(item.settings) : {};
      } catch {
        showFeedback('danger', 'Navigation item settings must be valid JSON');
        return;
      }

      const payload = {
        label: item.label.trim(),
        url: item.url.trim(),
        icon: optionalString(item.icon),
        openInNewTab: item.openInNewTab,
        sortOrder: item.sortOrder !== '' ? Number.parseInt(item.sortOrder, 10) : undefined,
        visibility: optionalString(item.visibility),
        parentId: item.parentId || undefined,
        allowedRoles: parseRoles(item.allowedRoles),
        settings,
        analyticsTag: optionalString(item.analyticsTag)
      };

      setSavingMenuItems((current) => ({ ...current, [itemId]: true }));
      try {
        await updateWebsiteNavigationItem(itemId, payload);
        await loadNavigation({ selectId: selectedMenuId });
        showFeedback('success', 'Navigation item updated');
      } catch (caught) {
        console.error('Failed to update navigation item', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to update navigation item');
        showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to update navigation item');
      } finally {
        setSavingMenuItems((current) => ({ ...current, [itemId]: false }));
      }
    },
    [loadNavigation, menuItems, selectedMenuId, showFeedback]
  );

  const createMenuItem = useCallback(async () => {
    if (!selectedMenuId || selectedMenuId === NEW_MENU_ID) {
      showFeedback('danger', 'Save the navigation menu before adding items');
      return;
    }

    let settings;
    try {
      settings = newMenuItemDraft.settings && newMenuItemDraft.settings.trim() ? JSON.parse(newMenuItemDraft.settings) : {};
    } catch {
      showFeedback('danger', 'Navigation item settings must be valid JSON');
      return;
    }

    const payload = {
      label: newMenuItemDraft.label.trim(),
      url: newMenuItemDraft.url.trim(),
      icon: optionalString(newMenuItemDraft.icon),
      openInNewTab: newMenuItemDraft.openInNewTab,
      sortOrder: newMenuItemDraft.sortOrder !== '' ? Number.parseInt(newMenuItemDraft.sortOrder, 10) : undefined,
      visibility: optionalString(newMenuItemDraft.visibility),
      parentId: newMenuItemDraft.parentId || undefined,
      allowedRoles: parseRoles(newMenuItemDraft.allowedRoles),
      settings,
      analyticsTag: optionalString(newMenuItemDraft.analyticsTag)
    };

    if (!payload.label || !payload.url) {
      showFeedback('danger', 'Navigation item label and URL are required');
      return;
    }

    setCreatingMenuItem(true);
    try {
      await createWebsiteNavigationItem(selectedMenuId, payload);
      await loadNavigation({ selectId: selectedMenuId });
      setNewMenuItemDraft({ ...emptyMenuItemDraft });
      showFeedback('success', 'Navigation item added');
    } catch (caught) {
      console.error('Failed to create navigation item', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to create navigation item');
      showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to create navigation item');
    } finally {
      setCreatingMenuItem(false);
    }
  }, [
    loadNavigation,
    newMenuItemDraft.allowedRoles,
    newMenuItemDraft.analyticsTag,
    newMenuItemDraft.icon,
    newMenuItemDraft.label,
    newMenuItemDraft.openInNewTab,
    newMenuItemDraft.parentId,
    newMenuItemDraft.settings,
    newMenuItemDraft.sortOrder,
    newMenuItemDraft.url,
    newMenuItemDraft.visibility,
    selectedMenuId,
    showFeedback
  ]);

  const deleteMenuItem = useCallback(
    async (itemId) => {
      if (!window.confirm('Delete this navigation item?')) {
        return;
      }
      setSavingMenuItems((current) => ({ ...current, [itemId]: true }));
      try {
        await deleteWebsiteNavigationItem(itemId);
        await loadNavigation({ selectId: selectedMenuId });
        showFeedback('success', 'Navigation item deleted');
      } catch (caught) {
        console.error('Failed to delete navigation item', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to delete navigation item');
        showFeedback('danger', caught instanceof Error ? caught.message : 'Unable to delete navigation item');
      } finally {
        setSavingMenuItems((current) => ({ ...current, [itemId]: false }));
      }
    },
    [loadNavigation, selectedMenuId, showFeedback]
  );

  return {
    state: {
      pages,
      selectedPageId,
      pageDraft,
      pageTouched,
      blocks,
      newBlockDraft,
      loadingPages,
      loadingPageDetail,
      savingPage,
      savingBlocks,
      creatingBlock,
      navigationMenus,
      selectedMenuId,
      menuDraft,
      menuItems,
      newMenuItemDraft,
      loadingNavigation,
      savingMenu,
      savingMenuItems,
      creatingMenuItem,
      feedback,
      error,
      pageSelection,
      menuSelection
    },
    actions: {
      setPageDraft,
      setPageTouched,
      setBlocks,
      setNewBlockDraft,
      setMenuDraft,
      setMenuItems,
      setNewMenuItemDraft,
      selectPage,
      handlePageTitleChange,
      handlePageSlugChange,
      handlePageSlugBlur,
      regenerateSlug,
      handlePreviewPathChange,
      handlePreviewPathBlur,
      syncPreviewPath,
      savePage,
      deletePage,
      saveBlock,
      addBlock,
      removeBlock,
      selectMenu,
      saveMenu,
      deleteMenu,
      saveMenuItem,
      createMenuItem,
      deleteMenuItem
    }
  };
}

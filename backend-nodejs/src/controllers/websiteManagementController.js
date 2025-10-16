import {
  listWebsitePages,
  getWebsitePage,
  createWebsitePage,
  updateWebsitePage,
  deleteWebsitePage,
  createWebsiteContentBlock,
  updateWebsiteContentBlock,
  deleteWebsiteContentBlock,
  listWebsiteNavigation,
  createWebsiteNavigationMenu,
  updateWebsiteNavigationMenu,
  deleteWebsiteNavigationMenu,
  createWebsiteNavigationItem,
  updateWebsiteNavigationItem,
  deleteWebsiteNavigationItem
} from '../services/websiteManagementService.js';

export async function listWebsitePagesHandler(req, res, next) {
  try {
    const pages = await listWebsitePages();
    res.json({ data: pages });
  } catch (error) {
    next(error);
  }
}

export async function getWebsitePageHandler(req, res, next) {
  try {
    const payload = await getWebsitePage({ id: req.params.pageId });
    res.json({ data: payload });
  } catch (error) {
    next(error);
  }
}

export async function createWebsitePageHandler(req, res, next) {
  try {
    const page = await createWebsitePage({ payload: req.body, actorId: req.user?.id ?? null });
    res.status(201).json({ data: page });
  } catch (error) {
    next(error);
  }
}

export async function updateWebsitePageHandler(req, res, next) {
  try {
    const page = await updateWebsitePage({ id: req.params.pageId, payload: req.body, actorId: req.user?.id ?? null });
    res.json({ data: page });
  } catch (error) {
    next(error);
  }
}

export async function deleteWebsitePageHandler(req, res, next) {
  try {
    await deleteWebsitePage({ id: req.params.pageId });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function createWebsiteContentBlockHandler(req, res, next) {
  try {
    const block = await createWebsiteContentBlock({
      pageId: req.params.pageId,
      payload: req.body,
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: block });
  } catch (error) {
    next(error);
  }
}

export async function updateWebsiteContentBlockHandler(req, res, next) {
  try {
    const block = await updateWebsiteContentBlock({ id: req.params.blockId, payload: req.body, actorId: req.user?.id ?? null });
    res.json({ data: block });
  } catch (error) {
    next(error);
  }
}

export async function deleteWebsiteContentBlockHandler(req, res, next) {
  try {
    await deleteWebsiteContentBlock({ id: req.params.blockId });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function listWebsiteNavigationHandler(req, res, next) {
  try {
    const menus = await listWebsiteNavigation();
    res.json({ data: menus });
  } catch (error) {
    next(error);
  }
}

export async function createWebsiteNavigationMenuHandler(req, res, next) {
  try {
    const menu = await createWebsiteNavigationMenu({ payload: req.body, actorId: req.user?.id ?? null });
    res.status(201).json({ data: menu });
  } catch (error) {
    next(error);
  }
}

export async function updateWebsiteNavigationMenuHandler(req, res, next) {
  try {
    const menu = await updateWebsiteNavigationMenu({ id: req.params.menuId, payload: req.body, actorId: req.user?.id ?? null });
    res.json({ data: menu });
  } catch (error) {
    next(error);
  }
}

export async function deleteWebsiteNavigationMenuHandler(req, res, next) {
  try {
    await deleteWebsiteNavigationMenu({ id: req.params.menuId });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function createWebsiteNavigationItemHandler(req, res, next) {
  try {
    const item = await createWebsiteNavigationItem({
      menuId: req.params.menuId,
      payload: req.body,
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: item });
  } catch (error) {
    next(error);
  }
}

export async function updateWebsiteNavigationItemHandler(req, res, next) {
  try {
    const item = await updateWebsiteNavigationItem({ id: req.params.itemId, payload: req.body, actorId: req.user?.id ?? null });
    res.json({ data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteWebsiteNavigationItemHandler(req, res, next) {
  try {
    await deleteWebsiteNavigationItem({ id: req.params.itemId });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

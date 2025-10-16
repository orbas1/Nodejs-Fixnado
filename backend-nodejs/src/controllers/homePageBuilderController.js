import {
  listHomePages,
  getHomePageById,
  createHomePage,
  updateHomePage,
  publishHomePage,
  archiveHomePage,
  deleteHomePage,
  createSection,
  updateSection,
  reorderSection,
  deleteSection,
  createComponent,
  updateComponent,
  reorderComponent,
  deleteComponent,
  duplicateHomePage,
  duplicateSection,
  duplicateComponent
} from '../services/homePageBuilderService.js';

function handleError(res, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error('[homePageBuilderController] unexpected error', error);
  return res.status(500).json({ message: 'Unexpected error' });
}

export async function listHomePagesHandler(req, res) {
  try {
    const pages = await listHomePages();
    return res.json({ data: pages });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getHomePageHandler(req, res) {
  try {
    const page = await getHomePageById(req.params.pageId);
    return res.json({ data: page });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createHomePageHandler(req, res) {
  try {
    const page = await createHomePage(req.body ?? {}, req.user?.id);
    return res.status(201).json({ data: page });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateHomePageHandler(req, res) {
  try {
    const page = await updateHomePage(req.params.pageId, req.body ?? {}, req.user?.id);
    return res.json({ data: page });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishHomePageHandler(req, res) {
  try {
    const page = await publishHomePage(req.params.pageId, req.body ?? {}, req.user?.id);
    return res.json({ data: page });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function archiveHomePageHandler(req, res) {
  try {
    const page = await archiveHomePage(req.params.pageId, req.user?.id);
    return res.json({ data: page });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteHomePageHandler(req, res) {
  try {
    await deleteHomePage(req.params.pageId);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateHomePageHandler(req, res) {
  try {
    const page = await duplicateHomePage(req.params.pageId, req.user?.id);
    return res.status(201).json({ data: page });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createSectionHandler(req, res) {
  try {
    const section = await createSection(req.params.pageId, req.body ?? {}, req.user?.id);
    return res.status(201).json({ data: section });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateSectionHandler(req, res) {
  try {
    const section = await updateSection(req.params.sectionId, req.body ?? {}, req.user?.id);
    return res.json({ data: section });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reorderSectionHandler(req, res) {
  try {
    const sections = await reorderSection(req.params.sectionId, req.body ?? {}, req.user?.id);
    return res.json({ data: sections });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteSectionHandler(req, res) {
  try {
    await deleteSection(req.params.sectionId);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateSectionHandler(req, res) {
  try {
    const sections = await duplicateSection(req.params.sectionId, req.user?.id);
    return res.status(201).json({ data: sections });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createComponentHandler(req, res) {
  try {
    const component = await createComponent(req.params.sectionId, req.body ?? {}, req.user?.id);
    return res.status(201).json({ data: component });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateComponentHandler(req, res) {
  try {
    const component = await updateComponent(req.params.componentId, req.body ?? {}, req.user?.id);
    return res.json({ data: component });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reorderComponentHandler(req, res) {
  try {
    const components = await reorderComponent(req.params.componentId, req.body ?? {}, req.user?.id);
    return res.json({ data: components });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteComponentHandler(req, res) {
  try {
    await deleteComponent(req.params.componentId);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateComponentHandler(req, res) {
  try {
    const result = await duplicateComponent(req.params.componentId, req.user?.id);
    return res.status(201).json({ data: result });
  } catch (error) {
    return handleError(res, error);
  }
}

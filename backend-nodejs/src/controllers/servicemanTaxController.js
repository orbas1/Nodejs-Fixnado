import {
  getServicemanTaxWorkspace,
  updateServicemanTaxProfile,
  listServicemanTaxFilings,
  createServicemanTaxFiling,
  updateServicemanTaxFiling,
  updateServicemanTaxFilingStatus,
  deleteServicemanTaxFiling,
  listServicemanTaxTasks,
  createServicemanTaxTask,
  updateServicemanTaxTask,
  updateServicemanTaxTaskStatus,
  deleteServicemanTaxTask,
  listServicemanTaxDocuments,
  createServicemanTaxDocument,
  updateServicemanTaxDocument,
  deleteServicemanTaxDocument
} from '../services/servicemanTaxService.js';

function resolveServicemanId(req) {
  return req.query?.servicemanId ?? req.params?.servicemanId ?? req.user?.id ?? req.auth?.actor?.actorId ?? null;
}

export async function getTaxWorkspaceHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const limit = req.query?.limit ? Number.parseInt(req.query.limit, 10) : 10;
    const workspace = await getServicemanTaxWorkspace({ servicemanId, limit });
    res.json({ data: workspace });
  } catch (error) {
    next(error);
  }
}

export async function updateTaxProfileHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const profile = await updateServicemanTaxProfile({
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function listTaxFilingsHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const response = await listServicemanTaxFilings({
      servicemanId,
      status: req.query?.status,
      search: req.query?.search,
      limit: req.query?.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query?.offset ? Number.parseInt(req.query.offset, 10) : undefined
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createTaxFilingHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const filing = await createServicemanTaxFiling({
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: filing });
  } catch (error) {
    next(error);
  }
}

export async function updateTaxFilingHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const filing = await updateServicemanTaxFiling({
      servicemanId,
      filingId: req.params?.filingId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.json({ data: filing });
  } catch (error) {
    next(error);
  }
}

export async function updateTaxFilingStatusHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const filing = await updateServicemanTaxFilingStatus({
      servicemanId,
      filingId: req.params?.filingId,
      status: req.body?.status,
      submittedAt: req.body?.submittedAt,
      amountPaid: req.body?.amountPaid,
      actorId: req.user?.id ?? null
    });
    res.json({ data: filing });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaxFilingHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const result = await deleteServicemanTaxFiling({
      servicemanId,
      filingId: req.params?.filingId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listTaxTasksHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const response = await listServicemanTaxTasks({
      servicemanId,
      status: req.query?.status,
      limit: req.query?.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query?.offset ? Number.parseInt(req.query.offset, 10) : undefined
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createTaxTaskHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const task = await createServicemanTaxTask({
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateTaxTaskHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const task = await updateServicemanTaxTask({
      servicemanId,
      taskId: req.params?.taskId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateTaxTaskStatusHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const task = await updateServicemanTaxTaskStatus({
      servicemanId,
      taskId: req.params?.taskId,
      status: req.body?.status,
      completedAt: req.body?.completedAt,
      actorId: req.user?.id ?? null
    });
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaxTaskHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const result = await deleteServicemanTaxTask({
      servicemanId,
      taskId: req.params?.taskId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listTaxDocumentsHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const response = await listServicemanTaxDocuments({
      servicemanId,
      type: req.query?.type,
      status: req.query?.status,
      limit: req.query?.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query?.offset ? Number.parseInt(req.query.offset, 10) : undefined
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createTaxDocumentHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const document = await createServicemanTaxDocument({
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: document });
  } catch (error) {
    next(error);
  }
}

export async function updateTaxDocumentHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const document = await updateServicemanTaxDocument({
      servicemanId,
      documentId: req.params?.documentId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.json({ data: document });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaxDocumentHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const result = await deleteServicemanTaxDocument({
      servicemanId,
      documentId: req.params?.documentId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

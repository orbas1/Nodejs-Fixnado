import {
  getDisputeHealthWorkspace,
  createDisputeHealthBucket,
  updateDisputeHealthBucket,
  archiveDisputeHealthBucket,
  upsertDisputeHealthEntry,
  listDisputeHealthHistory,
  deleteDisputeHealthEntry
} from '../services/disputeHealthService.js';

export async function getDisputeHealthWorkspaceHandler(req, res, next) {
  try {
    const payload = await getDisputeHealthWorkspace({ includeHistory: true });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createDisputeHealthBucketHandler(req, res, next) {
  try {
    const payload = await createDisputeHealthBucket(req.body ?? {}, req.user?.id ?? null);
    res.status(201).json(payload);
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function updateDisputeHealthBucketHandler(req, res, next) {
  try {
    const payload = await updateDisputeHealthBucket(req.params.bucketId, req.body ?? {}, req.user?.id ?? null);
    res.json(payload);
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function archiveDisputeHealthBucketHandler(req, res, next) {
  try {
    const payload = await archiveDisputeHealthBucket(req.params.bucketId, req.user?.id ?? null);
    res.json(payload);
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function upsertDisputeHealthEntryHandler(req, res, next) {
  try {
    const payload = await upsertDisputeHealthEntry(req.params.entryId ?? null, req.body ?? {}, req.user?.id ?? null);
    res.status(req.params.entryId ? 200 : 201).json(payload);
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 400 || error.statusCode === 422) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function getDisputeHealthBucketHistoryHandler(req, res, next) {
  try {
    const limit = Number.parseInt(req.query.limit ?? '50', 10);
    const offset = Number.parseInt(req.query.offset ?? '0', 10);
    const payload = await listDisputeHealthHistory(req.params.bucketId, { limit, offset });
    res.json(payload);
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function deleteDisputeHealthEntryHandler(req, res, next) {
  try {
    const payload = await deleteDisputeHealthEntry(req.params.entryId);
    res.json(payload);
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

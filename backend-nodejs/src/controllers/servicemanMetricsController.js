import {
  getServicemanMetricSettingsSnapshot,
  upsertServicemanMetricSettings,
  listAllServicemanMetricCards,
  createServicemanMetricCard,
  updateServicemanMetricCard,
  deleteServicemanMetricCard
} from '../services/servicemanMetricsService.js';

export async function getServicemanMetricsConfiguration(req, res, next) {
  try {
    const [settings, cards] = await Promise.all([
      getServicemanMetricSettingsSnapshot(),
      listAllServicemanMetricCards()
    ]);
    res.json({ data: { settings, cards } });
  } catch (error) {
    next(error);
  }
}

export async function saveServicemanMetricsSettings(req, res, next) {
  try {
    const settings = await upsertServicemanMetricSettings({
      actorId: req.user?.id ?? null,
      summary: req.body?.summary,
      productivity: req.body?.productivity,
      quality: req.body?.quality,
      logistics: req.body?.logistics,
      training: req.body?.training,
      wellness: req.body?.wellness,
      operations: req.body?.operations
    });
    const cards = await listAllServicemanMetricCards();
    res.json({ data: { settings, cards } });
  } catch (error) {
    next(error);
  }
}

export async function createServicemanMetricCardHandler(req, res, next) {
  try {
    const card = await createServicemanMetricCard({ payload: req.body, actorId: req.user?.id ?? null });
    res.status(201).json({ data: card });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanMetricCardHandler(req, res, next) {
  try {
    const card = await updateServicemanMetricCard({
      id: req.params.id,
      payload: req.body,
      actorId: req.user?.id ?? null
    });
    res.json({ data: card });
  } catch (error) {
    next(error);
  }
}

export async function deleteServicemanMetricCardHandler(req, res, next) {
  try {
    await deleteServicemanMetricCard({ id: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default {
  getServicemanMetricsConfiguration,
  saveServicemanMetricsSettings,
  createServicemanMetricCardHandler,
  updateServicemanMetricCardHandler,
  deleteServicemanMetricCardHandler
};

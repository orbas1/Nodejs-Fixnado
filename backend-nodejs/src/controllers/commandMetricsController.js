import {
  getCommandMetricSettingsSnapshot,
  upsertCommandMetricSettings,
  listAllCommandMetricCards,
  createCommandMetricCard,
  updateCommandMetricCard,
  deleteCommandMetricCard
} from '../services/commandMetricsConfigService.js';

export async function getCommandMetricsConfiguration(req, res, next) {
  try {
    const [settings, cards] = await Promise.all([
      getCommandMetricSettingsSnapshot(),
      listAllCommandMetricCards()
    ]);
    res.json({ data: { settings, cards } });
  } catch (error) {
    next(error);
  }
}

export async function saveCommandMetricSettings(req, res, next) {
  try {
    const settings = await upsertCommandMetricSettings({
      actorId: req.user?.id ?? null,
      summary: req.body?.summary,
      metrics: req.body?.metrics
    });
    const cards = await listAllCommandMetricCards();
    res.json({ data: { settings, cards } });
  } catch (error) {
    next(error);
  }
}

export async function createCommandMetricCardHandler(req, res, next) {
  try {
    const card = await createCommandMetricCard({ payload: req.body, actorId: req.user?.id ?? null });
    res.status(201).json({ data: card });
  } catch (error) {
    next(error);
  }
}

export async function updateCommandMetricCardHandler(req, res, next) {
  try {
    const card = await updateCommandMetricCard({ id: req.params.id, payload: req.body, actorId: req.user?.id ?? null });
    res.json({ data: card });
  } catch (error) {
    next(error);
  }
}

export async function deleteCommandMetricCardHandler(req, res, next) {
  try {
    await deleteCommandMetricCard({ id: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default {
  getCommandMetricsConfiguration,
  saveCommandMetricSettings,
  createCommandMetricCardHandler,
  updateCommandMetricCardHandler,
  deleteCommandMetricCardHandler
};

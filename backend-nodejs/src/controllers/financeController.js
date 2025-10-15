import config from '../config/index.js';
import {
  createCheckoutSession,
  enqueueFinanceWebhook,
  getFinanceOverview,
  getOrderFinanceTimeline,
  generateFinanceReport,
  getRegulatoryAlertsSummary
} from '../services/paymentOrchestrationService.js';

function handleServiceError(next, error) {
  if (error && error.statusCode) {
    const responseError = new Error(error.message);
    responseError.statusCode = error.statusCode;
    responseError.status = error.statusCode;
    return next(responseError);
  }

  return next(error);
}

export async function createCheckoutHandler(req, res, next) {
  try {
    const { orderId, buyerId, serviceId, amount, currency, source, metadata } = req.body;
    const actorId = req.user?.id || req.body.actorId || null;
    const payment = await createCheckoutSession({
      orderId,
      buyerId,
      serviceId,
      amount: Number(amount),
      currency,
      source,
      metadata,
      actorId
    });
    res.status(201).json(payment);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function enqueueFinanceWebhookHandler(req, res, next) {
  try {
    const { provider } = req.params;
    const { eventType, payload, orderId, paymentId, escrowId } = req.body;
    const sharedSecret = config.finance.webhookSharedSecret;
    if (sharedSecret) {
      const token = req.headers['x-finance-webhook-token'];
      if (token !== sharedSecret) {
        const error = new Error('Webhook signature validation failed');
        error.statusCode = 401;
        throw error;
      }
    }
    await enqueueFinanceWebhook({ provider, eventType, payload, orderId, paymentId, escrowId });
    res.status(202).json({ status: 'queued' });
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function getFinanceOverviewHandler(req, res, next) {
  try {
    const overview = await getFinanceOverview({
      regionId: req.query.regionId || null,
      providerId: req.query.providerId || null
    });
    res.json(overview);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function getFinanceTimelineHandler(req, res, next) {
  try {
    const timeline = await getOrderFinanceTimeline(req.params.orderId);
    res.json(timeline);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function getFinanceReportHandler(req, res, next) {
  try {
    const { startDate, endDate, regionId, providerId, format } = req.query;
    const result = await generateFinanceReport({
      startDate,
      endDate,
      regionId,
      providerId,
      format
    });

    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.status(200).send(result.content);
      return;
    }

    res.json(result.report);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function getFinanceAlertsHandler(req, res, next) {
  try {
    const { regionId, providerId } = req.query;
    const payload = await getRegulatoryAlertsSummary({ regionId, providerId });
    res.json(payload);
  } catch (error) {
    handleServiceError(next, error);
  }
}

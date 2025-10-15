import config from '../config/index.js';
import {
  createCheckoutSession,
  enqueueFinanceWebhook,
  getFinanceOverview,
  getOrderFinanceTimeline
} from '../services/paymentOrchestrationService.js';

function handleServiceError(next, error) {
  if (error && error.statusCode) {
    const responseError = new Error(error.message);
    responseError.statusCode = error.statusCode;
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

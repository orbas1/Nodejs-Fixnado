import config from '../config/index.js';
import { processFinanceWebhookQueue } from '../services/paymentOrchestrationService.js';

export function startFinanceWebhookJob(logger = console) {
  const intervalMs = Number.isFinite(config.finance.webhookPollIntervalMs)
    ? config.finance.webhookPollIntervalMs
    : 15000;
  const batchSize = Number.isFinite(config.finance.webhookBatchSize)
    ? config.finance.webhookBatchSize
    : 10;

  let isRunning = false;

  async function tick() {
    if (isRunning) {
      return;
    }

    isRunning = true;
    try {
      await processFinanceWebhookQueue({ limit: batchSize, logger });
    } catch (error) {
      logger.error?.('finance-webhook-job: failed to process queue', { error });
    } finally {
      isRunning = false;
    }
  }

  const timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  // Run immediately to avoid waiting for the first interval
  tick().catch((error) => {
    logger.error?.('finance-webhook-job: initial tick failed', { error });
  });

  return {
    stop() {
      clearInterval(timer);
    },
    description: 'finance-webhook-processor'
  };
}

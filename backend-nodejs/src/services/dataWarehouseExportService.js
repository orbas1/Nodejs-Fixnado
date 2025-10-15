import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { DateTime } from 'luxon';
import { Op } from 'sequelize';

import config from '../config/index.js';
import {
  WarehouseExportRun,
  Region,
  Order,
  Escrow,
  Dispute,
  FinanceTransactionHistory,
  MessageHistory,
  ConversationMessage,
  Conversation,
  ConversationParticipant,
  User
} from '../models/index.js';

const DEFAULT_DATASETS = ['orders', 'finance', 'communications'];

function normaliseDatasetKey(dataset) {
  if (typeof dataset !== 'string') {
    return '';
  }
  return dataset.trim().toLowerCase();
}

function datasetConfig(datasetKey) {
  return config.dataWarehouse.datasets?.[datasetKey] ?? {};
}

function datasetEnabled(datasetKey) {
  const cfg = datasetConfig(datasetKey);
  if (cfg.enabled === false) {
    return false;
  }
  return DEFAULT_DATASETS.includes(datasetKey);
}

async function resolveRegion(regionCode) {
  if (regionCode && typeof regionCode === 'string') {
    const region = await Region.findOne({ where: { code: regionCode.trim().toUpperCase() } });
    if (region) {
      return region;
    }
  }
  return null;
}

function ensureLookback(datasetKey, fallbackDays) {
  const cfg = datasetConfig(datasetKey);
  if (cfg && Number.isFinite(cfg.lookbackDays)) {
    return Math.max(Number(cfg.lookbackDays), 1);
  }
  return fallbackDays;
}

function ensureBatchSize() {
  return Math.max(Number.parseInt(config.dataWarehouse.batchSize ?? 250, 10), 50);
}

function ensureExportRoot() {
  const exportRoot = config.dataWarehouse.exportRoot || 'storage/warehouse-exports';
  return path.resolve(process.cwd(), exportRoot);
}

async function prepareExportDirectory(region, datasetKey) {
  const exportRoot = ensureExportRoot();
  const directory = path.join(exportRoot, region?.code ?? 'GLOBAL', datasetKey);
  await fsPromises.mkdir(directory, { recursive: true });
  return directory;
}

function sanitiseOrder(order) {
  const plain = order.get({ plain: true });
  return {
    id: plain.id,
    buyerId: plain.buyerId,
    serviceId: plain.serviceId,
    status: plain.status,
    totalAmount: plain.totalAmount != null ? Number(plain.totalAmount) : null,
    currency: plain.currency,
    scheduledFor: plain.scheduledFor,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    region: plain.region ? { id: plain.region.id, code: plain.region.code } : null,
    escrow: plain.Escrow
      ? {
          id: plain.Escrow.id,
          status: plain.Escrow.status,
          regionId: plain.Escrow.regionId,
          releasedAt: plain.Escrow.releasedAt
        }
      : null,
    disputes: Array.isArray(plain.Escrow?.Disputes)
      ? plain.Escrow.Disputes.map((dispute) => ({
          id: dispute.id,
          status: dispute.status,
          reason: dispute.reason,
          regionId: dispute.regionId,
          createdAt: dispute.createdAt,
          updatedAt: dispute.updatedAt
        }))
      : []
  };
}

function sanitiseFinanceEvent(event) {
  const plain = event.get({ plain: true });
  return {
    id: plain.id,
    eventType: plain.eventType,
    occurredAt: plain.occurredAt,
    regionId: plain.regionId,
    orderId: plain.orderId,
    escrowId: plain.escrowId,
    disputeId: plain.disputeId,
    actorId: plain.actorId,
    amount: plain.snapshot?.amount ?? null,
    currency: plain.snapshot?.currency ?? null,
    balance: plain.snapshot?.balance ?? null,
    metadata: plain.snapshot?.metadata ?? null
  };
}

function sanitiseMessageHistory(history) {
  const plain = history.get({ plain: true });
  const conversation = plain.message?.conversation;
  return {
    id: plain.id,
    messageId: plain.messageId,
    version: plain.version,
    capturedAt: plain.capturedAt,
    regionId: plain.regionId,
    region: conversation?.region ? { id: conversation.region.id, code: conversation.region.code } : null,
    channel: conversation?.channel ?? null,
    conversationId: conversation?.id ?? null,
    participants: conversation?.participants?.map((participant) => ({
      participantId: participant.participantId,
      role: participant.role ?? null
    })),
    payload: plain.snapshot
  };
}

const DATASET_DEFINITIONS = {
  orders: {
    cursorField: 'updatedAt',
    defaultLookbackDays: 2,
    async fetchBatch({ since, regionId, limit, offset }) {
      const where = {};
      if (since) {
        where.updatedAt = { [Op.gt]: since };
      }
      if (regionId) {
        where.regionId = regionId;
      }
      return Order.findAll({
        where,
        include: [
          { model: Region, as: 'region', attributes: ['id', 'code'] },
          {
            model: Escrow,
            include: [{ model: Dispute }]
          }
        ],
        order: [
          ['updatedAt', 'ASC'],
          ['id', 'ASC']
        ],
        limit,
        offset
      });
    },
    serialise: sanitiseOrder
  },
  finance: {
    cursorField: 'occurredAt',
    defaultLookbackDays: 7,
    async fetchBatch({ since, regionId, limit, offset }) {
      const where = {};
      if (since) {
        where.occurredAt = { [Op.gt]: since };
      }
      if (regionId) {
        where.regionId = regionId;
      }
      return FinanceTransactionHistory.findAll({
        where,
        include: [
          { model: Region, as: 'region', attributes: ['id', 'code'] },
          { model: Order, as: 'order', attributes: ['id', 'buyerId', 'serviceId'] },
          { model: Escrow, as: 'escrow', attributes: ['id', 'status'] },
          { model: Dispute, as: 'dispute', attributes: ['id', 'status'] },
          { model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName'] }
        ],
        order: [
          ['occurredAt', 'ASC'],
          ['id', 'ASC']
        ],
        limit,
        offset
      });
    },
    serialise: sanitiseFinanceEvent
  },
  communications: {
    cursorField: 'capturedAt',
    defaultLookbackDays: 7,
    async fetchBatch({ since, regionId, limit, offset }) {
      const where = {};
      if (since) {
        where.capturedAt = { [Op.gt]: since };
      }
      if (regionId) {
        where.regionId = regionId;
      }
      return MessageHistory.findAll({
        where,
        include: [
          {
            model: ConversationMessage,
            as: 'message',
            include: [
              {
                model: Conversation,
                as: 'conversation',
                include: [
                  { model: Region, as: 'region', attributes: ['id', 'code'] },
                  { model: ConversationParticipant, as: 'participants', attributes: ['participantId', 'role'] }
                ]
              }
            ]
          }
        ],
        order: [
          ['capturedAt', 'ASC'],
          ['id', 'ASC']
        ],
        limit,
        offset
      });
    },
    serialise: sanitiseMessageHistory
  }
};

async function fetchPreviousRun(datasetKey, regionId) {
  return WarehouseExportRun.findOne({
    where: {
      dataset: datasetKey,
      regionId,
      status: 'succeeded'
    },
    order: [['runFinishedAt', 'DESC']]
  });
}

function computeSince(datasetKey, previousRun, explicitSince) {
  if (explicitSince) {
    return new Date(explicitSince);
  }
  if (previousRun?.lastCursor?.value) {
    return new Date(previousRun.lastCursor.value);
  }
  const lookbackDays = ensureLookback(datasetKey, DATASET_DEFINITIONS[datasetKey].defaultLookbackDays);
  return DateTime.utc().minus({ days: lookbackDays }).toJSDate();
}

function cooldownMinutes(datasetKey) {
  const cfg = datasetConfig(datasetKey);
  if (cfg && Number.isFinite(cfg.minIntervalMinutes)) {
    return Math.max(Number(cfg.minIntervalMinutes), 5);
  }
  return Math.max(Number(config.dataWarehouse.minIntervalMinutes ?? 30), 5);
}

async function writeDatasetToFile({ definition, datasetKey, region, since }) {
  const directory = await prepareExportDirectory(region, datasetKey);
  const fileName = `${datasetKey}-${region?.code ?? 'GLOBAL'}-${Date.now()}.ndjson.gz`;
  const filePath = path.join(directory, fileName);
  const gzip = createGzip({ level: 6 });
  const writeStream = fs.createWriteStream(filePath);
  const pipelinePromise = pipeline(gzip, writeStream);

  const limit = ensureBatchSize();
  let offset = 0;
  let rowCount = 0;
  let lastCursor = null;

  try {
    while (true) {
      const rows = await definition.fetchBatch({ since, regionId: region?.id ?? null, limit, offset });
      if (!rows.length) {
        break;
      }

      for (const row of rows) {
        const serialised = definition.serialise(row);
        gzip.write(`${JSON.stringify(serialised)}\n`);
        const cursorValue = row.get(definition.cursorField);
        if (cursorValue) {
          lastCursor = new Date(cursorValue);
        }
        rowCount += 1;
      }

      if (rows.length < limit) {
        break;
      }
      offset += limit;
    }
  } finally {
    gzip.end();
    await pipelinePromise;
  }

  return { filePath, rowCount, lastCursor };
}

function assertDatasetSupported(datasetKey) {
  const definition = DATASET_DEFINITIONS[datasetKey];
  if (!definition) {
    throw new Error(`Unsupported dataset: ${datasetKey}`);
  }
  if (!datasetEnabled(datasetKey)) {
    throw new Error(`Dataset ${datasetKey} is disabled via configuration`);
  }
  return definition;
}

export async function triggerWarehouseExport({
  dataset,
  regionCode,
  actorId = null,
  since,
  source = 'manual',
  force = false
}) {
  const datasetKey = normaliseDatasetKey(dataset);
  const definition = assertDatasetSupported(datasetKey);
  const region = await resolveRegion(regionCode);
  const previousRun = await fetchPreviousRun(datasetKey, region?.id ?? null);

  if (!force && previousRun?.runFinishedAt) {
    const minutesSince = DateTime.utc()
      .diff(DateTime.fromJSDate(previousRun.runFinishedAt), 'minutes')
      .toObject().minutes;
    if (typeof minutesSince === 'number' && minutesSince < cooldownMinutes(datasetKey)) {
      throw new Error(
        `Dataset ${datasetKey} was exported ${minutesSince.toFixed(1)} minutes ago; cooldown prevents another run yet.`
      );
    }
  }

  const activeRun = await WarehouseExportRun.findOne({
    where: {
      dataset: datasetKey,
      regionId: region?.id ?? null,
      status: 'running'
    }
  });
  if (activeRun) {
    throw new Error(`Dataset ${datasetKey} already has an active export in progress for ${region?.code ?? 'GLOBAL'}`);
  }

  const effectiveSince = computeSince(datasetKey, previousRun, since);

  const run = await WarehouseExportRun.create({
    dataset: datasetKey,
    status: 'running',
    regionId: region?.id ?? null,
    triggeredBy: actorId,
    runStartedAt: new Date(),
    metadata: {
      ...datasetConfig(datasetKey),
      source,
      effectiveSince: effectiveSince?.toISOString() ?? null
    }
  });

  try {
    const { filePath, rowCount, lastCursor } = await writeDatasetToFile({
      definition,
      datasetKey,
      region,
      since: effectiveSince
    });

    run.status = 'succeeded';
    run.filePath = filePath;
    run.rowCount = rowCount;
    run.runFinishedAt = new Date();
    run.lastCursor = lastCursor
      ? {
          field: definition.cursorField,
          value: lastCursor.toISOString()
        }
      : null;
    run.metadata = {
      ...run.metadata,
      completedAt: run.runFinishedAt.toISOString(),
      batches: Math.ceil(rowCount / ensureBatchSize())
    };
    await run.save();
    return run;
  } catch (error) {
    run.status = 'failed';
    run.error = error.message;
    run.runFinishedAt = new Date();
    await run.save();
    throw error;
  }
}

export async function listWarehouseExportRuns({ dataset, regionCode, limit = 50 } = {}) {
  const datasetKey = dataset ? normaliseDatasetKey(dataset) : null;
  const region = regionCode ? await resolveRegion(regionCode) : null;

  const where = {};
  if (datasetKey) {
    where.dataset = datasetKey;
  }
  if (region) {
    where.regionId = region.id;
  }

  return WarehouseExportRun.findAll({
    where,
    order: [['runStartedAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
    include: [
      { model: Region, as: 'region', attributes: ['id', 'code', 'name'] },
      { model: User, as: 'triggeredByUser', attributes: ['id', 'firstName', 'lastName', 'emailHash'] }
    ]
  });
}

export async function runScheduledWarehouseExports(logger = console) {
  const enabledDatasets = DEFAULT_DATASETS.filter(datasetEnabled);
  if (enabledDatasets.length === 0) {
    return { triggered: [] };
  }

  const defaultRegions = Array.isArray(config.dataWarehouse.regions) && config.dataWarehouse.regions.length > 0
    ? config.dataWarehouse.regions
    : [config.consent.defaultRegion ?? 'GB'];

  const triggered = [];
  for (const datasetKey of enabledDatasets) {
    const datasetRegions = Array.isArray(datasetConfig(datasetKey).regions) && datasetConfig(datasetKey).regions.length > 0
      ? datasetConfig(datasetKey).regions
      : defaultRegions;

    for (const regionCode of datasetRegions) {
      try {
        const run = await triggerWarehouseExport({
          dataset: datasetKey,
          regionCode,
          source: 'scheduler'
        });
        triggered.push(run);
      } catch (error) {
        logger.error?.(`Failed to export dataset ${datasetKey} for region ${regionCode}`, error);
      }
    }
  }

  return { triggered };
}

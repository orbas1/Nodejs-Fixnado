import { randomUUID } from 'node:crypto';
import { ScamDetectionEvent } from '../models/index.js';

const KEYWORD_PATTERNS = [
  /crypto wallet/i,
  /advance fee/i,
  /wire transfer/i,
  /gift cards?/i,
  /telegram/i,
  /whatsapp/i,
  /cash only/i,
  /send money/i
];

const CONTACT_PATTERNS = [/\b[a-z0-9._%+-]+@gmail\.com\b/i, /\+?\d{9,}/];
const BUDGET_THRESHOLD = 20000;
const LOW_BUDGET_THRESHOLD = 10;

function normalise(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function detectSignals(payload) {
  const text = [payload.title, payload.description, payload.message]
    .map((part) => normalise(part))
    .join(' ');

  const signals = [];

  KEYWORD_PATTERNS.forEach((pattern) => {
    if (pattern.test(text)) {
      signals.push({ type: 'keyword', value: pattern.source });
    }
  });

  CONTACT_PATTERNS.forEach((pattern) => {
    if (pattern.test(text)) {
      signals.push({ type: 'contact', value: pattern.source });
    }
  });

  if (payload.budgetAmount && Number.isFinite(payload.budgetAmount)) {
    if (payload.budgetAmount >= BUDGET_THRESHOLD) {
      signals.push({ type: 'budget_high', value: payload.budgetAmount });
    }
    if (payload.budgetAmount > 0 && payload.budgetAmount <= LOW_BUDGET_THRESHOLD) {
      signals.push({ type: 'budget_low', value: payload.budgetAmount });
    }
  }

  if (Array.isArray(payload.attachments)) {
    const externalLinks = payload.attachments.filter((attachment) =>
      typeof attachment === 'string' && /bit\.ly|tinyurl|mega\.nz|anonfiles/i.test(attachment)
    );
    if (externalLinks.length) {
      signals.push({ type: 'attachments_shortlink', value: externalLinks.length });
    }
  }

  if (payload.metadata?.ipReputation === 'poor') {
    signals.push({ type: 'ip_reputation', value: 'poor' });
  }

  return signals;
}

function calculateScore(signals) {
  if (!signals.length) {
    return 0;
  }
  let score = 0;
  for (const signal of signals) {
    switch (signal.type) {
      case 'keyword':
        score += 15;
        break;
      case 'contact':
        score += 20;
        break;
      case 'budget_high':
        score += 25;
        break;
      case 'budget_low':
        score += 10;
        break;
      case 'attachments_shortlink':
        score += 30;
        break;
      case 'ip_reputation':
        score += 25;
        break;
      default:
        score += 5;
        break;
    }
  }
  return Math.min(score, 100);
}

export function evaluateScamRisk(payload) {
  const signals = detectSignals(payload);
  const score = calculateScore(signals);
  const triggered = score >= 45;
  return { score, signals, triggered };
}

export async function recordScamEvaluation({
  sourceType,
  sourceId,
  actorId,
  actorRole,
  payload
}) {
  const { score, signals, triggered } = evaluateScamRisk(payload);
  let metadata = {};
  try {
    metadata = JSON.parse(JSON.stringify(payload ?? {}));
  } catch (error) {
    metadata = { error: 'serialisation_failed' };
  }
  try {
    await ScamDetectionEvent.create({
      id: randomUUID(),
      sourceType,
      sourceId: sourceId ?? null,
      actorId: actorId ?? null,
      actorRole: actorRole ?? null,
      riskScore: score,
      triggered,
      signals,
      metadata
    });
  } catch (error) {
    console.error('Failed to persist scam detection event', {
      message: error.message,
      sourceType,
      sourceId
    });
  }

  return { score, signals, triggered };
}

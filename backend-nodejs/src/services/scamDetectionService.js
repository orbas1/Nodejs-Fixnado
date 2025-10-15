import { setTimeout as delay } from 'node:timers/promises';
import { Op } from 'sequelize';
import config from '../config/index.js';
import { Booking } from '../models/index.js';
import { recordAnalyticsEvent } from './analyticsEventService.js';
import { recordSecurityEvent } from './auditTrailService.js';
import opsgenieService from './opsgenieService.js';

const { risk: riskConfig } = config;

const SUSPICIOUS_KEYWORDS = ['crypto', 'bitcoin', 'gift card', 'wire', 'western union', 'urgent transfer'];

function clampScore(value) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}

function scoreToTier(score, thresholds) {
  if (score >= thresholds.high) {
    return 'high';
  }
  if (score >= thresholds.medium) {
    return 'medium';
  }
  return 'low';
}

async function invokeAiAssessment(payload) {
  const endpoint = riskConfig?.scamDetection?.aiEndpoint;
  if (!endpoint) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = riskConfig?.scamDetection?.aiTimeoutMs ?? 1500;
    const timeoutHandle = delay(timeout).then(() => controller.abort());
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(riskConfig?.scamDetection?.aiToken
          ? { Authorization: `Bearer ${riskConfig.scamDetection.aiToken}` }
          : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    timeoutHandle.catch(() => {});
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data || typeof data.score !== 'number') {
      return null;
    }
    return {
      score: clampScore(data.score),
      rationale: Array.isArray(data.reasons) ? data.reasons : []
    };
  } catch (error) {
    console.warn('AI scam detection request failed', error.message);
    return null;
  }
}

function evaluateHeuristics(booking, context) {
  const signals = [];
  let score = 0;

  const baseAmount = Number.parseFloat(booking.totalAmount ?? booking.baseAmount ?? 0);
  if (baseAmount >= 7500) {
    score += 0.4;
    signals.push({ code: 'high_amount', message: 'Booking total exceeds £7,500' });
  } else if (baseAmount >= 3000) {
    score += 0.25;
    signals.push({ code: 'elevated_amount', message: 'Booking total exceeds £3,000' });
  }

  if (booking.type === 'on_demand' && context.recentBookingsCount > 3) {
    score += 0.2;
    signals.push({ code: 'rapid_fire', message: 'Multiple on-demand bookings in last 24h' });
  }

  if (context.disputedBookingsCount > 0) {
    score += 0.25;
    signals.push({ code: 'dispute_history', message: 'Customer has prior disputes' });
  }

  const notes = `${context.metadata?.notes ?? ''}`.toLowerCase();
  if (SUSPICIOUS_KEYWORDS.some((keyword) => notes.includes(keyword))) {
    score += 0.2;
    signals.push({ code: 'keyword_match', message: 'Booking notes include flagged keywords' });
  }

  const paymentMethod = `${context.metadata?.paymentMethod ?? ''}`.toLowerCase();
  if (paymentMethod && ['wire', 'crypto', 'cash'].includes(paymentMethod)) {
    score += 0.2;
    signals.push({ code: 'payment_method', message: `Untrusted payment method: ${paymentMethod}` });
  }

  if (context.metadata?.locationConfidence !== undefined && context.metadata.locationConfidence < 0.4) {
    score += 0.15;
    signals.push({ code: 'low_location_confidence', message: 'Low confidence in service location' });
  }

  return { score: clampScore(score), signals };
}

async function loadBookingContext(booking) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentBookingsCount = await Booking.count({
    where: {
      customerId: booking.customerId,
      id: { [Op.not]: booking.id },
      createdAt: { [Op.gte]: twentyFourHoursAgo }
    }
  });

  const disputedBookingsCount = await Booking.count({
    where: {
      customerId: booking.customerId,
      status: 'disputed'
    }
  });

  return {
    recentBookingsCount,
    disputedBookingsCount,
    metadata: booking.meta || {}
  };
}

export async function evaluateBookingRisk(booking) {
  const context = await loadBookingContext(booking);
  const heuristics = evaluateHeuristics(booking, context);
  let combinedScore = heuristics.score;
  const aiAssessment = await invokeAiAssessment({
    booking: {
      id: booking.id,
      baseAmount: booking.baseAmount,
      totalAmount: booking.totalAmount,
      type: booking.type,
      demandLevel: booking.meta?.demandLevel,
      companyId: booking.companyId,
      zoneId: booking.zoneId
    },
    context
  });

  const signals = [...heuristics.signals];
  if (aiAssessment) {
    combinedScore = clampScore((combinedScore + aiAssessment.score) / 2);
    for (const reason of aiAssessment.rationale) {
      signals.push({ code: 'ai_signal', message: reason });
    }
  }

  const thresholds = {
    high: riskConfig?.scamDetection?.highRiskScore ?? 0.75,
    medium: riskConfig?.scamDetection?.mediumRiskScore ?? 0.45
  };

  return {
    score: combinedScore,
    tier: scoreToTier(combinedScore, thresholds),
    signals,
    context,
    aiAssessment
  };
}

async function notifyTrustTeam(booking, evaluation) {
  try {
    await recordSecurityEvent({
      userId: booking.customerId,
      actorRole: 'customer',
      actorPersona: 'risk_engine',
      resource: 'booking',
      action: 'booking.scam_flagged',
      decision: 'deny',
      reason: 'Potential scam detected',
      metadata: {
        bookingId: booking.id,
        score: evaluation.score,
        signals: evaluation.signals
      }
    });

    await opsgenieService.raiseAlert(
      {
        alias: `booking-scam-${booking.id}`,
        message: 'High risk booking flagged by scam heuristics',
        description: `Booking ${booking.id} scored ${(evaluation.score * 100).toFixed(0)} risk.`,
        priority: 'P2',
        tags: ['booking', 'scam-detection'],
        details: {
          bookingId: booking.id,
          customerId: booking.customerId,
          companyId: booking.companyId,
          riskScore: evaluation.score,
          tier: evaluation.tier
        }
      }
    );
  } catch (error) {
    console.error('Failed to notify trust & safety', error.message);
  }
}

export async function applyScamDetection({ booking, actor = null, transaction = null }) {
  const evaluation = await evaluateBookingRisk(booking);
  const nextMeta = {
    ...(booking.meta || {}),
    riskAssessment: {
      score: evaluation.score,
      tier: evaluation.tier,
      signals: evaluation.signals,
      evaluatedAt: new Date().toISOString()
    }
  };

  await booking.update({ meta: nextMeta }, { transaction });

  await recordAnalyticsEvent(
    {
      name: 'booking.risk_evaluated',
      entityId: booking.id,
      actor: actor,
      tenantId: booking.companyId,
      occurredAt: new Date(),
      metadata: {
        bookingId: booking.id,
        customerId: booking.customerId,
        riskScore: evaluation.score,
        tier: evaluation.tier,
        signals: evaluation.signals
      }
    },
    { transaction }
  );

  if (evaluation.tier === 'high') {
    await notifyTrustTeam(booking, evaluation);
  }

  return evaluation;
}

export default {
  evaluateBookingRisk,
  applyScamDetection
};

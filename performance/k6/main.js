import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { uuidv4, randomBetween, sample, isoDate, minutesFromNow, clamp } from './utils.js';

const profilePath = __ENV.K6_PROFILE_PATH || '../profiles/baseline.json';
let profile;
try {
  profile = JSON.parse(open(profilePath));
} catch (error) {
  fail(`Unable to load k6 profile from ${profilePath}: ${error.message}`);
}

const scenarioSettings = profile.settings || {};
const loadMultiplier = Number(__ENV.K6_LOAD_MULTIPLIER || scenarioSettings.defaultMultiplier || 1);
const scenarioMap = {
  booking_flow: 'bookingFlow',
  chat_flow: 'chatFlow',
  payments_flow: 'paymentsFlow',
  analytics_flow: 'analyticsFlow',
  ads_flow: 'adsFlow'
};

function scaleScenario(config = {}) {
  const clone = JSON.parse(JSON.stringify(config));
  if (clone.vus) {
    clone.vus = Math.max(Math.ceil(clone.vus * loadMultiplier), 1);
  }
  if (clone.startRate) {
    clone.startRate = Number((clone.startRate * loadMultiplier).toFixed(2));
  }
  if (clone.exec === undefined && clone.scenario !== undefined) {
    delete clone.scenario;
  }
  if (clone.stages) {
    clone.stages = clone.stages.map((stage) => {
      const updated = { ...stage };
      if (typeof updated.target === 'number') {
        updated.target = Math.round(updated.target * loadMultiplier);
      }
      return updated;
    });
  }
  if (clone.preAllocatedVUs) {
    clone.preAllocatedVUs = Math.max(Math.ceil(clone.preAllocatedVUs * loadMultiplier), 1);
  }
  if (clone.maxVUs) {
    clone.maxVUs = Math.max(Math.ceil(clone.maxVUs * loadMultiplier), clone.preAllocatedVUs || 1);
  }
  if (clone.rate) {
    clone.rate = Number((clone.rate * loadMultiplier).toFixed(2));
  }
  return clone;
}

function buildScenarios() {
  const definitions = profile.scenarios || {};
  const scenarios = {};
  for (const [name, config] of Object.entries(definitions)) {
    const execName = scenarioMap[name];
    if (!execName) {
      continue;
    }
    scenarios[name] = {
      exec: execName,
      ...scaleScenario(config)
    };
  }
  if (Object.keys(scenarios).length === 0) {
    fail('No executable scenarios were defined in the k6 profile.');
  }
  return scenarios;
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: profile.thresholds || {},
  discardResponseBodies: Boolean(scenarioSettings.discardResponseBodies)
};

const jsonHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

function authHeaders(token) {
  if (!token) {
    return { ...jsonHeaders };
  }
  return {
    ...jsonHeaders,
    Authorization: `Bearer ${token}`
  };
}

function parseJson(response, context) {
  try {
    return response.json();
  } catch (error) {
    throw new Error(`${context} — failed to parse JSON response: ${error.message}`);
  }
}

function listToArray(response, context) {
  const payload = parseJson(response, context);
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
}

const bookingDuration = new Trend('booking_flow_duration', true);
const bookingSuccessRate = new Rate('booking_flow_success_rate');
const bookingFailures = new Counter('booking_flow_failures');

const chatDuration = new Trend('chat_flow_duration', true);
const chatSuccessRate = new Rate('chat_flow_success_rate');
const chatFailures = new Counter('chat_flow_failures');

const paymentsDuration = new Trend('payments_flow_duration', true);
const paymentsSuccessRate = new Rate('payments_flow_success_rate');
const paymentsFailures = new Counter('payments_flow_failures');

const analyticsDuration = new Trend('analytics_flow_duration', true);
const analyticsSuccessRate = new Rate('analytics_flow_success_rate');
const analyticsFailures = new Counter('analytics_flow_failures');

const adsDuration = new Trend('ads_flow_duration', true);
const adsSuccessRate = new Rate('ads_flow_success_rate');
const adsFailures = new Counter('ads_flow_failures');

function ensureZone(baseUrl, companyId) {
  if (__ENV.K6_ZONE_ID) {
    return __ENV.K6_ZONE_ID;
  }

  const listRes = http.get(`${baseUrl}/api/zones?companyId=${companyId}`, { headers: jsonHeaders });
  if (listRes.status === 200) {
    const zones = listToArray(listRes, 'list zones');
    if (zones.length > 0) {
      const candidate = zones[0].zone || zones[0];
      if (candidate && candidate.id) {
        return candidate.id;
      }
    }
  }

  const baseLat = 51.48 + Math.random() * 0.05;
  const baseLon = -0.12 + Math.random() * 0.05;
  const delta = clamp(randomBetween(0.01, 0.025), 0.005, 0.04);
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [baseLon, baseLat],
        [baseLon + delta, baseLat],
        [baseLon + delta, baseLat + delta],
        [baseLon, baseLat + delta],
        [baseLon, baseLat]
      ]
    ]
  };

  const payload = {
    companyId,
    name: `Load test zone ${uuidv4().slice(0, 8)}`,
    demandLevel: 'medium',
    geometry,
    metadata: {
      scenario: 'load-test',
      createdBy: 'k6-harness'
    }
  };

  const createRes = http.post(`${baseUrl}/api/zones`, JSON.stringify(payload), { headers: jsonHeaders });
  if (!check(createRes, { 'create zone 201': (res) => res.status === 201 })) {
    throw new Error(`Failed to create load-test zone — status ${createRes.status}: ${createRes.body}`);
  }
  const zone = parseJson(createRes, 'zone creation');
  if (!zone.id) {
    throw new Error('Zone creation response did not include an id');
  }
  return zone.id;
}

function ensureService(baseUrl, tokens, providerId) {
  if (__ENV.K6_SERVICE_ID) {
    return __ENV.K6_SERVICE_ID;
  }

  const listRes = http.get(`${baseUrl}/api/services`, { headers: jsonHeaders });
  if (listRes.status === 200) {
    const services = listToArray(listRes, 'list services');
    const existing = services.find((service) => service?.providerId === providerId) || services[0];
    if (existing && existing.id) {
      return existing.id;
    }
  }

  if (!tokens.provider) {
    throw new Error('K6_PROVIDER_TOKEN is required to create a load-test service');
  }

  const payload = {
    title: `Load test service ${uuidv4().slice(0, 6)}`,
    description: 'Synthetic service created by the performance harness to exercise escrow purchase flows.',
    category: 'load-test',
    price: Number(randomBetween(75, 240).toFixed(2)),
    currency: 'GBP'
  };

  const createRes = http.post(`${baseUrl}/api/services`, JSON.stringify(payload), { headers: authHeaders(tokens.provider) });
  if (!check(createRes, { 'create service 201': (res) => res.status === 201 })) {
    throw new Error(`Failed to create load-test service — status ${createRes.status}: ${createRes.body}`);
  }
  const service = parseJson(createRes, 'service creation');
  if (!service.id) {
    throw new Error('Service creation response missing id');
  }
  return service.id;
}

function ensureCampaign(baseUrl, tokens, companyId) {
  if (__ENV.K6_CAMPAIGN_ID) {
    return __ENV.K6_CAMPAIGN_ID;
  }

  const listRes = http.get(`${baseUrl}/api/campaigns?companyId=${companyId}`, { headers: authHeaders(tokens.admin) });
  if (listRes.status === 200) {
    const campaigns = listToArray(listRes, 'list campaigns');
    const existing = campaigns.find((campaign) => campaign?.status !== 'archived');
    if (existing && existing.id) {
      return existing.id;
    }
  }

  if (!tokens.admin) {
    throw new Error('K6_ADMIN_TOKEN is required to create a load-test campaign');
  }

  const now = new Date();
  const payload = {
    companyId,
    name: `Load Test Campaign ${uuidv4().slice(0, 6)}`,
    objective: 'awareness',
    campaignType: 'search',
    status: 'active',
    pacingStrategy: 'even',
    bidStrategy: 'cpc',
    currency: 'GBP',
    totalBudget: Number(randomBetween(3000, 8000).toFixed(2)),
    dailySpendCap: Number(randomBetween(250, 650).toFixed(2)),
    startAt: isoDate(now),
    endAt: isoDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
    metadata: {
      scenario: 'load-test',
      owner: 'analytics-qa'
    }
  };

  const createRes = http.post(`${baseUrl}/api/campaigns`, JSON.stringify(payload), { headers: authHeaders(tokens.admin) });
  if (!check(createRes, { 'create campaign 201': (res) => res.status === 201 })) {
    throw new Error(`Failed to create load-test campaign — status ${createRes.status}: ${createRes.body}`);
  }
  const campaign = parseJson(createRes, 'campaign creation');
  if (!campaign.id) {
    throw new Error('Campaign creation response missing id');
  }
  return campaign.id;
}

export function setup() {
  const requiredEnv = profile.requiredEnv || [];
  const missing = requiredEnv.filter((key) => !__ENV[key]);
  if (missing.length > 0) {
    fail(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const baseUrl = __ENV.K6_BASE_URL || scenarioSettings.baseUrl || 'http://localhost:4000';
  const tokens = {
    user: __ENV.K6_USER_TOKEN,
    provider: __ENV.K6_PROVIDER_TOKEN,
    admin: __ENV.K6_ADMIN_TOKEN
  };

  const companyId = __ENV.K6_COMPANY_ID;
  const providerId = __ENV.K6_PROVIDER_ID;
  const customerId = __ENV.K6_CUSTOMER_ID;
  const dispatcherId = __ENV.K6_DISPATCHER_ID || providerId || customerId;
  const analyticsPersona = __ENV.K6_ANALYTICS_PERSONA || scenarioSettings.analyticsPersona || 'admin';

  if (!companyId || !providerId || !customerId) {
    fail('K6_COMPANY_ID, K6_PROVIDER_ID, and K6_CUSTOMER_ID must be set for the performance harness.');
  }
  if (!tokens.user) {
    fail('K6_USER_TOKEN must be provided to execute payments/escrow flows.');
  }
  if (!tokens.provider) {
    fail('K6_PROVIDER_TOKEN must be provided to create inventory/services and accept assignments.');
  }
  if (!tokens.admin) {
    fail('K6_ADMIN_TOKEN must be provided to run analytics and campaign flows.');
  }

  const zoneId = ensureZone(baseUrl, companyId);
  const serviceId = ensureService(baseUrl, tokens, providerId);
  const campaignId = ensureCampaign(baseUrl, tokens, companyId);

  return {
    baseUrl,
    tokens,
    companyId,
    providerId,
    customerId,
    dispatcherId,
    analyticsPersona,
    zoneId,
    serviceId,
    campaignId,
    settings: scenarioSettings
  };
}

function bookingPayload(data) {
  const bookingSettings = data.settings?.booking || {};
  const scheduledShare = clamp(Number(bookingSettings.scheduledShare ?? 0.35), 0, 1);
  const isScheduled = Math.random() < scheduledShare;
  const baseAmount = Number(randomBetween(bookingSettings.baseAmountMin ?? 85, bookingSettings.baseAmountMax ?? 260).toFixed(2));
  const payload = {
    customerId: data.customerId,
    companyId: data.companyId,
    zoneId: data.zoneId,
    type: isScheduled ? 'scheduled' : 'on_demand',
    demandLevel: sample(['low', 'medium', 'high']),
    baseAmount,
    currency: 'GBP',
    targetCurrency: 'GBP',
    metadata: {
      scenario: 'load-test',
      runId: exec.scenario.iterationInTest,
      note: 'Automated booking load test'
    },
    actor: data.dispatcherId
      ? {
          id: data.dispatcherId,
          type: 'user'
        }
      : null
  };

  if (isScheduled) {
    const windowMinutes = randomBetween(bookingSettings.windowMinutesMin ?? 90, bookingSettings.windowMinutesMax ?? 360);
    const start = minutesFromNow(randomBetween(bookingSettings.leadMinutesMin ?? 120, bookingSettings.leadMinutesMax ?? 720));
    const end = new Date(start.getTime() + windowMinutes * 60000);
    payload.scheduledStart = isoDate(start);
    payload.scheduledEnd = isoDate(end);
  }

  return payload;
}

export function bookingFlow(data) {
  const start = Date.now();
  let success = true;
  try {
    const createRes = http.post(`${data.baseUrl}/api/bookings`, JSON.stringify(bookingPayload(data)), { headers: jsonHeaders });
    if (!check(createRes, { 'booking created': (res) => res.status === 201 })) {
      throw new Error(`Booking creation failed — status ${createRes.status}: ${createRes.body}`);
    }
    const booking = parseJson(createRes, 'booking creation');

    const assignmentPayload = {
      assignments: [
        {
          providerId: data.providerId,
          role: 'lead'
        }
      ],
      actorId: data.dispatcherId
    };

    const assignmentRes = http.post(
      `${data.baseUrl}/api/bookings/${booking.id}/assignments`,
      JSON.stringify(assignmentPayload),
      { headers: jsonHeaders }
    );
    if (!check(assignmentRes, { 'assignment accepted': (res) => res.status === 201 || res.status === 200 })) {
      throw new Error(`Assignment creation failed — status ${assignmentRes.status}: ${assignmentRes.body}`);
    }

    const responseRes = http.post(
      `${data.baseUrl}/api/bookings/${booking.id}/assignments/response`,
      JSON.stringify({ bookingId: booking.id, providerId: data.providerId, status: 'accepted' }),
      { headers: jsonHeaders }
    );
    if (!check(responseRes, { 'assignment response ok': (res) => res.status === 200 })) {
      throw new Error(`Assignment response failed — status ${responseRes.status}: ${responseRes.body}`);
    }

    const statusRes = http.patch(
      `${data.baseUrl}/api/bookings/${booking.id}/status`,
      JSON.stringify({ status: 'completed', actorId: data.dispatcherId, reason: 'load_test_complete' }),
      { headers: jsonHeaders }
    );
    if (!check(statusRes, { 'status update ok': (res) => res.status === 200 })) {
      throw new Error(`Booking status update failed — status ${statusRes.status}: ${statusRes.body}`);
    }

    http.get(`${data.baseUrl}/api/bookings?companyId=${data.companyId}&limit=5`, { headers: jsonHeaders });
  } catch (error) {
    success = false;
    bookingFailures.add(1);
    console.error(`[bookingFlow] ${error.message}`);
  } finally {
    bookingDuration.add(Date.now() - start);
    bookingSuccessRate.add(success);
    sleep(data.settings?.booking?.sleepSeconds ?? data.settings?.defaultSleepSeconds ?? 0.35);
  }
}

export function chatFlow(data) {
  const start = Date.now();
  let success = true;
  try {
    const conversationPayload = {
      subject: `Load test conversation ${uuidv4().slice(0, 8)}`,
      createdBy: {
        id: data.providerId,
        type: 'provider'
      },
      participants: [
        {
          participantType: 'user',
          participantReferenceId: data.customerId,
          displayName: 'Load Test Customer',
          role: 'customer'
        },
        {
          participantType: 'provider',
          participantReferenceId: data.providerId,
          displayName: 'Load Test Provider',
          role: 'provider'
        }
      ],
      metadata: {
        scenario: 'load-test',
        seed: exec.scenario.iterationInTest
      },
      aiAssist: {
        defaultEnabled: false
      }
    };

    const createRes = http.post(
      `${data.baseUrl}/api/communications`,
      JSON.stringify(conversationPayload),
      { headers: authHeaders(data.tokens.admin || data.tokens.provider) }
    );
    if (!check(createRes, { 'conversation created': (res) => res.status === 201 })) {
      throw new Error(`Conversation creation failed — status ${createRes.status}: ${createRes.body}`);
    }

    const conversation = parseJson(createRes, 'conversation creation');
    const participants = conversation.participants || [];
    const customerParticipant = participants.find((participant) => participant.participantReferenceId === data.customerId);
    const providerParticipant = participants.find((participant) => participant.participantReferenceId === data.providerId);
    if (!customerParticipant || !providerParticipant) {
      throw new Error('Conversation participants missing expected references');
    }

    const wordBank = data.settings?.communications?.messageSeeds || [
      'Need confirmation on tomorrow\'s booking, please advise.',
      'Sharing additional context for the assigned task.',
      'Requesting materials checklist before travelling on-site.'
    ];
    const messageBody = `${sample(wordBank)} (run ${exec.scenario.iterationInTest})`;

    const messageRes = http.post(
      `${data.baseUrl}/api/communications/${conversation.id}/messages`,
      JSON.stringify({
        senderParticipantId: customerParticipant.id,
        body: messageBody,
        messageType: 'user',
        attachments: [],
        metadata: { scenario: 'load-test' }
      }),
      { headers: authHeaders(data.tokens.user || data.tokens.admin) }
    );
    if (!check(messageRes, { 'customer message sent': (res) => res.status === 201 })) {
      throw new Error(`Customer message failed — status ${messageRes.status}: ${messageRes.body}`);
    }

    const replyRes = http.post(
      `${data.baseUrl}/api/communications/${conversation.id}/messages`,
      JSON.stringify({
        senderParticipantId: providerParticipant.id,
        body: 'Provider acknowledgement: schedule confirmed.',
        messageType: 'provider',
        attachments: [],
        metadata: { scenario: 'load-test' }
      }),
      { headers: authHeaders(data.tokens.provider || data.tokens.admin) }
    );
    if (!check(replyRes, { 'provider reply sent': (res) => res.status === 201 })) {
      throw new Error(`Provider reply failed — status ${replyRes.status}: ${replyRes.body}`);
    }

    const videoRes = http.post(
      `${data.baseUrl}/api/communications/${conversation.id}/video-session`,
      JSON.stringify({
        participantId: providerParticipant.id,
        channelName: `load-test-${uuidv4().slice(0, 6)}`,
        expirySeconds: clamp(Number(data.settings?.communications?.sessionTtlSeconds ?? 900), 300, 3600)
      }),
      { headers: authHeaders(data.tokens.provider || data.tokens.admin) }
    );
    if (!check(videoRes, { 'video session issued': (res) => res.status === 201 })) {
      throw new Error(`Video session creation failed — status ${videoRes.status}: ${videoRes.body}`);
    }

    http.get(`${data.baseUrl}/api/communications/${conversation.id}?limit=5`, {
      headers: authHeaders(data.tokens.admin || data.tokens.provider)
    });
  } catch (error) {
    success = false;
    chatFailures.add(1);
    console.error(`[chatFlow] ${error.message}`);
  } finally {
    chatDuration.add(Date.now() - start);
    chatSuccessRate.add(success);
    sleep(data.settings?.communications?.sleepSeconds ?? data.settings?.defaultSleepSeconds ?? 0.4);
  }
}

export function paymentsFlow(data) {
  const start = Date.now();
  let success = true;
  try {
    const scheduledFor = minutesFromNow(randomBetween(90, 480));
    const payload = {
      totalAmount: Number(randomBetween(120, 320).toFixed(2)),
      currency: 'GBP',
      scheduledFor: isoDate(scheduledFor)
    };

    const purchaseRes = http.post(
      `${data.baseUrl}/api/services/${data.serviceId}/purchase`,
      JSON.stringify(payload),
      { headers: authHeaders(data.tokens.user) }
    );
    if (!check(purchaseRes, { 'service purchase ok': (res) => res.status === 201 })) {
      throw new Error(`Service purchase failed — status ${purchaseRes.status}: ${purchaseRes.body}`);
    }

    parseJson(purchaseRes, 'service purchase confirmation');
  } catch (error) {
    success = false;
    paymentsFailures.add(1);
    console.error(`[paymentsFlow] ${error.message}`);
  } finally {
    paymentsDuration.add(Date.now() - start);
    paymentsSuccessRate.add(success);
    sleep(data.settings?.payments?.sleepSeconds ?? data.settings?.defaultSleepSeconds ?? 0.4);
  }
}

export function analyticsFlow(data) {
  const start = Date.now();
  let success = true;
  try {
    const timezone = data.settings?.analytics?.timezone || 'Europe/London';
    const windowDays = clamp(Number(data.settings?.analytics?.windowDays ?? 7), 1, 30);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const dashboardRes = http.get(
      `${data.baseUrl}/api/analytics/dashboards/${data.analyticsPersona}?timezone=${encodeURIComponent(
        timezone
      )}&startDate=${encodeURIComponent(isoDate(startDate))}&endDate=${encodeURIComponent(isoDate(endDate))}`,
      { headers: authHeaders(data.tokens.admin) }
    );
    if (!check(dashboardRes, { 'analytics dashboard ok': (res) => res.status === 200 })) {
      throw new Error(`Persona dashboard request failed — status ${dashboardRes.status}: ${dashboardRes.body}`);
    }

    const summary = parseJson(dashboardRes, 'persona dashboard response');
    if (!summary || typeof summary !== 'object') {
      throw new Error('Persona dashboard response payload invalid');
    }

    const statusRes = http.get(`${data.baseUrl}/api/analytics/pipeline/status`, { headers: authHeaders(data.tokens.admin) });
    if (!check(statusRes, { 'pipeline status ok': (res) => res.status === 200 })) {
      throw new Error(`Pipeline status request failed — status ${statusRes.status}: ${statusRes.body}`);
    }
  } catch (error) {
    success = false;
    analyticsFailures.add(1);
    console.error(`[analyticsFlow] ${error.message}`);
  } finally {
    analyticsDuration.add(Date.now() - start);
    analyticsSuccessRate.add(success);
    sleep(data.settings?.analytics?.sleepSeconds ?? data.settings?.defaultSleepSeconds ?? 0.45);
  }
}

export function adsFlow(data) {
  const start = Date.now();
  let success = true;
  try {
    const metricDate = new Date(Date.now() - Math.floor(Math.random() * 72) * 60 * 60 * 1000);
    const impressions = Math.round(randomBetween(500, 4000));
    const clicks = Math.round(impressions * randomBetween(0.02, 0.18));
    const conversions = Math.round(clicks * randomBetween(0.05, 0.35));
    const spend = Number(randomBetween(120, 750).toFixed(2));
    const revenue = Number(randomBetween(spend * 0.9, spend * 2.8).toFixed(2));

    const metricRes = http.post(
      `${data.baseUrl}/api/campaigns/${data.campaignId}/metrics`,
      JSON.stringify({
        metricDate: isoDate(metricDate),
        impressions,
        clicks,
        conversions,
        spend,
        revenue
      }),
      { headers: authHeaders(data.tokens.admin) }
    );
    if (!check(metricRes, { 'campaign metric ingested': (res) => res.status === 201 })) {
      throw new Error(`Campaign metric ingestion failed — status ${metricRes.status}: ${metricRes.body}`);
    }

    const summaryRes = http.get(`${data.baseUrl}/api/campaigns/${data.campaignId}/summary`, {
      headers: authHeaders(data.tokens.admin)
    });
    if (!check(summaryRes, { 'campaign summary ok': (res) => res.status === 200 })) {
      throw new Error(`Campaign summary failed — status ${summaryRes.status}: ${summaryRes.body}`);
    }

    const fraudRes = http.get(`${data.baseUrl}/api/campaigns/${data.campaignId}/fraud-signals`, {
      headers: authHeaders(data.tokens.admin)
    });
    if (!check(fraudRes, { 'fraud signals ok': (res) => res.status === 200 })) {
      throw new Error(`Fraud signal fetch failed — status ${fraudRes.status}: ${fraudRes.body}`);
    }

    const signals = listToArray(fraudRes, 'campaign fraud signals');
    const unresolved = signals.find((signal) => !signal?.resolvedAt);
    if (unresolved) {
      http.post(
        `${data.baseUrl}/api/campaigns/fraud-signals/${unresolved.id}/resolve`,
        JSON.stringify({
          resolutionNote: 'Automated load-test resolution',
          reviewer: 'k6-harness'
        }),
        { headers: authHeaders(data.tokens.admin) }
      );
    }
  } catch (error) {
    success = false;
    adsFailures.add(1);
    console.error(`[adsFlow] ${error.message}`);
  } finally {
    adsDuration.add(Date.now() - start);
    adsSuccessRate.add(success);
    sleep(data.settings?.ads?.sleepSeconds ?? data.settings?.defaultSleepSeconds ?? 0.5);
  }
}

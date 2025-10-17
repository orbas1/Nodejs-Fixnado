const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : null;

const TONE_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Critical' },
  { value: 'neutral', label: 'Neutral' }
];

const generateId = (prefix) =>
  (globalCrypto?.randomUUID ? globalCrypto.randomUUID() : `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`);

function sanitiseNumberInput(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : '';
}

export function buildInitialState(settings = {}, cards = []) {
  return {
    summary: {
      ownerName: settings.summary?.ownerName ?? '',
      ownerEmail: settings.summary?.ownerEmail ?? '',
      escalationChannel: settings.summary?.escalationChannel ?? '',
      reviewCadence: settings.summary?.reviewCadence ?? '',
      highlightNotes: Array.isArray(settings.summary?.highlightNotes)
        ? settings.summary.highlightNotes.map((note) => (typeof note === 'string' ? note : '')).filter(Boolean)
        : [''],
      metadata: settings.metadata ?? { updatedAt: null, updatedBy: null }
    },
    productivity: {
      targetBillableHours: sanitiseNumberInput(settings.productivity?.targetBillableHours),
      targetUtilisation: sanitiseNumberInput(settings.productivity?.targetUtilisation),
      backlogCeiling: sanitiseNumberInput(settings.productivity?.backlogCeiling),
      responseTargetMinutes: sanitiseNumberInput(settings.productivity?.responseTargetMinutes),
      note: settings.productivity?.note ?? ''
    },
    quality: {
      targetSla: sanitiseNumberInput(settings.quality?.targetSla),
      reworkThreshold: sanitiseNumberInput(settings.quality?.reworkThreshold),
      npsTarget: sanitiseNumberInput(settings.quality?.npsTarget),
      qualityFlagLimit: sanitiseNumberInput(settings.quality?.qualityFlagLimit),
      note: settings.quality?.note ?? ''
    },
    logistics: {
      travelBufferMinutes: sanitiseNumberInput(settings.logistics?.travelBufferMinutes),
      maxConcurrentJobs: sanitiseNumberInput(settings.logistics?.maxConcurrentJobs),
      vehicleComplianceRate: sanitiseNumberInput(settings.logistics?.vehicleComplianceRate),
      standbyCrew: sanitiseNumberInput(settings.logistics?.standbyCrew),
      note: settings.logistics?.note ?? ''
    },
    training: {
      requiredModules: Array.isArray(settings.training?.requiredModules)
        ? settings.training.requiredModules.map((module) => (typeof module === 'string' ? module : '')).filter(Boolean)
        : [],
      certificationAlerts: Array.isArray(settings.training?.certificationAlerts)
        ? settings.training.certificationAlerts.map((alert) => ({
            id: alert.id ?? generateId('cert'),
            name: alert.name ?? '',
            dueDate: alert.dueDate ?? '',
            owner: alert.owner ?? ''
          }))
        : [],
      complianceDueInDays: sanitiseNumberInput(settings.training?.complianceDueInDays),
      lastDrillCompletedAt: settings.training?.lastDrillCompletedAt ?? '',
      nextDrillScheduledAt: settings.training?.nextDrillScheduledAt ?? '',
      note: settings.training?.note ?? ''
    },
    wellness: {
      overtimeCapHours: sanitiseNumberInput(settings.wellness?.overtimeCapHours),
      wellbeingCheckCadence: settings.wellness?.wellbeingCheckCadence ?? '',
      safetyIncidentThreshold: sanitiseNumberInput(settings.wellness?.safetyIncidentThreshold),
      fatigueFlagLimit: sanitiseNumberInput(settings.wellness?.fatigueFlagLimit),
      note: settings.wellness?.note ?? ''
    },
    operations: {
      crewLeaderboard: Array.isArray(settings.operations?.crewLeaderboard)
        ? settings.operations.crewLeaderboard.map((entry) => ({
            id: entry.id ?? generateId('crew'),
            name: entry.name ?? '',
            role: entry.role ?? '',
            completedJobs: sanitiseNumberInput(entry.completedJobs),
            utilisation: sanitiseNumberInput(entry.utilisation),
            qualityScore: sanitiseNumberInput(entry.qualityScore),
            rating: sanitiseNumberInput(entry.rating),
            avatarUrl: entry.avatarUrl ?? '',
            spotlight: entry.spotlight ?? ''
          }))
        : [],
      checklists: Array.isArray(settings.operations?.checklists)
        ? settings.operations.checklists.map((item) => ({
            id: item.id ?? generateId('checklist'),
            label: item.label ?? '',
            owner: item.owner ?? '',
            cadence: item.cadence ?? '',
            lastCompletedAt: item.lastCompletedAt ?? ''
          }))
        : [],
      automation: {
        autoAssignEnabled: settings.operations?.automation?.autoAssignEnabled !== false,
        escalationChannel: settings.operations?.automation?.escalationChannel ?? '',
        followUpChannel: settings.operations?.automation?.followUpChannel ?? '',
        escalateWhen: settings.operations?.automation?.escalateWhen ?? ''
      }
    },
    cards: cards.map((card) => ({ ...card })),
    metadata: settings.metadata ?? { updatedAt: null, updatedBy: null }
  };
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildSettingsPayload(state) {
  return {
    summary: {
      ownerName: state.summary.ownerName || null,
      ownerEmail: state.summary.ownerEmail || null,
      escalationChannel: state.summary.escalationChannel || null,
      reviewCadence: state.summary.reviewCadence || null,
      highlightNotes: state.summary.highlightNotes.filter((note) => note.trim().length > 0)
    },
    productivity: {
      targetBillableHours: toNullableNumber(state.productivity.targetBillableHours),
      targetUtilisation: toNullableNumber(state.productivity.targetUtilisation),
      backlogCeiling: toNullableNumber(state.productivity.backlogCeiling),
      responseTargetMinutes: toNullableNumber(state.productivity.responseTargetMinutes),
      note: state.productivity.note || null
    },
    quality: {
      targetSla: toNullableNumber(state.quality.targetSla),
      reworkThreshold: toNullableNumber(state.quality.reworkThreshold),
      npsTarget: toNullableNumber(state.quality.npsTarget),
      qualityFlagLimit: toNullableNumber(state.quality.qualityFlagLimit),
      note: state.quality.note || null
    },
    logistics: {
      travelBufferMinutes: toNullableNumber(state.logistics.travelBufferMinutes),
      maxConcurrentJobs: toNullableNumber(state.logistics.maxConcurrentJobs),
      vehicleComplianceRate: toNullableNumber(state.logistics.vehicleComplianceRate),
      standbyCrew: toNullableNumber(state.logistics.standbyCrew),
      note: state.logistics.note || null
    },
    training: {
      requiredModules: state.training.requiredModules.filter((module) => module.trim().length > 0),
      certificationAlerts: state.training.certificationAlerts.map((alert) => ({
        id: alert.id,
        name: alert.name || null,
        dueDate: alert.dueDate || null,
        owner: alert.owner || null
      })),
      complianceDueInDays: toNullableNumber(state.training.complianceDueInDays),
      lastDrillCompletedAt: state.training.lastDrillCompletedAt || null,
      nextDrillScheduledAt: state.training.nextDrillScheduledAt || null,
      note: state.training.note || null
    },
    wellness: {
      overtimeCapHours: toNullableNumber(state.wellness.overtimeCapHours),
      wellbeingCheckCadence: state.wellness.wellbeingCheckCadence || null,
      safetyIncidentThreshold: toNullableNumber(state.wellness.safetyIncidentThreshold),
      fatigueFlagLimit: toNullableNumber(state.wellness.fatigueFlagLimit),
      note: state.wellness.note || null
    },
    operations: {
      crewLeaderboard: state.operations.crewLeaderboard.map((entry) => ({
        id: entry.id,
        name: entry.name || null,
        role: entry.role || null,
        completedJobs: toNullableNumber(entry.completedJobs),
        utilisation: toNullableNumber(entry.utilisation),
        qualityScore: toNullableNumber(entry.qualityScore),
        rating: toNullableNumber(entry.rating),
        avatarUrl: entry.avatarUrl || null,
        spotlight: entry.spotlight || null
      })),
      checklists: state.operations.checklists.map((item) => ({
        id: item.id,
        label: item.label || null,
        owner: item.owner || null,
        cadence: item.cadence || null,
        lastCompletedAt: item.lastCompletedAt || null
      })),
      automation: {
        autoAssignEnabled: Boolean(state.operations.automation.autoAssignEnabled),
        escalationChannel: state.operations.automation.escalationChannel || null,
        followUpChannel: state.operations.automation.followUpChannel || null,
        escalateWhen: state.operations.automation.escalateWhen || null
      }
    }
  };
}

export function createCrewMemberDraft() {
  return {
    id: generateId('crew'),
    name: '',
    role: '',
    completedJobs: '',
    utilisation: '',
    qualityScore: '',
    rating: '',
    avatarUrl: '',
    spotlight: ''
  };
}

export function createChecklistDraft() {
  return {
    id: generateId('checklist'),
    label: '',
    owner: '',
    cadence: '',
    lastCompletedAt: ''
  };
}

export function createCertificationDraft() {
  return {
    id: generateId('cert'),
    name: '',
    dueDate: '',
    owner: ''
  };
}

export function buildCardDraft(existing = []) {
  const index = existing.length + 1;
  return {
    id: generateId('card'),
    title: '',
    tone: 'info',
    details: [],
    displayOrder: 100 + index,
    isActive: true,
    mediaUrl: '',
    mediaAlt: '',
    cta: { label: '', href: '', external: false },
    isNew: true
  };
}

export { TONE_OPTIONS };

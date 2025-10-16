export const TONE_OPTIONS = [
  { value: 'info', label: 'Information (blue)' },
  { value: 'success', label: 'Success (green)' },
  { value: 'warning', label: 'Warning (amber)' },
  { value: 'danger', label: 'Alert (rose)' },
  { value: 'neutral', label: 'Neutral (slate)' }
];

export function buildInitialSettingsForm() {
  return {
    summary: { highlightNotes: [''] },
    metrics: {
      escrow: { targetHigh: '', targetMedium: '', captionNote: '' },
      disputes: { thresholdLow: '', thresholdMedium: '', targetMedianMinutes: '', captionNote: '' },
      jobs: { targetHigh: '', targetMedium: '', captionNote: '' },
      sla: { target: '', warning: '', captionNote: '' }
    }
  };
}

export function buildFormState(settings) {
  const form = buildInitialSettingsForm();
  const notes = Array.isArray(settings?.summary?.highlightNotes) ? settings.summary.highlightNotes : [];
  form.summary.highlightNotes = notes.length ? notes : [''];

  const metrics = settings?.metrics ?? {};
  const safeString = (value) => (value == null ? '' : String(value));

  form.metrics.escrow.targetHigh = safeString(metrics?.escrow?.targetHigh);
  form.metrics.escrow.targetMedium = safeString(metrics?.escrow?.targetMedium);
  form.metrics.escrow.captionNote = safeString(metrics?.escrow?.captionNote);

  form.metrics.disputes.thresholdLow = safeString(metrics?.disputes?.thresholdLow);
  form.metrics.disputes.thresholdMedium = safeString(metrics?.disputes?.thresholdMedium);
  form.metrics.disputes.targetMedianMinutes = safeString(metrics?.disputes?.targetMedianMinutes);
  form.metrics.disputes.captionNote = safeString(metrics?.disputes?.captionNote);

  form.metrics.jobs.targetHigh = safeString(metrics?.jobs?.targetHigh);
  form.metrics.jobs.targetMedium = safeString(metrics?.jobs?.targetMedium);
  form.metrics.jobs.captionNote = safeString(metrics?.jobs?.captionNote);

  form.metrics.sla.target = safeString(metrics?.sla?.target);
  form.metrics.sla.warning = safeString(metrics?.sla?.warning);
  form.metrics.sla.captionNote = safeString(metrics?.sla?.captionNote);

  return form;
}

function parseNumber(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseInteger(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number.parseInt(trimmed, 10);
  return Number.isFinite(numeric) ? numeric : null;
}

export function buildSettingsPayload(form) {
  const highlightNotes = form.summary.highlightNotes
    .map((note) => (typeof note === 'string' ? note.trim() : ''))
    .filter((note) => note.length > 0);

  const cleanNote = (value) => {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  return {
    summary: { highlightNotes },
    metrics: {
      escrow: {
        targetHigh: parseNumber(form.metrics.escrow.targetHigh),
        targetMedium: parseNumber(form.metrics.escrow.targetMedium),
        captionNote: cleanNote(form.metrics.escrow.captionNote)
      },
      disputes: {
        thresholdLow: parseNumber(form.metrics.disputes.thresholdLow),
        thresholdMedium: parseNumber(form.metrics.disputes.thresholdMedium),
        targetMedianMinutes: parseInteger(form.metrics.disputes.targetMedianMinutes),
        captionNote: cleanNote(form.metrics.disputes.captionNote)
      },
      jobs: {
        targetHigh: parseNumber(form.metrics.jobs.targetHigh),
        targetMedium: parseNumber(form.metrics.jobs.targetMedium),
        captionNote: cleanNote(form.metrics.jobs.captionNote)
      },
      sla: {
        target: parseNumber(form.metrics.sla.target),
        warning: parseNumber(form.metrics.sla.warning),
        captionNote: cleanNote(form.metrics.sla.captionNote)
      }
    }
  };
}

export function normaliseCardForState(card) {
  if (!card) {
    return null;
  }
  return {
    id: card.id,
    title: card.title ?? '',
    tone: card.tone ?? 'info',
    details: Array.isArray(card.details) ? card.details : [],
    displayOrder: Number.isFinite(card.displayOrder) ? card.displayOrder : 100,
    isActive: card.isActive !== false,
    mediaUrl: card.mediaUrl ?? '',
    mediaAlt: card.mediaAlt ?? '',
    cta: card.cta
      ? {
          label: card.cta.label ?? '',
          href: card.cta.href ?? '',
          external: Boolean(card.cta.external)
        }
      : { label: '', href: '', external: false },
    updatedAt: card.updatedAt ?? null,
    updatedBy: card.updatedBy ?? null,
    isNew: false
  };
}

export function sortCards(cards) {
  return [...cards].sort((a, b) => {
    if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    }
    return a.title.localeCompare(b.title);
  });
}

export function buildCardDraft(existingCards = []) {
  const nextOrder = existingCards.length
    ? Math.max(...existingCards.map((card) => card.displayOrder ?? 100)) + 10
    : 100;
  return {
    id: `temp-${Date.now()}`,
    title: '',
    tone: 'info',
    details: [],
    displayOrder: nextOrder,
    isActive: true,
    mediaUrl: '',
    mediaAlt: '',
    cta: { label: '', href: '', external: false },
    updatedAt: null,
    updatedBy: null,
    isNew: true
  };
}

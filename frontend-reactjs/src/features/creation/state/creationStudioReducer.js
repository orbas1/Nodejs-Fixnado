export const CreationStudioStep = {
  BLUEPRINT: 'blueprint',
  DETAILS: 'details',
  OPERATIONS: 'operations',
  REVIEW: 'review'
};

export const initialCreationState = {
  step: CreationStudioStep.BLUEPRINT,
  blueprintId: null,
  entityName: '',
  slug: '',
  summary: '',
  persona: [],
  region: 'national',
  pricingModel: 'fixed',
  pricingAmount: '',
  billingCurrency: 'GBP',
  setupFee: '',
  availabilityLeadHours: 48,
  availabilityWindow: '08:00-18:00',
  fulfilmentChannels: ['marketplace'],
  complianceChecklist: [],
  automationHints: [],
  marketingAssets: [],
  attachments: [],
  aiAssistEnabled: true,
  validationErrors: {},
  saving: false,
  publishing: false,
  lastSavedAt: null
};

export function creationStudioReducer(state, action) {
  switch (action.type) {
    case 'selectBlueprint': {
      const blueprint = action.payload;
      return {
        ...state,
        step: CreationStudioStep.DETAILS,
        blueprintId: blueprint.id,
        persona: blueprint.persona,
        pricingModel: blueprint.defaultPricingModel ?? state.pricingModel,
        fulfilmentChannels: blueprint.supportedChannels,
        complianceChecklist: blueprint.complianceChecklist,
        automationHints: blueprint.automationHints,
        region: blueprint.recommendedRegions?.[0] ?? state.region,
        validationErrors: {}
      };
    }
    case 'updateField': {
      const { field, value } = action.payload;
      return {
        ...state,
        [field]: value,
        validationErrors: {
          ...state.validationErrors,
          [field]: undefined
        }
      };
    }
    case 'toggleArrayValue': {
      const { field, value } = action.payload;
      const current = Array.isArray(state[field]) ? state[field] : [];
      const exists = current.includes(value);
      return {
        ...state,
        [field]: exists ? current.filter((entry) => entry !== value) : [...current, value]
      };
    }
    case 'enqueueAsset': {
      const { asset } = action.payload;
      return {
        ...state,
        marketingAssets: dedupeById([...state.marketingAssets, asset])
      };
    }
    case 'removeAsset': {
      const { id } = action.payload;
      return {
        ...state,
        marketingAssets: state.marketingAssets.filter((asset) => asset.id !== id)
      };
    }
    case 'goToStep': {
      const { step } = action.payload;
      return {
        ...state,
        step
      };
    }
    case 'saving': {
      return {
        ...state,
        saving: true
      };
    }
    case 'saved': {
      return {
        ...state,
        saving: false,
        lastSavedAt: action.payload?.timestamp ?? new Date().toISOString()
      };
    }
    case 'publish:start': {
      return {
        ...state,
        publishing: true
      };
    }
    case 'publish:success': {
      return {
        ...state,
        publishing: false
      };
    }
    case 'publish:error': {
      return {
        ...state,
        publishing: false
      };
    }
    case 'validationFailed': {
      return {
        ...state,
        validationErrors: action.payload
      };
    }
    default:
      return state;
  }
}

export function validateCreationState(state, blueprint) {
  const errors = {};
  if (!state.blueprintId) {
    errors.blueprintId = 'A blueprint must be selected before continuing.';
  }
  if (!state.entityName || state.entityName.length < 3) {
    errors.entityName = 'Name must be at least 3 characters';
  }
  if (!state.slug || !/^[-a-z0-9]+$/.test(state.slug)) {
    errors.slug = 'Slug may only contain lowercase letters, numbers, and dashes';
  }
  if (!state.summary || state.summary.length < 40) {
    errors.summary = 'Summary should explain the offer in at least 40 characters';
  }
  if (!state.pricingAmount || Number.isNaN(Number.parseFloat(state.pricingAmount))) {
    errors.pricingAmount = 'Provide a numeric value for the primary price';
  }
  if (!Array.isArray(state.fulfilmentChannels) || state.fulfilmentChannels.length === 0) {
    errors.fulfilmentChannels = 'Select at least one fulfilment channel';
  }
  const missingChecklist = (blueprint?.complianceChecklist ?? []).filter(
    (item) => !state.complianceChecklist?.includes(item)
  );
  if (missingChecklist.length > 0) {
    errors.complianceChecklist = `Review required compliance items: ${missingChecklist.join(', ')}`;
  }

  return errors;
}

export function dedupeById(items) {
  const map = new Map();
  for (const item of items) {
    if (!item || !item.id) {
      continue;
    }
    if (!map.has(item.id)) {
      map.set(item.id, item);
      continue;
    }
    const current = map.get(item.id);
    map.set(item.id, { ...current, ...item });
  }
  return Array.from(map.values());
}

export function serializeDraft(state) {
  return {
    blueprintId: state.blueprintId,
    name: state.entityName,
    slug: state.slug,
    summary: state.summary,
    persona: state.persona,
    region: state.region,
    pricing: {
      model: state.pricingModel,
      amount: Number.parseFloat(state.pricingAmount),
      currency: state.billingCurrency,
      setupFee: state.setupFee ? Number.parseFloat(state.setupFee) : null
    },
    availability: {
      leadHours: state.availabilityLeadHours,
      window: state.availabilityWindow
    },
    fulfilmentChannels: state.fulfilmentChannels,
    complianceChecklist: state.complianceChecklist,
    automationHints: state.automationHints,
    marketingAssets: state.marketingAssets,
    attachments: state.attachments,
    aiAssistEnabled: state.aiAssistEnabled
  };
}

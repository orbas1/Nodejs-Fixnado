import { describe, expect, it } from 'vitest';
import {
  CreationStudioStep,
  creationStudioReducer,
  initialCreationState,
  serializeDraft,
  validateCreationState
} from './creationStudioReducer.js';

const sampleBlueprint = {
  id: 'service-package',
  persona: ['provider'],
  defaultPricingModel: 'subscription',
  supportedChannels: ['marketplace', 'direct'],
  complianceChecklist: ['insurance', 'safeguarding'],
  automationHints: ['ai-copy'],
  recommendedRegions: ['regional']
};

describe('creationStudioReducer', () => {
  it('selects a blueprint and advances to details', () => {
    const state = creationStudioReducer(initialCreationState, {
      type: 'selectBlueprint',
      payload: sampleBlueprint
    });

    expect(state.step).toBe(CreationStudioStep.DETAILS);
    expect(state.blueprintId).toBe('service-package');
    expect(state.persona).toEqual(['provider']);
    expect(state.fulfilmentChannels).toEqual(['marketplace', 'direct']);
    expect(state.complianceChecklist).toEqual(['insurance', 'safeguarding']);
  });

  it('toggles fulfilment channels', () => {
    const withBlueprint = creationStudioReducer(initialCreationState, {
      type: 'selectBlueprint',
      payload: sampleBlueprint
    });

    const next = creationStudioReducer(withBlueprint, {
      type: 'toggleArrayValue',
      payload: { field: 'fulfilmentChannels', value: 'white-label' }
    });

    expect(next.fulfilmentChannels).toContain('white-label');

    const reverted = creationStudioReducer(next, {
      type: 'toggleArrayValue',
      payload: { field: 'fulfilmentChannels', value: 'white-label' }
    });

    expect(reverted.fulfilmentChannels).not.toContain('white-label');
  });

  it('records save lifecycle markers', () => {
    const saving = creationStudioReducer(initialCreationState, { type: 'saving' });
    expect(saving.saving).toBe(true);
    const saved = creationStudioReducer(saving, { type: 'saved', payload: { timestamp: '2025-04-09T10:00:00Z' } });
    expect(saved.saving).toBe(false);
    expect(saved.lastSavedAt).toBe('2025-04-09T10:00:00Z');
  });
});

describe('validateCreationState', () => {
  it('returns validation errors for incomplete data', () => {
    const errors = validateCreationState(initialCreationState, sampleBlueprint);
    expect(Object.keys(errors)).toEqual([
      'blueprintId',
      'entityName',
      'slug',
      'summary',
      'pricingAmount',
      'complianceChecklist'
    ]);
  });

  it('passes when mandatory information is set', () => {
    const filled = {
      ...initialCreationState,
      blueprintId: 'service-package',
      entityName: 'Premium Lift Maintenance',
      slug: 'premium-lift-maintenance',
      summary:
        'On-demand lift inspections and maintenance visits with 24/7 dispatch cover and safety certification uploads handled.',
      pricingAmount: '1200',
      fulfilmentChannels: ['marketplace'],
      complianceChecklist: ['insurance', 'safeguarding']
    };

    const errors = validateCreationState(filled, sampleBlueprint);
    expect(errors).toEqual({});
  });
});

describe('serializeDraft', () => {
  it('normalises numeric values', () => {
    const draft = serializeDraft({
      ...initialCreationState,
      blueprintId: 'service-package',
      entityName: 'Ops Package',
      slug: 'ops-package',
      summary: 'All-inclusive operations package',
      persona: ['provider'],
      pricingAmount: '4500',
      setupFee: '250',
      availabilityLeadHours: 72,
      fulfilmentChannels: ['marketplace'],
      complianceChecklist: ['insurance'],
      automationHints: ['ai-copy'],
      marketingAssets: [{ id: 'hero', url: 'https://cdn.fixnado.com/hero.png' }],
      attachments: [{ id: 'playbook', name: 'Playbook.pdf' }],
      aiAssistEnabled: false
    });

    expect(draft.pricing.amount).toBe(4500);
    expect(draft.pricing.setupFee).toBe(250);
    expect(draft.aiAssistEnabled).toBe(false);
  });
});

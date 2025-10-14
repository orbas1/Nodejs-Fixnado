import { describe, expect, it } from 'vitest';
import { evaluateScamRisk } from '../src/services/scamDetectionService.js';

describe('scamDetectionService', () => {
  it('scores risky payloads with known scam patterns higher than 45', () => {
    const payload = {
      title: 'Urgent crypto wallet unlock needed',
      description: 'Transfer funds to our account via wire transfer to secure the job',
      message: 'Send money to +441234567890 or telegram me asap',
      budgetAmount: 50000,
      attachments: ['https://bit.ly/scam-link']
    };

    const { score, triggered } = evaluateScamRisk(payload);
    expect(score).toBeGreaterThanOrEqual(45);
    expect(triggered).toBe(true);
  });

  it('keeps legitimate payloads below the trigger threshold', () => {
    const payload = {
      title: 'Book scaffolding inspection',
      description: 'Site safety audit for warehouse in Manchester',
      message: 'Share quote for two day visit',
      budgetAmount: 800,
      attachments: []
    };

    const { score, triggered } = evaluateScamRisk(payload);
    expect(score).toBeLessThan(45);
    expect(triggered).toBe(false);
  });
});

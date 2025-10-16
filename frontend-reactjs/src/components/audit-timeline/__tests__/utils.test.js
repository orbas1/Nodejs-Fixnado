import { describe, expect, it } from 'vitest';
import { eventsToCsv } from '../utils.js';

describe('eventsToCsv', () => {
  it('serialises audit events into CSV rows', () => {
    const csv = eventsToCsv([
      {
        event: 'Manual review',
        category: 'compliance',
        status: 'scheduled',
        owner: 'Alex Analyst',
        ownerTeam: 'Compliance',
        occurredAt: '2025-01-01T10:00:00.000Z',
        dueAt: '2025-01-02T10:00:00.000Z',
        source: 'manual',
        summary: 'Review backlog triage',
        attachments: [{ label: 'Checklist', url: 'https://fixnado.example/checklist.pdf' }]
      },
      {
        event: 'Pipeline run',
        category: 'pipeline',
        status: 'completed',
        owner: 'Data Platform',
        ownerTeam: 'Engineering',
        occurredAt: '2025-01-01T11:00:00.000Z',
        dueAt: null,
        source: 'system',
        summary: 'Processed 120k events',
        attachments: []
      }
    ]);

    const rows = csv.split('\n');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain('Event,Category,Status');
    expect(rows[1]).toContain('Manual review');
    expect(rows[1]).toContain('Checklist: https://fixnado.example/checklist.pdf');
    expect(rows[2]).toContain('Pipeline run');
  });

  it('returns headers when no events are provided', () => {
    const csv = eventsToCsv();
    expect(csv).toBe('Event,Category,Status,Owner,Owner team,Occurred at,Due at,Source,Summary,Attachments');
  });
});

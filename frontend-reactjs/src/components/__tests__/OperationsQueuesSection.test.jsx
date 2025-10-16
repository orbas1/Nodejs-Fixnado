import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperationsQueuesSection } from '../operationsQueues/index.js';

vi.mock('../../api/operationsQueueClient.js', () => ({
  fetchOperationsQueues: vi.fn().mockResolvedValue({ boards: [], capabilities: {} }),
  createOperationsQueue: vi.fn(),
  updateOperationsQueue: vi.fn(),
  archiveOperationsQueue: vi.fn(),
  createOperationsQueueUpdate: vi.fn(),
  updateOperationsQueueUpdate: vi.fn(),
  deleteOperationsQueueUpdate: vi.fn()
}));

const mockBoards = [
  {
    id: 'board-1',
    title: 'Verification queue',
    summary: 'Pending provider verification checks.',
    owner: 'Compliance Ops',
    status: 'attention',
    priority: 1,
    metadata: {
      slaMinutes: 45,
      watchers: ['ops-duty@example.com'],
      intakeChannels: ['Ticket escalation'],
      tags: ['Compliance'],
      autoAlerts: true,
      escalationContact: 'ops-lead@example.com',
      playbookUrl: 'https://runbooks.example.com/provider-verification',
      notes: 'Rotate owners weekly.'
    },
    updates: [
      {
        id: 'update-1',
        headline: 'Documents awaiting proofing',
        body: '32 submissions require secondary review.',
        tone: 'warning',
        recordedAt: '2025-03-28T10:00:00.000Z',
        attachments: []
      }
    ]
  }
];

describe('OperationsQueuesSection', () => {
  it('renders queue summaries, opens detail view, and launches workspace', async () => {
    const user = userEvent.setup();
    render(
      <OperationsQueuesSection
        section={{ label: 'Operations queues', description: 'Test queues', data: { boards: mockBoards } }}
      />
    );

    expect(screen.getByText('Verification queue')).toBeInTheDocument();
    expect(screen.getByText(/Pending provider verification/i)).toBeInTheDocument();

    const detailButton = screen.getByRole('button', { name: /view queue detail/i });
    await user.click(detailButton);

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/queue detail — verification queue/i);
    });
    expect(screen.getAllByText('ops-duty@example.com').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /open playbook/i })).toBeInTheDocument();

    const manageButton = screen.getByRole('button', { name: /manage queue/i });
    await user.click(manageButton);

    await screen.findByRole('heading', { name: /operations workspace/i });

    const { fetchOperationsQueues } = await import('../../api/operationsQueueClient.js');
    await waitFor(() => {
      expect(fetchOperationsQueues).toHaveBeenCalled();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ManagedJobsPanel from '../ManagedJobsPanel.jsx';

describe('ManagedJobsPanel', () => {
  it('renders an empty state when no jobs are available', () => {
    render(
      <ManagedJobsPanel
        jobs={[]}
        invitations={[]}
        roster={[]}
        loading={false}
        invitingJobId={null}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText(/No provider-authored jobs yet/i)).toBeInTheDocument();
  });

  it('submits an invitation for the selected job', async () => {
    const user = userEvent.setup();
    const handleInvite = vi.fn().mockResolvedValue({ id: 'invite-1' });

    const jobs = [
      {
        id: 'job-1',
        title: 'Roof repair',
        status: 'open',
        description: 'Fix damaged tiles',
        createdAt: '2024-03-01T10:00:00Z',
        bidDeadline: '2024-03-10T10:00:00Z'
      }
    ];
    const roster = [{ id: 'contact-1', name: 'Crew Member', email: 'crew@example.com', role: 'Serviceman' }];

    render(
      <ManagedJobsPanel
        jobs={jobs}
        invitations={[]}
        roster={roster}
        loading={false}
        invitingJobId={null}
        onInvite={handleInvite}
      />
    );

    await user.click(screen.getByRole('button', { name: /Invite participant/i }));
    await user.selectOptions(screen.getByLabelText(/Invite type/i), 'serviceman');
    await user.selectOptions(screen.getByLabelText(/From roster/i), 'contact-1');
    await user.type(screen.getByLabelText(/Account handle/i), 'crew-handle');
    await user.click(screen.getByRole('button', { name: /Send invitation/i }));

    await waitFor(() => expect(handleInvite).toHaveBeenCalledTimes(1));
    expect(handleInvite).toHaveBeenCalledWith('job-1', {
      type: 'serviceman',
      contactId: 'contact-1',
      targetHandle: 'crew-handle',
      targetEmail: 'crew@example.com'
    });
    expect(screen.getByRole('button', { name: /Invite participant/i })).toBeInTheDocument();
  });

  it('shows a validation error when details are missing', async () => {
    const user = userEvent.setup();
    const handleInvite = vi.fn();

    const jobs = [
      {
        id: 'job-2',
        title: 'Electrical safety check',
        status: 'open',
        description: 'Quarterly inspection',
        createdAt: '2024-03-02T10:00:00Z',
        bidDeadline: '2024-03-09T10:00:00Z'
      }
    ];

    render(
      <ManagedJobsPanel
        jobs={jobs}
        invitations={[]}
        roster={[]}
        loading={false}
        invitingJobId={null}
        onInvite={handleInvite}
      />
    );

    await user.click(screen.getByRole('button', { name: /Invite participant/i }));
    await user.click(screen.getByRole('button', { name: /Send invitation/i }));

    expect(screen.getByText(/Provide an account handle/i)).toBeInTheDocument();
    expect(handleInvite).not.toHaveBeenCalled();
  });
});

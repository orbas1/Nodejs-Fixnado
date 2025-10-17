import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import InvitationManager from '../InvitationManager.jsx';

describe('InvitationManager', () => {
  it('renders an empty state when there are no invitations', () => {
    render(<InvitationManager invitations={[]} roster={[]} loading={false} updatingInvitationId={null} onUpdate={vi.fn()} />);
    expect(screen.getByText(/No invitations sent yet/i)).toBeInTheDocument();
  });

  it('updates an invitation with the provided changes', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn().mockResolvedValue({ id: 'invite-1' });

    const invitations = [
      {
        id: 'invite-1',
        status: 'pending',
        targetHandle: 'janedoe',
        createdAt: '2024-03-01T10:00:00Z',
        job: { id: 'job-1', title: 'Roof repair' },
        metadata: { note: 'Initial note' }
      }
    ];
    const roster = [{ id: 'contact-1', name: 'Crew Member' }];

    render(
      <InvitationManager
        invitations={invitations}
        roster={roster}
        loading={false}
        updatingInvitationId={null}
        onUpdate={handleUpdate}
      />
    );

    await user.selectOptions(screen.getByLabelText(/^Status$/i), 'accepted');
    await user.selectOptions(screen.getByLabelText(/Assign contact/i), 'contact-1');
    await user.clear(screen.getByLabelText(/Internal note/i));
    await user.type(screen.getByLabelText(/Internal note/i), 'Follow up next week');
    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => expect(handleUpdate).toHaveBeenCalledTimes(1));
    expect(handleUpdate).toHaveBeenCalledWith('invite-1', {
      status: 'accepted',
      contactId: 'contact-1',
      note: 'Follow up next week'
    });
  });

  it('shows an error when the update call rejects', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn().mockRejectedValue(new Error('Unable to update'));

    const invitations = [
      {
        id: 'invite-2',
        status: 'pending',
        targetHandle: 'crew',
        createdAt: '2024-03-01T11:00:00Z',
        job: { id: 'job-2', title: 'Maintenance' },
        metadata: {}
      }
    ];

    render(
      <InvitationManager
        invitations={invitations}
        roster={[]}
        loading={false}
        updatingInvitationId={null}
        onUpdate={handleUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => expect(screen.getByText(/Unable to update/)).toBeInTheDocument());
  });
});

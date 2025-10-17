import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CustomJobComposer from '../CustomJobComposer.jsx';

describe('CustomJobComposer', () => {
  it('submits a normalised payload and resets after success', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue({ id: 'job-1' });

    render(
      <CustomJobComposer
        zones={[{ value: 'zone-1', label: 'Zone 1' }]}
        roster={[{ id: 'contact-1', name: 'Crew Member', email: 'crew@example.com', role: 'Serviceman' }]}
        submitting={false}
        onSubmit={handleSubmit}
      />
    );

    await user.type(screen.getByLabelText(/Job title/i), 'Managed repair');
    await user.selectOptions(screen.getByLabelText(/Service zone/i), 'zone-1');
    await user.type(screen.getByLabelText(/Budget amount/i), '5000');
    await user.type(screen.getByLabelText(/Bid deadline/i), '2024-05-20');
    await user.type(screen.getByLabelText(/Invitation message/i), 'Please prioritise this callout');
    await user.type(screen.getByLabelText(/Brief details/i), 'Repair leaking pipe in main hall');
    await user.click(screen.getByLabelText(/Allow providers outside your zone to bid/i));
    await user.click(screen.getByLabelText(/Allow out-of-zone delivery/i));

    await user.click(screen.getByRole('button', { name: /Add invitation/i }));
    await user.selectOptions(screen.getByLabelText(/Invite type/i), 'serviceman');
    await user.selectOptions(screen.getByLabelText(/From roster/i), 'contact-1');
    await user.type(screen.getByLabelText(/Internal note/i), 'Use weekend team');

    await user.click(screen.getByRole('button', { name: /Publish custom job/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1));

    const payload = handleSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'Managed repair',
      zoneId: 'zone-1',
      allowOpenBidding: false,
      allowOutOfZone: true,
      inviteMessage: 'Please prioritise this callout',
      invites: [
        expect.objectContaining({
          type: 'serviceman',
          contactId: 'contact-1',
          targetEmail: 'crew@example.com',
          note: 'Use weekend team'
        })
      ]
    });
    expect(payload.budgetAmount).toBe(5000);
    expect(payload.bidDeadline).toBe('2024-05-20');

    await waitFor(() => expect(screen.getByLabelText(/Job title/i).value).toBe(''));
  });

  it('displays an error message when submission fails', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockRejectedValue(new Error('Request failed'));

    render(
      <CustomJobComposer
        zones={[]}
        roster={[]}
        submitting={false}
        onSubmit={handleSubmit}
      />
    );

    await user.type(screen.getByLabelText(/Job title/i), 'Quick job');
    await user.click(screen.getByRole('button', { name: /Publish custom job/i }));

    await waitFor(() => expect(screen.getByText(/Request failed/)).toBeInTheDocument());
  });
});

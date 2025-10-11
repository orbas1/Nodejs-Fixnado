import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageComposer from '../MessageComposer.jsx';

describe('MessageComposer', () => {
  it('prevents empty submissions and surfaces validation message', async () => {
    const handleSend = vi.fn();
    render(<MessageComposer onSend={handleSend} />);

    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(handleSend).not.toHaveBeenCalled();
    expect(screen.getByText(/message cannot be empty/i)).toBeInTheDocument();
  });

  it('submits message payload with ai assist flag', async () => {
    const handleSend = vi.fn();
    render(<MessageComposer onSend={handleSend} aiAssistAvailable defaultAiAssist />);

    await userEvent.type(screen.getByRole('textbox'), 'Let\'s book the inspection for tomorrow');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(handleSend).toHaveBeenCalledWith({
      body: "Let's book the inspection for tomorrow",
      requestAiAssist: true
    });
  });

  it('allows disabling ai assist before sending', async () => {
    const handleSend = vi.fn();
    render(<MessageComposer onSend={handleSend} aiAssistAvailable defaultAiAssist />);

    await userEvent.type(screen.getByRole('textbox'), 'Manual response only');
    await userEvent.click(screen.getByRole('checkbox', { name: /request ai assist/i }));
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(handleSend).toHaveBeenCalledWith({
      body: 'Manual response only',
      requestAiAssist: false
    });
  });
});

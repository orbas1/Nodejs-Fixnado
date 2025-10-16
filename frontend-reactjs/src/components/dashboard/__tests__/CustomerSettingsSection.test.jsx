import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerSettingsSection from '../CustomerSettingsSection.jsx';
import { useCustomerProfileSettings } from '../../../hooks/useCustomerProfileSettings.js';

vi.mock('../../../hooks/useCustomerProfileSettings.js');

const baseData = {
  profile: {
    firstName: 'Jordan',
    lastName: 'Miles',
    preferredName: 'Jo',
    jobTitle: 'Facilities Lead',
    email: 'jordan@example.com',
    phoneNumber: '+44 7700 900123',
    timezone: 'Europe/London',
    language: 'en-GB',
    avatarUrl: 'https://cdn.fixnado.com/jordan.png'
  },
  notifications: {
    dispatch: { email: true, sms: false },
    support: { email: true, sms: false },
    weeklySummary: { email: true },
    concierge: { email: true },
    quietHours: { enabled: false, start: '20:00', end: '07:00', timezone: 'Europe/London' },
    escalationContacts: []
  },
  billing: {
    preferredCurrency: 'GBP',
    defaultPaymentMethod: 'Visa •••• 4242',
    paymentNotes: 'Raise PO before release',
    invoiceRecipients: []
  },
  security: {
    twoFactor: {
      app: false,
      email: true,
      enabled: true,
      methods: ['email-backup'],
      lastUpdated: '2025-02-01T10:00:00Z'
    }
  }
};

const createHookState = () => ({
  data: structuredClone(baseData),
  loading: false,
  error: null,
  saving: { profile: false, notifications: false, billing: false, security: false },
  refresh: vi.fn().mockResolvedValue(),
  saveProfile: vi.fn().mockResolvedValue(structuredClone(baseData)),
  saveNotifications: vi.fn().mockResolvedValue(structuredClone(baseData)),
  saveBilling: vi.fn().mockResolvedValue(structuredClone(baseData)),
  saveSecurity: vi.fn().mockResolvedValue(structuredClone(baseData))
});

const stubHook = (overrides = {}) => {
  const state = createHookState();
  Object.assign(state, overrides);
  useCustomerProfileSettings.mockImplementation(() => state);
  return state;
};

describe('CustomerSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCustomerProfileSettings.mockImplementation(() => createHookState());
  });

  it('renders hydrated profile values and saves updates', async () => {
    const user = userEvent.setup();
    const saveProfile = vi.fn().mockResolvedValue(structuredClone(baseData));
    const hookState = stubHook({ saveProfile });

    render(<CustomerSettingsSection section={{ title: 'Profile settings' }} />);

    const firstNameInput = screen.getByLabelText('First name');
    expect(firstNameInput).toHaveValue('Jordan');

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Avery');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(hookState.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Avery', lastName: 'Miles' })
      );
    });
  });

  it('allows managing escalation contacts and quiet hours', async () => {
    const user = userEvent.setup();
    const saveNotifications = vi.fn().mockResolvedValue(structuredClone(baseData));
    const hookState = stubHook({
      saveNotifications,
      data: {
        ...structuredClone(baseData),
        notifications: {
          ...structuredClone(baseData.notifications),
          quietHours: { enabled: true, start: '21:00', end: '06:00', timezone: 'UTC' },
          escalationContacts: []
        }
      }
    });

    render(<CustomerSettingsSection section={{ title: 'Profile settings' }} />);

    await user.click(screen.getByRole('button', { name: /add contact/i }));

    const contactsList = screen.getByText('Remove').closest('li');
    const nameInput = within(contactsList).getByPlaceholderText('Name');
    const emailInput = within(contactsList).getByPlaceholderText('email@example.com');

    await user.type(nameInput, 'Dispatch Team');
    await user.type(emailInput, 'dispatch@example.com');

    const quietHoursStart = await screen.findByLabelText('Start');
    await user.clear(quietHoursStart);
    await user.type(quietHoursStart, '22:00');

    await user.click(screen.getByRole('button', { name: /save notifications/i }));

    await waitFor(() => {
      expect(hookState.saveNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          quietHours: expect.objectContaining({ enabled: true, start: '22:00' }),
          escalationContacts: expect.arrayContaining([
            expect.objectContaining({ name: 'Dispatch Team', email: 'dispatch@example.com' })
          ])
        })
      );
    });
  });

  it('adds invoice recipients and saves billing preferences', async () => {
    const user = userEvent.setup();
    const saveBilling = vi.fn().mockResolvedValue(structuredClone(baseData));
    const hookState = stubHook({ saveBilling });

    render(<CustomerSettingsSection section={{ title: 'Profile settings' }} />);

    await user.click(screen.getByRole('button', { name: /add recipient/i }));

    const row = screen.getByText('Remove').closest('li');
    const name = within(row).getByPlaceholderText('Name');
    const email = within(row).getByPlaceholderText('email@example.com');

    await user.type(name, 'Finance Team');
    await user.type(email, 'finance@example.com');

    await user.click(screen.getByRole('button', { name: /save billing/i }));

    await waitFor(() => {
      expect(hookState.saveBilling).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceRecipients: expect.arrayContaining([
            expect.objectContaining({ name: 'Finance Team', email: 'finance@example.com' })
          ])
        })
      );
    });
  });
});

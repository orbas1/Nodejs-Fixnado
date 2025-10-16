import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import OrderHistoryManager from '../OrderHistoryManager.jsx';
import {
  ORDER_HISTORY_ENTRY_TYPES,
  ORDER_HISTORY_ACTOR_ROLES,
  ORDER_HISTORY_STATUSES
} from '../../../constants/orderHistory.js';

const fetchOrdersMock = vi.fn();
const fetchOrderHistoryMock = vi.fn();
const createOrderHistoryEntryMock = vi.fn();
const updateOrderHistoryEntryMock = vi.fn();
const deleteOrderHistoryEntryMock = vi.fn();

vi.mock('../../../api/orderHistoryClient.js', () => ({
  fetchOrders: (...args) => fetchOrdersMock(...args),
  fetchOrderHistory: (...args) => fetchOrderHistoryMock(...args),
  createOrderHistoryEntry: (...args) => createOrderHistoryEntryMock(...args),
  updateOrderHistoryEntry: (...args) => updateOrderHistoryEntryMock(...args),
  deleteOrderHistoryEntry: (...args) => deleteOrderHistoryEntryMock(...args)
}));

const section = {
  label: 'Order History',
  description: 'Audit trail for every job.',
  access: { level: 'manage' },
  data: {
    orders: [
      {
        id: 'ORD-1',
        reference: 'ORD-1',
        serviceTitle: 'Lighting upgrade',
        serviceCategory: 'Electrical',
        status: 'in_progress',
        totalAmount: 1900,
        currency: 'GBP',
        scheduledFor: '2025-03-18T09:00:00Z',
        createdAt: '2025-03-10T08:00:00Z',
        updatedAt: '2025-03-16T14:00:00Z',
        lastStatusTransitionAt: '2025-03-16T14:00:00Z',
        meta: { serviceOwner: 'Avery Stone' }
      }
    ],
    entries: [
      {
        id: 'HIST-1',
        title: 'Crew dispatched',
        entryType: 'milestone',
        status: 'in_progress',
        summary: 'Crew left depot for site.',
        actorRole: 'operations',
        occurredAt: '2025-03-16T07:00:00Z',
        createdAt: '2025-03-16T07:00:00Z',
        updatedAt: '2025-03-16T07:00:00Z',
        attachments: [],
        meta: { shift: 'AM' }
      }
    ],
    entryTypes: ORDER_HISTORY_ENTRY_TYPES,
    actorRoles: ORDER_HISTORY_ACTOR_ROLES,
    statusOptions: [{ value: 'all', label: 'All statuses' }, ...ORDER_HISTORY_STATUSES],
    defaultFilters: { status: 'all', sort: 'desc', limit: 25 },
    attachments: { acceptedTypes: ['image', 'link'], maxPerEntry: 6 },
    context: { customerId: 'USR-1', companyId: 'COMP-1' }
  }
};

const renderManager = (override = {}) =>
  render(
    <MemoryRouter>
      <OrderHistoryManager section={{ ...section, ...override }} />
    </MemoryRouter>
  );

describe('OrderHistoryManager', () => {
  beforeEach(() => {
    fetchOrderHistoryMock.mockResolvedValue({ total: 1, entries: section.data.entries });
    createOrderHistoryEntryMock.mockResolvedValue({ id: 'HIST-NEW' });
    updateOrderHistoryEntryMock.mockResolvedValue({ id: 'HIST-1' });
    deleteOrderHistoryEntryMock.mockResolvedValue({ id: 'HIST-1' });
    fetchOrdersMock.mockResolvedValue(section.data.orders);
    if (!global.crypto) {
      global.crypto = { randomUUID: vi.fn(() => 'uuid-test') };
    } else if (!global.crypto.randomUUID) {
      global.crypto.randomUUID = vi.fn(() => 'uuid-test');
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders orders and fetches history for the first order', async () => {
    renderManager();

    await waitFor(() => expect(fetchOrdersMock).toHaveBeenCalled());
    expect(fetchOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'COMP-1', customerId: 'USR-1', limit: 25 })
    );

    await waitFor(() => expect(fetchOrderHistoryMock).toHaveBeenCalled());

    expect(screen.getByText('Lighting upgrade')).toBeInTheDocument();
    expect(fetchOrderHistoryMock).toHaveBeenCalledWith(
      'ORD-1',
      expect.objectContaining({ sort: 'desc', limit: 25 })
    );
    expect(fetchOrderHistoryMock.mock.calls[0][1].status).toBeUndefined();
  });

  it('creates a new history entry from the form', async () => {
    const user = userEvent.setup();
    fetchOrderHistoryMock.mockResolvedValueOnce({ total: 0, entries: [] });

    renderManager();

    await waitFor(() => expect(fetchOrderHistoryMock).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /new timeline entry/i }));

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Site secured');

    const occurredAtInput = screen.getByLabelText(/occurred at/i);
    await user.clear(occurredAtInput);
    await user.type(occurredAtInput, '2025-03-18T09:00');

    const summaryInput = screen.getByLabelText(/summary/i);
    await user.type(summaryInput, 'Work area ready');

    await user.click(screen.getByRole('button', { name: /add entry/i }));

    await waitFor(() => expect(createOrderHistoryEntryMock).toHaveBeenCalled());

    expect(createOrderHistoryEntryMock).toHaveBeenCalledWith(
      'ORD-1',
      expect.objectContaining({ title: 'Site secured', summary: 'Work area ready', actorRole: 'customer' })
    );

    await waitFor(() => expect(fetchOrderHistoryMock).toHaveBeenCalledTimes(2));
  });
});

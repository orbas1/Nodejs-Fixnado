import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CompliancePortal from '../CompliancePortal.jsx';

const mockRequests = [
  {
    id: 'req-1',
    subjectEmail: 'alpha@example.com',
    requestType: 'access',
    status: 'received',
    requestedAt: '2025-03-01T09:00:00.000Z',
    dueAt: '2025-03-31T09:00:00.000Z',
    auditLog: []
  }
];

const mockMetrics = {
  totalRequests: 14,
  statusBreakdown: {
    completed: 9,
    received: 3,
    in_progress: 2,
    rejected: 0
  },
  overdueCount: 2,
  dueSoonCount: 3,
  dueSoonWindowDays: 7,
  averageCompletionMinutes: 480,
  medianCompletionMinutes: 360,
  percentile95CompletionMinutes: 960,
  completionRate: 0.64,
  slaTargetDays: 30,
  windowDays: 180
};

const mockWarehouseRuns = [
  {
    id: 'run-1',
    dataset: 'orders',
    status: 'succeeded',
    runStartedAt: '2025-02-10T10:00:00.000Z'
  }
];

const fetchDataSubjectRequests = vi.fn();
const fetchDataSubjectRequestMetrics = vi.fn();
const fetchWarehouseExportRuns = vi.fn();
const createDataSubjectRequest = vi.fn();
const triggerDataSubjectExport = vi.fn();
const updateDataSubjectRequestStatus = vi.fn();
const triggerWarehouseExportRun = vi.fn();

vi.mock('../../api/complianceClient.js', () => ({
  createDataSubjectRequest: (...args) => createDataSubjectRequest(...args),
  fetchDataSubjectRequests: (...args) => fetchDataSubjectRequests(...args),
  triggerDataSubjectExport: (...args) => triggerDataSubjectExport(...args),
  updateDataSubjectRequestStatus: (...args) => updateDataSubjectRequestStatus(...args),
  fetchWarehouseExportRuns: (...args) => fetchWarehouseExportRuns(...args),
  triggerWarehouseExportRun: (...args) => triggerWarehouseExportRun(...args),
  fetchDataSubjectRequestMetrics: (...args) => fetchDataSubjectRequestMetrics(...args)
}));

describe('CompliancePortal', () => {
  beforeEach(() => {
    fetchDataSubjectRequests.mockResolvedValue(mockRequests);
    fetchDataSubjectRequestMetrics.mockResolvedValue(mockMetrics);
    fetchWarehouseExportRuns.mockResolvedValue(mockWarehouseRuns);
    createDataSubjectRequest.mockResolvedValue(mockRequests[0]);
    triggerDataSubjectExport.mockResolvedValue({ filePath: '/tmp/export.zip', request: mockRequests[0] });
    updateDataSubjectRequestStatus.mockResolvedValue({ ...mockRequests[0], status: 'completed' });
    triggerWarehouseExportRun.mockResolvedValue(mockWarehouseRuns[0]);

    fetchDataSubjectRequests.mockClear();
    fetchDataSubjectRequestMetrics.mockClear();
    fetchWarehouseExportRuns.mockClear();
  });

  it('renders SLA metrics dashboard and refresh button reloads metrics', async () => {
    render(<CompliancePortal />);

    await waitFor(() => expect(fetchDataSubjectRequestMetrics).toHaveBeenCalled());
    expect(fetchDataSubjectRequestMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        status: undefined,
        requestType: undefined,
        regionCode: undefined,
        submittedAfter: undefined,
        submittedBefore: undefined,
        subjectEmail: undefined
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    expect(await screen.findByText(/Total requests/i)).toBeInTheDocument();
    const totalCard = screen.getByText(/Total requests/i).closest('div');
    expect(totalCard).toHaveTextContent('14');
    expect(screen.getByText(/Due within 3 \/ Next 7 days/i)).toBeInTheDocument();

    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    await userEvent.click(refreshButton);

    await waitFor(() => expect(fetchDataSubjectRequestMetrics).toHaveBeenCalledTimes(2));
    expect(fetchDataSubjectRequests).toHaveBeenCalledTimes(2);
  });

  it('applies filters and passes them to metrics API', async () => {
    render(<CompliancePortal />);
    await screen.findByText(/Total requests/i);

    await userEvent.selectOptions(screen.getByLabelText(/Filter by status/i), 'completed');
    await waitFor(() => expect(fetchDataSubjectRequestMetrics).toHaveBeenCalledTimes(2));
    expect(fetchDataSubjectRequestMetrics.mock.calls.at(-1)?.[0]).toMatchObject({ status: 'completed' });

    const [submissionEmailInput, filterEmailInput] = screen.getAllByLabelText(/Subject email/i);
    expect(submissionEmailInput).toBeInTheDocument();
    await userEvent.type(filterEmailInput, 'ops@example.com');
    await userEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    await waitFor(() => expect(fetchDataSubjectRequestMetrics).toHaveBeenCalledTimes(3));
    expect(fetchDataSubjectRequestMetrics.mock.calls.at(-1)?.[0]).toMatchObject({
      status: 'completed',
      subjectEmail: 'ops@example.com'
    });
  });
});

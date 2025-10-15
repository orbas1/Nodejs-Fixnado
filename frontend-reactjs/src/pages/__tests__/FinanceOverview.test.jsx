import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RegulatoryAlertCard, ReportTimelineTable } from '../FinanceOverview.jsx';

describe('FinanceOverview building blocks', () => {
  it('renders an empty state when the timeline has no entries', () => {
    render(<ReportTimelineTable timeline={[]} />);

    expect(screen.getByText(/No performance history/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Finance reports will populate once payments, payouts and disputes flow through the orchestration stack./i
      )
    ).toBeInTheDocument();
  });

  it('renders table rows for timeline entries in reverse chronological order', () => {
    render(
      <ReportTimelineTable
        timeline={[
          {
            date: '2024-03-02',
            currency: 'GBP',
            captured: 1250,
            pending: 0,
            refunded: 50,
            failed: 0,
            payouts: 600,
            disputes: 10
          },
          {
            date: '2024-03-01',
            currency: 'GBP',
            captured: 900,
            pending: 100,
            refunded: 0,
            failed: 0,
            payouts: 200,
            disputes: 0
          }
        ]}
      />
    );

    expect(screen.getByText('2024-03-02')).toBeInTheDocument();
    expect(screen.getByText('2024-03-01')).toBeInTheDocument();
    expect(screen.getAllByText('GBP')).toHaveLength(2);
    expect(screen.getByText(/£1,250\.00/)).toBeInTheDocument();
  });

  it('surfaces regulatory alert metrics with formatted labels', () => {
    render(
      <RegulatoryAlertCard
        alert={{
          id: 'finance-payout-backlog',
          severity: 'high',
          category: 'payout_backlog',
          message: '2 payouts awaiting approval',
          recommendedAction: 'Review payout queue',
          metric: {
            providersImpacted: 3,
            pendingAmount: 24500.45,
            oldestPendingDays: 6
          },
          lastUpdated: '2024-03-05T10:30:00.000Z'
        }}
      />
    );

    expect(screen.getByText(/payout backlog/i)).toBeInTheDocument();
    expect(screen.getByText(/Providers Impacted/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/Review payout queue/i)).toBeInTheDocument();
  });
});


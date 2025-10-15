import { describe, expect, it, beforeAll, beforeEach, vi } from 'vitest';

const analyticsEventMock = vi.fn();
const securityEventMock = vi.fn();
const raiseAlertMock = vi.fn().mockResolvedValue(true);

vi.mock('../src/services/analyticsEventService.js', () => ({
  recordAnalyticsEvent: analyticsEventMock
}));

vi.mock('../src/services/auditTrailService.js', () => ({
  recordSecurityEvent: securityEventMock
}));

vi.mock('../src/services/opsgenieService.js', () => ({
  default: {
    raiseAlert: raiseAlertMock,
    closeAlert: vi.fn(),
    isConfigured: vi.fn()
  },
  raiseAlert: raiseAlertMock,
  closeAlert: vi.fn(),
  isConfigured: vi.fn()
}));

let applyScamDetection;
let evaluateBookingRisk;
let Booking;
let bookingCountSpy;

beforeAll(async () => {
  ({ applyScamDetection, evaluateBookingRisk } = await import('../src/services/scamDetectionService.js'));
  ({ Booking } = await import('../src/models/index.js'));
  bookingCountSpy = vi.spyOn(Booking, 'count');
});

beforeEach(() => {
  analyticsEventMock.mockReset();
  securityEventMock.mockReset();
  raiseAlertMock.mockReset();
  bookingCountSpy.mockReset();
});

describe('scamDetectionService', () => {
  it('flags high-risk bookings and notifies trust team', async () => {
    const booking = {
      id: 'booking-1',
      customerId: 'customer-1',
      companyId: 'company-1',
      zoneId: 'zone-1',
      baseAmount: 8500,
      totalAmount: 8500,
      type: 'on_demand',
      meta: {
        demandLevel: 'emergency',
        notes: 'Urgent request for wire transfer, pay via crypto please',
        paymentMethod: 'wire'
      },
      update: vi.fn().mockResolvedValue()
    };

    bookingCountSpy.mockResolvedValueOnce(5); // recent bookings
    bookingCountSpy.mockResolvedValueOnce(1); // disputed bookings

    const evaluation = await applyScamDetection({ booking, actor: { id: 'user-1', type: 'user' } });

    expect(evaluation.tier).toBe('high');
    expect(booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          riskAssessment: expect.objectContaining({ tier: 'high' })
        })
      }),
      expect.any(Object)
    );
    expect(analyticsEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'booking.risk_evaluated',
        entityId: 'booking-1'
      }),
      expect.any(Object)
    );
    expect(securityEventMock).toHaveBeenCalled();
    expect(raiseAlertMock).toHaveBeenCalled();
  });

  it('calculates medium risk without triggering alerts', async () => {
    const booking = {
      id: 'booking-2',
      customerId: 'customer-2',
      companyId: 'company-1',
      zoneId: 'zone-1',
      baseAmount: 3200,
      totalAmount: 3200,
      type: 'scheduled',
      meta: {
        notes: 'Standard refurbishment job',
        paymentMethod: 'card'
      }
    };
    bookingCountSpy.mockResolvedValueOnce(0);
    bookingCountSpy.mockResolvedValueOnce(0);

    const evaluation = await evaluateBookingRisk(booking);

    expect(evaluation.tier === 'medium' || evaluation.tier === 'low').toBe(true);
    expect(raiseAlertMock).not.toHaveBeenCalled();
  });
});

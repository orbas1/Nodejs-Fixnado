import { describe, expect, it, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('../src/services/auditTrailService.js', () => ({
  recordSecurityEvent: vi.fn().mockResolvedValue(undefined)
}));

const mockFindAll = vi.fn();
const mockCreate = vi.fn();

vi.mock('../src/models/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ConsentEvent: {
      create: (...args) => mockCreate(...args),
      findAll: (...args) => mockFindAll(...args)
    }
  };
});

let recordConsentEvent;
let getConsentSnapshot;
let ensureActiveConsents;
let resolveConsentSubject;

beforeAll(async () => {
  ({
    recordConsentEvent,
    getConsentSnapshot,
    ensureActiveConsents,
    resolveConsentSubject
  } = await import('../src/services/consentService.js'));
});

beforeEach(() => {
  mockFindAll.mockReset();
  mockCreate.mockReset();
  vi.clearAllMocks();
});

describe('consentService', () => {
  it('records consent decisions with normalised defaults', async () => {
    const fakeEvent = {
      id: 'event-1',
      policyKey: 'terms_of_service',
      policyVersion: '2024-06-01',
      decision: 'granted',
      decisionAt: new Date('2025-03-16T10:00:00Z'),
      region: 'GB',
      channel: 'web',
      metadata: null
    };
    mockCreate.mockResolvedValue(fakeEvent);

    const result = await recordConsentEvent({
      userId: 'user-1',
      policyKey: 'terms_of_service',
      decision: 'grant',
      ipAddress: '1.1.1.1',
      userAgent: 'vitest'
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        subjectId: expect.stringContaining('user:user-1'),
        policyKey: 'terms_of_service',
        policyVersion: '2024-06-01',
        region: 'GB',
        channel: 'web'
      })
    );
    expect(result.decision).toBe('granted');
  });

  it('returns consent snapshot with stale marker when decision is older than refresh window', async () => {
    mockFindAll.mockResolvedValue([
      {
        policyKey: 'terms_of_service',
        policyVersion: '2024-06-01',
        decision: 'granted',
        decisionAt: new Date('2023-01-01T00:00:00Z'),
        region: 'GB',
        channel: 'web',
        metadata: null
      }
    ]);

    const snapshot = await getConsentSnapshot({ userId: 'user-1' });
    const termsEntry = snapshot.find((entry) => entry.policy === 'terms_of_service');

    expect(termsEntry).toBeDefined();
    expect(termsEntry?.granted).toBe(true);
    expect(termsEntry?.stale).toBe(true);
  });

  it('throws when required consent is missing', async () => {
    mockFindAll.mockResolvedValue([
      {
        policyKey: 'terms_of_service',
        policyVersion: '2024-06-01',
        decision: 'withdrawn',
        decisionAt: new Date('2025-03-10T00:00:00Z'),
        region: 'GB',
        channel: 'web',
        metadata: null
      }
    ]);

    await expect(ensureActiveConsents({ userId: 'user-1' })).rejects.toMatchObject({ statusCode: 428 });
  });

  it('resolves anonymous subjects when none provided', () => {
    const subject = resolveConsentSubject({ userId: null, subjectId: null, generateIfMissing: true });
    expect(subject).toMatch(/^anon:/);
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockServicemanTaxProfile = { findOrCreate: vi.fn() };
const mockServicemanTaxFiling = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  findAndCountAll: vi.fn()
};
const mockServicemanTaxTask = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  findAndCountAll: vi.fn()
};
const mockServicemanTaxDocument = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  findAndCountAll: vi.fn()
};
const mockUserModel = { findByPk: vi.fn() };

vi.mock(
  '../models/index.js',
  () => ({
    __esModule: true,
    ServicemanTaxProfile: mockServicemanTaxProfile,
    ServicemanTaxFiling: mockServicemanTaxFiling,
    ServicemanTaxTask: mockServicemanTaxTask,
    ServicemanTaxDocument: mockServicemanTaxDocument,
    User: mockUserModel
  }),
  { virtual: true }
);

vi.mock('../utils/currency.js', () => ({
  __esModule: true,
  normaliseCurrency: (value) => value
}));

const service = await import('../servicemanTaxService.js');
const {
  getServicemanTaxWorkspace,
  updateServicemanTaxProfile,
  updateServicemanTaxFilingStatus
} = service;

const createProfileInstance = (overrides = {}) => {
  const instance = {
    id: 'profile-1',
    servicemanId: 'svc-1',
    filingStatus: 'sole_trader',
    residencyCountry: null,
    residencyRegion: null,
    vatRegistered: false,
    vatNumber: null,
    utrNumber: null,
    companyNumber: null,
    taxAdvisorName: null,
    taxAdvisorEmail: null,
    taxAdvisorPhone: null,
    remittanceCycle: 'monthly',
    withholdingRate: null,
    lastFilingSubmittedAt: null,
    nextDeadlineAt: null,
    notes: null,
    metadata: {},
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    save: vi.fn().mockResolvedValue(undefined),
    toJSON() {
      return {
        id: this.id,
        servicemanId: this.servicemanId,
        filingStatus: this.filingStatus,
        residencyCountry: this.residencyCountry,
        residencyRegion: this.residencyRegion,
        vatRegistered: this.vatRegistered,
        vatNumber: this.vatNumber,
        utrNumber: this.utrNumber,
        companyNumber: this.companyNumber,
        taxAdvisorName: this.taxAdvisorName,
        taxAdvisorEmail: this.taxAdvisorEmail,
        taxAdvisorPhone: this.taxAdvisorPhone,
        remittanceCycle: this.remittanceCycle,
        withholdingRate: this.withholdingRate,
        lastFilingSubmittedAt: this.lastFilingSubmittedAt,
        nextDeadlineAt: this.nextDeadlineAt,
        notes: this.notes,
        metadata: this.metadata,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    },
    ...overrides
  };

  return instance;
};

const asModel = (payload) => ({
  toJSON: () => ({ ...payload })
});

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-03-01T12:00:00Z'));
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getServicemanTaxWorkspace', () => {
  it('loads workspace state, summary, and metadata for a serviceman', async () => {
    const profileInstance = createProfileInstance({ filingStatus: 'limited_company', remittanceCycle: 'quarterly' });
    mockServicemanTaxProfile.findOrCreate.mockResolvedValue([profileInstance, false]);

    const filings = [
      asModel({
        id: 'filing-upcoming',
        servicemanId: 'svc-1',
        taxYear: '2024/25',
        period: 'Q1',
        filingType: 'vat_return',
        submissionMethod: 'online',
        status: 'pending',
        dueAt: '2025-03-15T12:00:00Z',
        submittedAt: null,
        amountDue: 3100.5,
        amountPaid: 0,
        currency: 'GBP',
        reference: 'VAT-2025-Q1',
        documents: [],
        metadata: {},
        createdAt: new Date('2025-02-01T10:00:00Z'),
        updatedAt: new Date('2025-02-05T10:00:00Z'),
        createdBy: null,
        updatedBy: null
      }),
      asModel({
        id: 'filing-overdue',
        servicemanId: 'svc-1',
        taxYear: '2024/25',
        period: 'Q4',
        filingType: 'vat_return',
        submissionMethod: 'online',
        status: 'draft',
        dueAt: '2025-02-01T12:00:00Z',
        submittedAt: null,
        amountDue: 890.75,
        amountPaid: 200,
        currency: 'GBP',
        reference: 'VAT-2024-Q4',
        documents: [],
        metadata: {},
        createdAt: new Date('2025-01-10T10:00:00Z'),
        updatedAt: new Date('2025-01-15T10:00:00Z'),
        createdBy: null,
        updatedBy: null
      })
    ];

    mockServicemanTaxFiling.findAll
      .mockResolvedValueOnce(filings)
      .mockResolvedValueOnce(filings);

    const tasks = [
      asModel({
        id: 'task-open',
        servicemanId: 'svc-1',
        title: 'Prepare CIS statement',
        status: 'blocked',
        priority: 'high',
        dueAt: '2025-02-20T12:00:00Z',
        completedAt: null,
        assignedTo: 'finance-analyst',
        filingId: 'filing-overdue',
        checklist: [],
        instructions: 'Collect subcontractor docs',
        metadata: {},
        createdAt: new Date('2025-01-20T10:00:00Z'),
        updatedAt: new Date('2025-02-10T10:00:00Z')
      }),
      asModel({
        id: 'task-done',
        servicemanId: 'svc-1',
        title: 'Submit self assessment',
        status: 'completed',
        priority: 'normal',
        dueAt: '2025-01-31T12:00:00Z',
        completedAt: '2025-01-29T12:00:00Z',
        assignedTo: 'finance-analyst',
        filingId: 'filing-overdue',
        checklist: [],
        instructions: null,
        metadata: {},
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-29T10:00:00Z')
      })
    ];

    mockServicemanTaxTask.findAll
      .mockResolvedValueOnce(tasks)
      .mockResolvedValueOnce(tasks);

    const documents = [
      asModel({
        id: 'doc-receipt',
        servicemanId: 'svc-1',
        filingId: 'filing-overdue',
        title: 'VAT receipt February',
        documentType: 'receipt',
        status: 'active',
        fileUrl: 'https://cdn.fixnado.test/vat-receipt.pdf',
        thumbnailUrl: null,
        uploadedAt: new Date('2025-02-02T12:00:00Z'),
        uploadedBy: 'actor-1',
        notes: null,
        metadata: {},
        createdAt: new Date('2025-02-02T12:00:00Z'),
        updatedAt: new Date('2025-02-02T12:00:00Z')
      }),
      asModel({
        id: 'doc-evidence',
        servicemanId: 'svc-1',
        filingId: null,
        title: 'Insurance certificate',
        documentType: 'certificate',
        status: 'active',
        fileUrl: 'https://cdn.fixnado.test/certificate.pdf',
        thumbnailUrl: null,
        uploadedAt: new Date('2025-01-10T12:00:00Z'),
        uploadedBy: 'actor-1',
        notes: null,
        metadata: {},
        createdAt: new Date('2025-01-10T12:00:00Z'),
        updatedAt: new Date('2025-01-10T12:00:00Z')
      })
    ];

    mockServicemanTaxDocument.findAll
      .mockResolvedValueOnce(documents)
      .mockResolvedValueOnce(documents);

    mockUserModel.findByPk.mockResolvedValue({
      id: 'svc-1',
      firstName: 'Jordan',
      lastName: 'Matthews',
      email: 'jordan@example.com'
    });

    const workspace = await getServicemanTaxWorkspace({ servicemanId: 'svc-1', limit: 5 });

    expect(mockServicemanTaxProfile.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { servicemanId: 'svc-1' } })
    );
    expect(workspace.context.serviceman).toMatchObject({
      id: 'svc-1',
      name: 'Jordan Matthews',
      email: 'jordan@example.com'
    });
    expect(workspace.profile.filingStatus).toBe('limited_company');
    expect(workspace.summary.filings).toMatchObject({ total: 2, overdue: 1 });
    expect(workspace.summary.filings.amountDueTotal).toBeCloseTo(3991.25);
    expect(workspace.summary.tasks).toMatchObject({ total: 2, open: 1 });
    expect(workspace.summary.documents.byType).toMatchObject({ receipt: 1, certificate: 1 });
    expect(workspace.metadata.filingStatuses).toContain('draft');
    expect(workspace.filings.items).toHaveLength(2);
    expect(workspace.tasks.items).toHaveLength(2);
    expect(workspace.documents.items).toHaveLength(2);
  });
});

describe('updateServicemanTaxProfile', () => {
  it('normalises and persists profile updates', async () => {
    const profileInstance = createProfileInstance();
    mockServicemanTaxProfile.findOrCreate.mockResolvedValue([profileInstance, false]);

    const result = await updateServicemanTaxProfile({
      servicemanId: 'svc-1',
      actorId: 'actor-42',
      payload: {
        filingStatus: 'limited_company',
        residencyCountry: 'gb',
        vatRegistered: 'true',
        vatNumber: 'gb123456789',
        remittanceCycle: 'quarterly',
        withholdingRate: '15.5',
        nextDeadlineAt: '2025-04-01T12:00:00Z'
      }
    });

    expect(profileInstance.residencyCountry).toBe('GB');
    expect(profileInstance.vatRegistered).toBe(true);
    expect(profileInstance.remittanceCycle).toBe('quarterly');
    expect(profileInstance.filingStatus).toBe('limited_company');
    expect(profileInstance.withholdingRate).toBe(15.5);
    expect(profileInstance.metadata.lastUpdatedBy).toBe('actor-42');
    expect(profileInstance.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      residencyCountry: 'GB',
      filingStatus: 'limited_company',
      remittanceCycle: 'quarterly'
    });
  });
});

describe('updateServicemanTaxFilingStatus', () => {
  it('updates status, submission time, and amount paid with validation', async () => {
    const filing = {
      id: 'filing-1',
      servicemanId: 'svc-1',
      status: 'draft',
      submittedAt: null,
      amountPaid: 0,
      updatedBy: null,
      toJSON() {
        return {
          id: this.id,
          servicemanId: this.servicemanId,
          status: this.status,
          submittedAt: this.submittedAt,
          amountPaid: this.amountPaid,
          updatedBy: this.updatedBy,
          createdAt: new Date('2025-01-01T00:00:00Z'),
          updatedAt: new Date('2025-01-02T00:00:00Z')
        };
      },
      save: vi.fn().mockResolvedValue(undefined)
    };

    mockServicemanTaxFiling.findOne.mockResolvedValue(filing);

    const result = await updateServicemanTaxFilingStatus({
      servicemanId: 'svc-1',
      filingId: 'filing-1',
      status: 'submitted',
      submittedAt: '2025-02-05T12:00:00Z',
      amountPaid: '3100.5',
      actorId: 'actor-42'
    });

    expect(filing.status).toBe('submitted');
    expect(filing.submittedAt).toEqual(new Date('2025-02-05T12:00:00Z'));
    expect(filing.amountPaid).toBe(3100.5);
    expect(filing.updatedBy).toBe('actor-42');
    expect(filing.save).toHaveBeenCalled();
    expect(result.status).toBe('submitted');
  });

  it('rejects unsupported filing statuses', async () => {
    const filing = {
      id: 'filing-1',
      servicemanId: 'svc-1',
      status: 'draft',
      submittedAt: null,
      amountPaid: 0,
      updatedBy: null,
      toJSON() {
        return {
          id: this.id,
          servicemanId: this.servicemanId,
          status: this.status,
          submittedAt: this.submittedAt,
          amountPaid: this.amountPaid,
          updatedBy: this.updatedBy,
          createdAt: new Date('2025-01-01T00:00:00Z'),
          updatedAt: new Date('2025-01-02T00:00:00Z')
        };
      },
      save: vi.fn().mockResolvedValue(undefined)
    };

    mockServicemanTaxFiling.findOne.mockResolvedValue(filing);

    await expect(
      updateServicemanTaxFilingStatus({
        servicemanId: 'svc-1',
        filingId: 'filing-1',
        status: 'unsupported',
        submittedAt: null,
        amountPaid: null,
        actorId: 'actor-42'
      })
    ).rejects.toThrow('Invalid filing status supplied.');
    expect(filing.save).not.toHaveBeenCalled();
  });
});

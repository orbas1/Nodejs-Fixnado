import { Model } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockServiceZone,
  mockPost,
  mockCustomJobBid,
  mockCustomJobReport,
  mockProviderContact,
  mockUserModel
} = vi.hoisted(() => ({
  mockServiceZone: { findAll: vi.fn(), findOne: vi.fn() },
  mockPost: {
    findAll: vi.fn(),
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn()
  },
  mockCustomJobBid: { findAll: vi.fn(), findOne: vi.fn(), findByPk: vi.fn() },
  mockCustomJobReport: { findAll: vi.fn(), create: vi.fn(), findOne: vi.fn() },
  mockProviderContact: { findAll: vi.fn() },
  mockUserModel: { findByPk: vi.fn() }
}));

const { mockCustomJobInvitation, MockCustomJobInvitationModel } = vi.hoisted(() => {
  const handlers = { findAll: vi.fn(), create: vi.fn(), findOne: vi.fn() };

  class MockCustomJobInvitationModel extends Model {}

  Object.assign(MockCustomJobInvitationModel, handlers);

  return {
    mockCustomJobInvitation: handlers,
    MockCustomJobInvitationModel
  };
});

vi.mock('../models/index.js', () => ({
  __esModule: true,
  ServiceZone: mockServiceZone,
  Post: mockPost,
  CustomJobBid: mockCustomJobBid,
  CustomJobBidMessage: {},
  CustomJobReport: mockCustomJobReport,
  ProviderContact: mockProviderContact,
  User: mockUserModel
}));

vi.mock('../../models/customJobInvitation.js', () => ({
  __esModule: true,
  default: MockCustomJobInvitationModel,
  INVITATION_STATUSES: ['pending', 'accepted', 'declined', 'cancelled'],
  INVITATION_TARGETS: ['provider', 'serviceman', 'user']
}));

const { resolveCompanyForActorMock } = vi.hoisted(() => ({
  resolveCompanyForActorMock: vi.fn()
}));
vi.mock('../panelService.js', () => ({
  __esModule: true,
  resolveCompanyForActor: resolveCompanyForActorMock
}));

import {
  getProviderCustomJobWorkspace,
  createProviderCustomJobReport,
  createProviderCustomJob,
  inviteProviderCustomJobParticipant,
  updateProviderCustomJobInvitation
} from '../providerCustomJobService.js';
import {
  ServiceZone,
  Post,
  CustomJobBid,
  CustomJobReport,
  ProviderContact
} from '../models/index.js';
import CustomJobInvitation from '../../models/customJobInvitation.js';
import { resolveCompanyForActor } from '../panelService.js';

function makeRow(data) {
  return {
    get: () => data
  };
}

describe('providerCustomJobService', () => {
  const baseActor = { id: 'user-1', type: 'company' };
  const baseCompany = {
    id: 'company-1',
    contactName: 'ACME Services',
    serviceRegions: 'North',
    User: { firstName: 'Alex' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resolveCompanyForActorMock.mockResolvedValue({ company: baseCompany, actor: baseActor });
  });

  it('returns workspace data with computed summary and communications', async () => {
    ServiceZone.findAll.mockResolvedValue([
      makeRow({ id: 'zone-1', name: 'North Zone' })
    ]);

    Post.findAll.mockResolvedValue([
      makeRow({
        id: 'post-1',
        title: 'Kitchen refit',
        description: 'Full refit with bespoke cabinetry',
        budget: '£8k - £10k',
        budgetAmount: 9000,
        budgetCurrency: 'GBP',
        category: 'Refit',
        status: 'open',
        allowOutOfZone: false,
        bidDeadline: new Date('2024-04-01T10:00:00Z'),
        createdAt: new Date('2024-03-01T09:00:00Z'),
        zone: { id: 'zone-1', name: 'North Zone' },
        images: ['https://example.com/photo.jpg'],
        metadata: { tags: ['premium'] }
      })
    ]);

    const bidPlain = {
      id: 'bid-1',
      status: 'pending',
      amount: 4200,
      currency: 'GBP',
      message: 'We can deliver within 2 weeks.',
      createdAt: new Date('2024-03-02T12:00:00Z'),
      updatedAt: new Date('2024-03-05T12:00:00Z'),
      job: {
        id: 'post-1',
        title: 'Kitchen refit',
        category: 'Refit',
        budget: '£8k - £10k',
        budgetAmount: 9000,
        budgetCurrency: 'GBP',
        status: 'open',
        bidDeadline: new Date('2024-04-01T10:00:00Z'),
        zone: { id: 'zone-1', name: 'North Zone' }
      },
      messages: [
        {
          id: 'msg-1',
          bidId: 'bid-1',
          body: 'Could you share floor plans?',
          attachments: [],
          authorRole: 'buyer',
          createdAt: new Date('2024-03-03T09:00:00Z'),
          author: { id: 'user-2', firstName: 'Buyer', lastName: 'One', type: 'customer' }
        }
      ]
    };

    CustomJobBid.findAll.mockResolvedValue([makeRow(bidPlain)]);

    CustomJobReport.findAll.mockResolvedValue([
      makeRow({
        id: 'report-1',
        name: 'All bids',
        filters: {},
        metrics: {},
        createdAt: new Date('2024-03-01T10:00:00Z'),
        updatedAt: new Date('2024-03-04T10:00:00Z')
      })
    ]);

    CustomJobInvitation.findAll.mockResolvedValue([]);
    ProviderContact.findAll.mockResolvedValue([]);

    const result = await getProviderCustomJobWorkspace({ actor: baseActor });

    expect(resolveCompanyForActor).toHaveBeenCalledWith({ companyId: undefined, actor: baseActor });
    expect(result.data.summary.totalOpenJobs).toBe(1);
    expect(result.data.summary.activeBids).toBe(1);
    expect(result.data.summary.pendingValue).toBe(4200);
    expect(result.data.reports[0].metrics.totalBids).toBe(1);
    expect(result.data.communications.threads[0].messages).toHaveLength(1);
  });

  it('creates a report with derived metrics', async () => {
    CustomJobBid.findAll.mockResolvedValue([
      makeRow({
        id: 'bid-99',
        status: 'accepted',
        amount: 10000,
        currency: 'GBP',
        job: {
          id: 'post-55',
          title: 'Roof upgrade',
          category: 'Roofing',
          zone: { id: 'zone-3', name: 'South' }
        },
        messages: []
      })
    ]);

    CustomJobReport.create.mockResolvedValue(
      makeRow({
        id: 'report-2',
        name: 'Won jobs',
        filters: { status: 'accepted' },
        metrics: { totalBids: 1, awardedBids: 1 },
        createdAt: new Date('2024-03-06T08:00:00Z'),
        updatedAt: new Date('2024-03-06T08:00:00Z')
      })
    );

    const payload = { name: 'Won jobs', filters: { status: 'accepted' } };
    const report = await createProviderCustomJobReport({ actor: baseActor, payload });

    expect(CustomJobReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: baseCompany.id,
        name: 'Won jobs',
        filters: { status: 'accepted' },
        metrics: expect.objectContaining({
          totalBids: 1,
          awardedBids: 1,
          winRate: expect.any(Number)
        }),
        createdBy: baseActor.id,
        updatedBy: baseActor.id
      })
    );
    expect(report.metrics.totalBids).toBe(1);
    expect(report.metrics.awardedBids).toBe(1);
  });

  it('creates a managed job and returns the hydrated record', async () => {
    ServiceZone.findOne.mockResolvedValue(makeRow({ id: 'zone-1', name: 'North', companyId: baseCompany.id }));

    const createdPlain = {
      id: 'post-100',
      title: 'Emergency callout',
      status: 'open',
      userId: baseActor.id,
      createdAt: new Date('2024-03-01T10:00:00Z'),
      bidDeadline: new Date('2024-03-05T10:00:00Z'),
      invitations: [],
      zone: { id: 'zone-1', name: 'North' }
    };
    Post.create.mockResolvedValue({ id: 'post-100', get: () => createdPlain });
    Post.findByPk.mockResolvedValue(
      makeRow({
        ...createdPlain,
        invitations: [
          {
            id: 'invite-1',
            status: 'pending',
            targetType: 'user',
            targetHandle: 'janedoe',
            createdAt: new Date('2024-03-01T11:00:00Z'),
            creator: { id: baseActor.id, firstName: 'Alex' },
            target: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', type: 'user' }
          }
        ]
      })
    );

    CustomJobInvitation.create.mockResolvedValue({ id: 'invite-1' });
    CustomJobInvitation.findAll.mockResolvedValue([
      makeRow({
        id: 'invite-1',
        postId: 'post-100',
        companyId: baseCompany.id,
        status: 'pending',
        targetType: 'user',
        targetHandle: 'janedoe',
        createdAt: new Date('2024-03-01T11:00:00Z'),
        creator: { id: baseActor.id, firstName: 'Alex', lastName: 'Builder', type: 'company' },
        target: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', type: 'user' }
      })
    ]);

    const payload = {
      title: 'Emergency callout',
      zoneId: 'zone-1',
      invites: [{ targetHandle: 'janedoe', note: 'Priority customer' }]
    };

    const job = await createProviderCustomJob({ actor: baseActor, payload });

    expect(Post.create).toHaveBeenCalled();
    expect(CustomJobInvitation.create).toHaveBeenCalledTimes(1);
    expect(job.id).toBe('post-100');
    expect(job.invitations[0].targetHandle).toBe('janedoe');
  });

  it('throws when inviting without recipient details', async () => {
    Post.findOne.mockResolvedValue(
      makeRow({
        id: 'post-200',
        userId: baseActor.id,
        internalNotes: 'provider:custom-job-managed'
      })
    );

    await expect(
      inviteProviderCustomJobParticipant({ actor: baseActor, postId: 'post-200', payload: {} })
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('resolves roster contacts when only a contact id is provided', async () => {
    Post.findOne.mockResolvedValue(
      makeRow({
        id: 'post-201',
        userId: baseActor.id,
        internalNotes: 'provider:custom-job-managed'
      })
    );
    ProviderContact.findAll.mockResolvedValue([
      makeRow({ id: 'contact-5', name: 'Crew Member', email: 'crew@example.com' })
    ]);
    CustomJobInvitation.create.mockResolvedValue({ id: 'invite-5' });
    CustomJobInvitation.findAll.mockResolvedValue([
      makeRow({
        id: 'invite-5',
        companyId: baseCompany.id,
        postId: 'post-201',
        status: 'pending',
        targetType: 'user',
        targetHandle: 'Crew Member',
        targetEmail: 'crew@example.com',
        createdAt: new Date('2024-03-01T12:00:00Z'),
        creator: { id: baseActor.id, firstName: 'Alex', lastName: 'Builder', type: 'company' }
      })
    ]);

    const invitation = await inviteProviderCustomJobParticipant({
      actor: baseActor,
      postId: 'post-201',
      payload: { contactId: 'contact-5', note: 'Urgent assistance' }
    });

    expect(ProviderContact.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: ['contact-5'], companyId: baseCompany.id })
      })
    );
    expect(invitation.targetHandle).toBe('Crew Member');
    expect(invitation.targetEmail).toBe('crew@example.com');
  });

  it('updates an invitation status and metadata', async () => {
    const invitationRecord = {
      get: () => ({
        id: 'invite-9',
        status: 'pending',
        metadata: { note: 'Original' },
        job: { id: 'post-9', userId: baseActor.id, internalNotes: 'provider:custom-job-managed' }
      }),
      update: vi.fn().mockResolvedValue(),
      reload: vi.fn().mockResolvedValue(),
      set: vi.fn()
    };
    CustomJobInvitation.findOne.mockResolvedValue(invitationRecord);

    await updateProviderCustomJobInvitation({
      actor: baseActor,
      invitationId: 'invite-9',
      payload: { status: 'accepted', note: 'Updated' }
    });

    expect(invitationRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' }),
      expect.any(Object)
    );
  });

  it('ensures workspace returns permissions and roster when empty', async () => {
    ServiceZone.findAll.mockResolvedValue([]);
    ProviderContact.findAll.mockResolvedValue([]);
    Post.findAll.mockResolvedValue([]);
    CustomJobBid.findAll.mockResolvedValue([]);
    CustomJobReport.findAll.mockResolvedValue([]);
    CustomJobInvitation.findAll.mockResolvedValue([]);

    const workspace = await getProviderCustomJobWorkspace({ actor: baseActor });

    expect(workspace.data.permissions.canManageCustomJobs).toBe(true);
    expect(Array.isArray(workspace.data.resources.roster)).toBe(true);
  });
});

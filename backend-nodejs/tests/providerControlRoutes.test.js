import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { withAuth } from './helpers/auth.js';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  ProviderCrewMember,
  ProviderCrewAvailability,
  ProviderCrewDeployment,
  ProviderCrewDelegation
} = await import('../src/models/index.js');

const PROVIDER_ID = '11111111-aaaa-4111-bbbb-ffffffffffff';
const COMPANY_ID = '22222222-bbbb-4222-cccc-ffffffffffff';

async function createProviderFixtures() {
  await User.create({
    id: PROVIDER_ID,
    email: `provider-${Date.now()}@example.com`,
    passwordHash: 'hash',
    type: 'company'
  });

  await Company.create({
    id: COMPANY_ID,
    userId: PROVIDER_ID,
    legalStructure: 'limited',
    contactName: 'Metro Ops',
    contactEmail: 'metro@example.com',
    serviceRegions: 'London, South East',
    marketplaceIntent: 'Critical response ops',
    verified: true
  });
}

function auth(requestBuilder) {
  return withAuth(requestBuilder, PROVIDER_ID, {
    payload: { role: 'company', persona: 'provider' }
  });
}

describe('providerControlRoutes', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
    await createProviderFixtures();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('returns crew management overview with rota and deployments', async () => {
    const crew = await ProviderCrewMember.create({
      companyId: COMPANY_ID,
      fullName: 'Amina Khan',
      role: 'Field lead',
      email: 'amina@example.com',
      employmentType: 'employee',
      status: 'active',
      skills: ['HVAC', 'Electrical'],
      metadata: { allowedRoles: ['provider_manager'] }
    });

    await ProviderCrewAvailability.create({
      companyId: COMPANY_ID,
      crewMemberId: crew.id,
      dayOfWeek: 'monday',
      startTime: DateTime.fromISO('2025-03-17T07:00:00Z').toJSDate(),
      endTime: DateTime.fromISO('2025-03-17T16:00:00Z').toJSDate(),
      status: 'available',
      location: 'Docklands depot'
    });

    await ProviderCrewDeployment.create({
      companyId: COMPANY_ID,
      crewMemberId: crew.id,
      title: 'Retail rollout phase 2',
      assignmentType: 'project',
      referenceId: 'JOB-204',
      startAt: DateTime.fromISO('2025-03-18T08:00:00Z').toJSDate(),
      endAt: DateTime.fromISO('2025-03-18T18:00:00Z').toJSDate(),
      status: 'scheduled',
      metadata: { allowedRoles: ['provider_manager'] }
    });

    await ProviderCrewDelegation.create({
      companyId: COMPANY_ID,
      crewMemberId: crew.id,
      delegateName: 'Darren Ops',
      delegateEmail: 'darren@example.com',
      status: 'active',
      scope: ['approvals'],
      startAt: DateTime.fromISO('2025-03-17T00:00:00Z').toJSDate(),
      metadata: { allowedRoles: ['operations'] }
    });

    const response = await auth(request(app).get('/provider-control/crew').query({ companyId: COMPANY_ID }));

    expect(response.status).toBe(200);
    expect(response.body?.data?.crewMembers).toHaveLength(1);
    expect(response.body.data.deployments).toHaveLength(1);
    expect(response.body.data.delegations).toHaveLength(1);
    expect(response.body.data.rota.find((entry) => entry.day === 'monday')?.slots).toHaveLength(1);
    expect(response.body.meta.companyId).toBe(COMPANY_ID);
  });

  it('creates, updates, and deletes a crew member', async () => {
    const createResponse = await auth(
      request(app)
        .post('/provider-control/crew-members')
        .query({ companyId: COMPANY_ID })
        .send({
          fullName: 'New Crew Member',
          role: 'Technician',
          email: 'crew@example.com',
          employmentType: 'contractor',
          defaultShiftStart: '07:30',
          defaultShiftEnd: '16:30',
          skills: ['Rope access'],
          allowedRoles: ['field_lead']
        })
    );

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.fullName).toBe('New Crew Member');
    const crewId = createResponse.body.data.id;

    const updateResponse = await auth(
      request(app)
        .put(`/provider-control/crew-members/${crewId}`)
        .query({ companyId: COMPANY_ID })
        .send({
          fullName: 'Updated Crew Member',
          role: 'Senior Technician',
          employmentType: 'employee',
          skills: ['Rope access', 'HVAC'],
          allowedRoles: ['field_lead', 'provider_manager']
        })
    );
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.fullName).toBe('Updated Crew Member');
    expect(updateResponse.body.data.skills).toContain('HVAC');

    const deleteResponse = await auth(
      request(app)
        .delete(`/provider-control/crew-members/${crewId}`)
        .query({ companyId: COMPANY_ID })
    );
    expect(deleteResponse.status).toBe(204);
    const remaining = await ProviderCrewMember.count();
    expect(remaining).toBe(0);
  });

  it('manages availability windows', async () => {
    const crew = await ProviderCrewMember.create({
      companyId: COMPANY_ID,
      fullName: 'Planner Crew',
      employmentType: 'employee',
      status: 'active'
    });

    const createResponse = await auth(
      request(app)
        .post(`/provider-control/crew-members/${crew.id}/availability`)
        .query({ companyId: COMPANY_ID })
        .send({
          dayOfWeek: 'tuesday',
          startTime: '08:00',
          endTime: '17:00',
          status: 'available',
          location: 'City hub'
        })
    );
    expect(createResponse.status).toBe(201);
    const availabilityId = createResponse.body.data.id;

    const updateResponse = await auth(
      request(app)
        .put(`/provider-control/crew-members/${crew.id}/availability/${availabilityId}`)
        .query({ companyId: COMPANY_ID })
        .send({
          dayOfWeek: 'tuesday',
          startTime: '09:00',
          endTime: '18:00',
          status: 'standby',
          location: 'City hub'
        })
    );
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe('standby');

    const deleteResponse = await auth(
      request(app)
        .delete(`/provider-control/crew-members/${crew.id}/availability/${availabilityId}`)
        .query({ companyId: COMPANY_ID })
    );
    expect(deleteResponse.status).toBe(204);
  });

  it('creates deployments and delegations', async () => {
    const crew = await ProviderCrewMember.create({
      companyId: COMPANY_ID,
      fullName: 'Deployment Crew',
      employmentType: 'employee',
      status: 'active'
    });

    const deploymentResponse = await auth(
      request(app)
        .post('/provider-control/deployments')
        .query({ companyId: COMPANY_ID })
        .send({
          crewMemberId: crew.id,
          title: 'Overnight standby',
          assignmentType: 'standby',
          startAt: DateTime.utc().plus({ hours: 2 }).toISO(),
          endAt: DateTime.utc().plus({ hours: 10 }).toISO(),
          status: 'scheduled',
          allowedRoles: ['provider_manager']
        })
    );
    expect(deploymentResponse.status).toBe(201);
    const deploymentId = deploymentResponse.body.data.id;

    const delegationResponse = await auth(
      request(app)
        .post('/provider-control/delegations')
        .query({ companyId: COMPANY_ID })
        .send({
          crewMemberId: crew.id,
          delegateName: 'Night Supervisor',
          delegateEmail: 'night@example.com',
          status: 'scheduled',
          scope: ['approvals', 'communications'],
          startAt: DateTime.utc().toISO(),
          allowedRoles: ['operations']
        })
    );
    expect(delegationResponse.status).toBe(201);
    const delegationId = delegationResponse.body.data.id;

    const deleteDeployment = await auth(
      request(app)
        .delete(`/provider-control/deployments/${deploymentId}`)
        .query({ companyId: COMPANY_ID })
    );
    expect(deleteDeployment.status).toBe(204);

    const deleteDelegation = await auth(
      request(app)
        .delete(`/provider-control/delegations/${delegationId}`)
        .query({ companyId: COMPANY_ID })
    );
    expect(deleteDelegation.status).toBe(204);
  });
});

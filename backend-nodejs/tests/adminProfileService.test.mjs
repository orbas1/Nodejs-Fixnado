import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { sequelize, User } = await import('../src/models/index.js');
const { getAdminProfile, upsertAdminProfile } = await import('../src/services/adminProfileService.js');

async function resetDatabase() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

describe('adminProfileService', () => {
  it('returns default values when no profile exists', async () => {
    const user = await User.create({
      firstName: 'Morgan',
      lastName: 'Lee',
      email: `morgan-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'admin'
    }, { validate: false });

    const profile = await getAdminProfile(user.id);

    expect(profile.firstName).toBe('Morgan');
    expect(profile.displayName).toContain('Morgan');
    expect(profile.notifications.securityAlerts).toBe(true);
    expect(profile.security.requireMfa).toBe(true);
    expect(profile.workingHours).toMatchObject({ start: '09:00', end: '17:30' });
    expect(Array.isArray(profile.escalationContacts)).toBe(true);
    expect(profile.escalationContacts).toHaveLength(0);
    expect(profile.outOfOffice.enabled).toBe(false);
    expect(profile.resourceLinks).toHaveLength(0);
  });

  it('persists profile updates and normalises delegates', async () => {
    const user = await User.create({
      firstName: 'Quinn',
      lastName: 'Wells',
      email: `quinn-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'admin'
    }, { validate: false });

    const payload = {
      firstName: 'Quinn',
      lastName: 'Wells',
      displayName: 'Quinn Wells',
      jobTitle: 'Head of Platform',
      department: 'Operations',
      pronouns: 'they/them',
      avatarUrl: 'https://cdn.fixnado.com/avatar.png',
      bio: 'Oversees platform health and security posture.',
      contactEmail: 'quinn.wells@example.com',
      backupEmail: '',
      contactPhone: '+44 20 7946 0958',
      location: 'London HQ',
      timezone: 'Europe/London',
      language: 'en-GB',
      theme: 'dark',
      workingHours: { start: '08:00', end: '17:00' },
      notifications: {
        securityAlerts: false,
        incidentEscalations: true,
        weeklyDigest: false,
        productUpdates: true,
        smsAlerts: true
      },
      security: {
        requireMfa: true,
        loginAlerts: true,
        allowSessionShare: false,
        sessionTimeoutMinutes: 90
      },
      delegates: [
        { name: 'Taylor Reed', email: 'taylor@example.com', role: 'Deputy Director' },
        { name: 'Duplicate Entry', email: 'taylor@example.com', role: 'Duplicate' },
        { name: 'Missing Email', email: '', role: 'Ignored' }
      ],
      escalationContacts: [
        { method: 'Email', label: 'Primary inbox', destination: 'quinn.wells@example.com', priority: 'P0' },
        { method: 'sms', label: 'Pager', destination: '+44 20 7000 0000', priority: 'p1' },
        { method: 'email', label: 'Duplicate', destination: 'quinn.wells@example.com', priority: 'p2' }
      ],
      outOfOffice: {
        enabled: true,
        message: 'Out for conference.',
        handoverStart: '2025-03-01T09:00',
        handoverEnd: '2025-03-05T18:00',
        delegateEmail: 'delegate@example.com'
      },
      resourceLinks: [
        { label: 'Major incident playbook', url: 'https://fixnado.com/playbooks/major-incidents' },
        { label: 'Duplicate link', url: 'https://fixnado.com/playbooks/major-incidents' }
      ]
    };

    const updated = await upsertAdminProfile(user.id, payload, 'tester');

    expect(updated.contactEmail).toBe('quinn.wells@example.com');
    expect(updated.jobTitle).toBe('Head of Platform');
    expect(updated.notifications.securityAlerts).toBe(false);
    expect(updated.notifications.smsAlerts).toBe(true);
    expect(updated.security.sessionTimeoutMinutes).toBe(90);
    expect(updated.delegates).toHaveLength(1);
    expect(updated.delegates[0]).toMatchObject({
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      role: 'Deputy Director'
    });
    expect(updated.escalationContacts).toHaveLength(2);
    expect(updated.escalationContacts[0]).toMatchObject({ method: 'email', priority: 'p0' });
    expect(updated.escalationContacts[1]).toMatchObject({ method: 'sms', destination: '+44 20 7000 0000' });
    expect(updated.outOfOffice.enabled).toBe(true);
    expect(Date.parse(updated.outOfOffice.handoverStart)).not.toBeNaN();
    expect(Date.parse(updated.outOfOffice.handoverEnd)).not.toBeNaN();
    expect(updated.outOfOffice.delegateEmail).toBe('delegate@example.com');
    expect(updated.resourceLinks).toHaveLength(1);
    expect(updated.resourceLinks[0]).toMatchObject({
      label: 'Major incident playbook',
      url: 'https://fixnado.com/playbooks/major-incidents'
    });

    const reloadedUser = await User.findByPk(user.id);
    expect(reloadedUser.email).toBe('quinn.wells@example.com');
  });

  it('rejects invalid updates', async () => {
    const user = await User.create({
      firstName: 'Jamie',
      lastName: 'Cole',
      email: `jamie-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'admin'
    }, { validate: false });

    await expect(
      upsertAdminProfile(user.id, {
        firstName: '',
        lastName: 'Cole',
        displayName: 'Jamie',
        contactEmail: 'not-an-email',
        timezone: 'Europe/London',
        language: 'en-GB',
        theme: 'system'
      })
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('disables out of office resets optional fields', async () => {
    const user = await User.create({
      firstName: 'Jordan',
      lastName: 'West',
      email: `jordan-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'admin'
    }, { validate: false });

    const payload = {
      firstName: 'Jordan',
      lastName: 'West',
      displayName: 'Jordan West',
      contactEmail: 'jordan.west@example.com',
      timezone: 'Europe/London',
      language: 'en-GB',
      theme: 'light',
      outOfOffice: {
        enabled: false,
        message: 'Will be ignored',
        handoverStart: '2025-06-01T10:00',
        handoverEnd: '2025-06-02T18:00',
        delegateEmail: 'ignored@example.com'
      }
    };

    const updated = await upsertAdminProfile(user.id, payload);

    expect(updated.outOfOffice.enabled).toBe(false);
    expect(updated.outOfOffice.message).toBe('');
    expect(updated.outOfOffice.handoverStart).toBeNull();
    expect(updated.outOfOffice.delegateEmail).toBe('');
  });
});

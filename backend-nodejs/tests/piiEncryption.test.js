import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import { sequelize, User, Company } from '../src/models/index.js';
import { normaliseEmail, stableHash } from '../src/utils/security/fieldEncryption.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await sequelize.truncate({ cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('PII encryption', () => {
  it('encrypts user profiles and preserves decrypted access', async () => {
    const email = 'TestUser@example.com';
    const user = await User.create({
      firstName: 'Casey',
      lastName: 'Ledger',
      email,
      passwordHash: 'hashed',
      address: '221B Security Way',
      age: 32,
      type: 'user'
    });

    expect(user.email).toBe(email);
    expect(user.firstName).toBe('Casey');

    const stored = await User.findOne({
      where: { email },
      raw: true,
      attributes: ['email', 'email_hash', 'first_name_encrypted', 'address_encrypted']
    });

    expect(stored.email).not.toEqual(email);
    expect(stored.first_name_encrypted).not.toEqual('Casey');
    expect(stored.address_encrypted).not.toEqual('221B Security Way');
    expect(stored.email).toMatch(/^[A-Za-z0-9+/=]+$/);

    const expectedHash = stableHash(normaliseEmail(email), 'user:email-query');
    expect(stored.email_hash).toEqual(expectedHash);
  });

  it('hashes email lookups so case-insensitive queries remain functional', async () => {
    await User.create({
      firstName: 'Morgan',
      lastName: 'Audit',
      email: 'compliance@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const fetched = await User.findOne({ where: { email: 'Compliance@Example.com' } });
    expect(fetched).not.toBeNull();
    expect(fetched.email).toBe('compliance@example.com');
  });

  it('encrypts company contact details', async () => {
    const owner = await User.create({
      firstName: 'Taylor',
      lastName: 'Ops',
      email: 'owner@example.com',
      passwordHash: 'hashed',
      type: 'company'
    });

    const company = await Company.create({
      userId: owner.id,
      legalStructure: 'limited',
      contactName: 'Taylor Ops',
      contactEmail: 'ops@example.com'
    });

    expect(company.contactEmail).toBe('ops@example.com');

    const stored = await Company.findOne({
      where: { id: company.id },
      raw: true,
      attributes: ['contact_email_encrypted', 'contact_email_hash']
    });

    expect(stored.contact_email_encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(stored.contact_email_hash).toEqual(
      stableHash(normaliseEmail('ops@example.com'), 'company:contactEmail')
    );
  });
});

import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sequelize, DataTypes, Model } from 'sequelize';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

class User extends Model {}
User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    passwordHash: DataTypes.STRING,
    type: DataTypes.STRING
  },
  { sequelize: testSequelize, modelName: 'User', tableName: 'Users' }
);

class Company extends Model {}
Company.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    legalStructure: DataTypes.STRING,
    contactName: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    serviceRegions: DataTypes.STRING,
    marketplaceIntent: DataTypes.STRING,
    verified: DataTypes.BOOLEAN,
    insuredSellerStatus: DataTypes.STRING,
    insuredSellerBadgeVisible: DataTypes.BOOLEAN,
    complianceScore: DataTypes.FLOAT
  },
  { sequelize: testSequelize, modelName: 'Company', tableName: 'Companies' }
);

class Region extends Model {}
Region.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    code: DataTypes.STRING
  },
  { sequelize: testSequelize, modelName: 'Region', tableName: 'Regions' }
);

class ProviderProfile extends Model {}
ProviderProfile.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyId: { type: DataTypes.UUID, allowNull: false },
    displayName: DataTypes.STRING,
    tradingName: DataTypes.STRING,
    status: DataTypes.STRING,
    onboardingStage: DataTypes.STRING,
    tier: DataTypes.STRING,
    riskRating: DataTypes.STRING
  },
  { sequelize: testSequelize, modelName: 'ProviderProfile', tableName: 'ProviderProfiles' }
);

class ProviderTaxProfile extends Model {}
ProviderTaxProfile.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyId: { type: DataTypes.UUID, allowNull: false },
    registrationNumber: DataTypes.STRING,
    registrationCountry: DataTypes.STRING,
    registrationRegion: DataTypes.STRING,
    registrationStatus: DataTypes.STRING,
    vatRegistered: DataTypes.BOOLEAN,
    registrationEffectiveFrom: DataTypes.DATE,
    defaultRate: DataTypes.FLOAT,
    thresholdAmount: DataTypes.FLOAT,
    thresholdCurrency: DataTypes.STRING,
    filingFrequency: DataTypes.STRING,
    nextFilingDueAt: DataTypes.DATE,
    lastFiledAt: DataTypes.DATE,
    accountingMethod: DataTypes.STRING,
    certificateUrl: DataTypes.STRING,
    exemptionReason: DataTypes.STRING,
    taxAdvisor: DataTypes.STRING,
    notes: DataTypes.TEXT,
    metadata: DataTypes.JSON
  },
  { sequelize: testSequelize, modelName: 'ProviderTaxProfile', tableName: 'ProviderTaxProfiles' }
);

class ProviderTaxFiling extends Model {}
ProviderTaxFiling.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyId: { type: DataTypes.UUID, allowNull: false },
    periodStart: DataTypes.DATE,
    periodEnd: DataTypes.DATE,
    dueAt: DataTypes.DATE,
    filedAt: DataTypes.DATE,
    status: DataTypes.STRING,
    taxableSalesAmount: DataTypes.FLOAT,
    taxCollectedAmount: DataTypes.FLOAT,
    taxDueAmount: DataTypes.FLOAT,
    currency: DataTypes.STRING,
    referenceNumber: DataTypes.STRING,
    submittedBy: DataTypes.STRING,
    supportingDocumentUrl: DataTypes.STRING,
    notes: DataTypes.TEXT,
    metadata: DataTypes.JSON
  },
  { sequelize: testSequelize, modelName: 'ProviderTaxFiling', tableName: 'ProviderTaxFilings' }
);

User.hasMany(Company, { foreignKey: 'userId', as: 'companies' });
Company.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Region.hasMany(Company, { foreignKey: 'regionId', as: 'companies' });
Company.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
ProviderProfile.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
ProviderTaxProfile.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
ProviderTaxFiling.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

vi.mock('../src/models/index.js', () => ({
  __esModule: true,
  default: testSequelize,
  sequelize: testSequelize,
  User,
  Company,
  Region,
  ProviderProfile,
  ProviderTaxProfile,
  ProviderTaxFiling,
  ProviderContact: { findAll: async () => [] },
  ProviderCoverage: { findAll: async () => [] },
  Service: { findAll: async () => [] },
  ServiceZone: { findAll: async () => [] },
  ComplianceDocument: { findAll: async () => [] },
  Booking: { count: async () => 0 },
  Dispute: { count: async () => 0 },
  UserSession: { findAll: async () => [], count: async () => 0 }
}));

const {
  upsertProviderTaxProfileHandler,
  createProviderTaxFilingHandler,
  updateProviderTaxFilingHandler,
  deleteProviderTaxFilingHandler,
  getProviderHandler
} = await import('../src/controllers/adminProviderController.js');
const { sequelize } = await import('../src/models/index.js');

function createResponse() {
  const res = {};
  res.statusCode = 200;
  res.payload = undefined;
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body) => {
    res.payload = body;
    return res;
  });
  return res;
}

async function seedProvider() {
  const owner = await User.create({
    firstName: 'Casey',
    lastName: 'Nguyen',
    email: 'casey.provider@example.com',
    passwordHash: 'hashed',
    type: 'company'
  });

  const company = await Company.create({
    userId: owner.id,
    legalStructure: 'Ltd',
    contactName: 'Casey Nguyen',
    contactEmail: 'casey.provider@example.com',
    serviceRegions: 'London',
    marketplaceIntent: 'Electrical services',
    verified: true,
    insuredSellerStatus: 'approved',
    insuredSellerBadgeVisible: true,
    complianceScore: 96
  });

  await ProviderProfile.create({
    companyId: company.id,
    displayName: 'Casey Electrical',
    tradingName: 'Casey Electrical',
    status: 'active',
    onboardingStage: 'live',
    tier: 'strategic',
    riskRating: 'medium'
  });

  return { company };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Admin provider tax management handlers', () => {
  it('updates provider tax profile and returns normalised payload', async () => {
    const { company } = await seedProvider();
    const req = {
      params: { companyId: company.id },
      body: {
        registrationNumber: 'GB987654321',
        registrationCountry: 'GB',
        registrationStatus: 'registered',
        defaultRate: 0.2,
        filingFrequency: 'quarterly',
        vatRegistered: true,
        taxAdvisor: 'Fixnado Finance Ops'
      }
    };
    const res = createResponse();
    const next = vi.fn();

    await upsertProviderTaxProfileHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationNumber: 'GB987654321',
        registrationStatus: 'registered',
        vatRegistered: true
      })
    );

    const stored = await ProviderTaxProfile.findOne({ where: { companyId: company.id } });
    expect(stored).not.toBeNull();
    expect(stored.registrationStatus).toBe('registered');
  });

  it('creates, updates, and deletes provider tax filings', async () => {
    const { company } = await seedProvider();
    const createReq = {
      params: { companyId: company.id },
      body: {
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
        dueAt: '2025-05-07',
        status: 'scheduled',
        taxableSalesAmount: 120000,
        taxCollectedAmount: 24000,
        currency: 'GBP'
      }
    };
    const createRes = createResponse();

    await createProviderTaxFilingHandler(createReq, createRes, vi.fn());

    expect(createRes.status).toHaveBeenCalledWith(201);
    expect(createRes.payload.status).toBe('scheduled');
    const filingId = createRes.payload.id;
    expect(filingId).toBeTruthy();

    const updateReq = {
      params: { companyId: company.id, filingId },
      body: { status: 'filed', filedAt: '2025-04-20', taxDueAmount: 24000 }
    };
    const updateRes = createResponse();
    await updateProviderTaxFilingHandler(updateReq, updateRes, vi.fn());

    expect(updateRes.payload.status).toBe('filed');
    expect(updateRes.payload.taxDueAmount).toBe(24000);

    const deleteReq = { params: { companyId: company.id, filingId } };
    const deleteRes = createResponse();
    await deleteProviderTaxFilingHandler(deleteReq, deleteRes, vi.fn());

    expect(deleteRes.status).toHaveBeenCalledWith(204);
    const remaining = await ProviderTaxFiling.count({ where: { companyId: company.id } });
    expect(remaining).toBe(0);
  });

  it('embeds tax data in provider detail response', async () => {
    const { company } = await seedProvider();

    await ProviderTaxProfile.create({
      companyId: company.id,
      registrationNumber: 'GB222222222',
      registrationStatus: 'registered',
      filingFrequency: 'annual',
      defaultRate: 0.2,
      vatRegistered: true
    });

    await ProviderTaxFiling.create({
      companyId: company.id,
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-03-31'),
      dueAt: new Date('2025-05-07'),
      status: 'scheduled',
      taxableSalesAmount: 100000,
      taxCollectedAmount: 20000,
      taxDueAmount: 20000,
      currency: 'GBP'
    });

    const req = { params: { companyId: company.id } };
    const res = createResponse();

    await getProviderHandler(req, res, vi.fn());

    expect(res.json).toHaveBeenCalled();
    expect(res.payload.taxProfile.registrationStatus).toBe('registered');
    expect(Array.isArray(res.payload.taxFilings)).toBe(true);
    expect(res.payload.taxFilings.length).toBeGreaterThan(0);
  });
});

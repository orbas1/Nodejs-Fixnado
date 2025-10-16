import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyMock = vi.fn();
const createTransportMock = vi.fn(() => ({ verify: verifyMock }));

vi.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: createTransportMock
  }
}));

const modelsModule = await import('../src/models/index.js');
const diagnosticsModule = await import('../src/services/systemSettingsDiagnosticsService.js');

const originalFetch = global.fetch;

const { sequelize, SystemSettingAudit } = modelsModule;
const {
  listDiagnostics,
  runDiagnostic,
  runSmtpDiagnostic,
  runStorageDiagnostic,
  runSlackDiagnostic,
  getSupportedDiagnosticSections
} = diagnosticsModule;

describe('systemSettingsDiagnosticsService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await SystemSettingAudit.destroy({ where: {} });
    vi.clearAllMocks();
    verifyMock.mockResolvedValue();
    global.fetch = originalFetch;
  });

  afterAll(async () => {
    await sequelize.close();
    global.fetch = originalFetch;
  });

  it('records a successful SMTP diagnostic', async () => {
    const result = await runSmtpDiagnostic(
      {
        host: 'smtp.fixnado.io',
        fromEmail: 'ops@fixnado.io',
        port: 587,
        username: 'ops',
        password: 'secret'
      },
      'admin-user'
    );

    expect(createTransportMock).toHaveBeenCalledOnce();
    expect(verifyMock).toHaveBeenCalledOnce();
    expect(result.status).toBe('success');
    expect(result.section).toBe('smtp');
    expect(result.message).toMatch(/verified successfully/i);
    expect(result.metadata.sectionLabel).toBe('Email delivery');
    expect(typeof result.metadata.durationMs === 'number' || result.metadata.durationMs === null).toBe(true);

    const records = await SystemSettingAudit.findAll();
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('success');
  });

  it('flags storage verification when bucket is missing', async () => {
    const result = await runStorageDiagnostic({ provider: 'cloudflare-r2' }, 'admin-user');
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/bucket name is required/i);
    expect(result.metadata.sectionLabel).toBe('Storage');
  });

  it('requires a valid Slack token format', async () => {
    const result = await runSlackDiagnostic(
      { botToken: 'invalid', signingSecret: 'abc' },
      'admin-user'
    );
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/xoxb/i);
    expect(result.metadata.sectionLabel).toBe('Slack BYOK');
  });

  it('aggregates diagnostics in descending order', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, statusText: 'OK' })
    );

    await runDiagnostic(
      'storage',
      { bucket: 'fixnado', publicUrl: 'https://cdn.fixnado.io' },
      'admin-user'
    );
    await runDiagnostic(
      'openai',
      { apiKey: 'sk-test', baseUrl: 'https://api.openai.com' },
      'admin-user'
    );

    const diagnostics = await listDiagnostics({ limit: 10 });
    expect(diagnostics.length).toBeGreaterThanOrEqual(2);
    expect(diagnostics[0].createdAt.valueOf()).toBeGreaterThan(
      diagnostics[diagnostics.length - 1].createdAt.valueOf()
    );
    expect(diagnostics[0].metadata.sectionLabel).toBeTruthy();
  });

  it('exposes the supported diagnostic sections with labels', () => {
    const sections = getSupportedDiagnosticSections();
    expect(sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'smtp', label: expect.stringMatching(/email/i) }),
        expect.objectContaining({ value: 'storage', label: expect.stringMatching(/storage/i) })
      ])
    );
  });
});

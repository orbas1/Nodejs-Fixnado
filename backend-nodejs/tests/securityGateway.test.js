import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env.CORS_ALLOWLIST = [
  'https://allowed.example.com',
  'http://localhost',
  'http://127.0.0.1'
].join(',');
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

const { default: app } = await import('../src/app.js');
const { sequelize } = await import('../src/models/index.js');

describe('API gateway protections', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    try {
      await sequelize.close();
    } catch {
      // Ignore double close during watch runs
    }
  });

  it('surfaces a healthy status with database diagnostics on /healthz', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('pass');
    expect(response.body.checks).toBeDefined();
    expect(response.body.checks.database.status).toBe('pass');
    expect(typeof response.body.checks.database.latencyMs).toBe('number');
    expect(response.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('blocks disallowed origins with a 403 response', async () => {
    const response = await request(app)
      .get('/api/gateway-probe')
      .set('Origin', 'https://malicious.example.com');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Origin not allowed by CORS policy');
  });

  it('enforces rate limiting and returns retry metadata', async () => {
    const probePath = '/api/rate-limit-probe';
    const testIp = '203.0.113.77';

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const response = await request(app)
        .get(probePath)
        .set('X-Forwarded-For', testIp);

      expect([404, 403]).toContain(response.status);
    }

    const throttled = await request(app)
      .get(probePath)
      .set('X-Forwarded-For', testIp);

    expect(throttled.status).toBe(429);
    expect(throttled.body.message).toBe('Too many requests, please slow down.');
    expect(throttled.body.retryAfterSeconds).toBeGreaterThan(0);
  });
});

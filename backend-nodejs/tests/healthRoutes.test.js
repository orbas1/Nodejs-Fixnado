import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app, { initDatabase, updateReadiness } from '../src/app.js';
import { sequelize } from '../src/models/index.js';

const restoreComponentState = () => {
  updateReadiness('httpServer', { status: 'initialising', metadata: {} });
  updateReadiness('backgroundJobs', { status: 'initialising', metadata: {} });
  updateReadiness('database', { status: 'initialising', metadata: {} });
};

describe('health endpoints', () => {
  beforeAll(async () => {
    restoreComponentState();
    await sequelize.sync({ force: true });
    await initDatabase(console);
    updateReadiness('httpServer', { status: 'ready', metadata: { port: 0 } });
    updateReadiness('backgroundJobs', { status: 'ready', metadata: { runningJobs: 0 } });
  });

  afterAll(async () => {
    await sequelize.close();
    restoreComponentState();
  });

  it('reports database connectivity via /healthz', async () => {
    const response = await request(app).get('/healthz').expect(200);

    expect(response.body.status).toBe('pass');
    expect(response.body.checks?.database?.status).toBe('pass');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('exposes readiness information via /readyz', async () => {
    const response = await request(app).get('/readyz').expect(200);

    expect(response.body.status).toBe('pass');
    expect(response.body.components?.database?.status).toBe('ready');
    expect(response.body.components?.httpServer?.status).toBe('ready');
    expect(response.body.components?.backgroundJobs?.status).toBe('ready');
  });
});

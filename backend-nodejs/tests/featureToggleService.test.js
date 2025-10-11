import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/models/index.js', () => {
  return {
    sequelize: {
      query: vi.fn(async () => undefined)
    }
  };
});

const configModule = await import('../src/config/index.js');
const config = configModule.default;

beforeEach(() => {
  config.featureToggles.secretArn = '';
  config.featureToggles.overrides = {
    'geo-zones': {
      state: 'enabled',
      rollout: 1,
      description: 'Expose zone overlays',
      owner: 'geo-zone-squad',
      ticket: 'FIX-2101'
    }
  };
  config.featureToggles.cacheTtlSeconds = 60;
});

afterEach(async () => {
  const service = await import('../src/services/featureToggleService.js');
  service.resetFeatureToggleCache();
  service.overrideSecretsManagerClient(undefined);
});

describe('featureToggleService', () => {
  it('returns toggles from environment overrides when no secret is configured', async () => {
    const service = await import('../src/services/featureToggleService.js');
    const toggles = await service.listFeatureToggles();
    expect(toggles).toEqual([
      expect.objectContaining({
        key: 'geo-zones',
        state: 'enabled',
        rollout: 1,
        owner: 'geo-zone-squad',
        ticket: 'FIX-2101'
      })
    ]);
    expect(service.getFeatureToggleCacheVersion()).toBe('env-overrides');
  });

  it('fetches and updates toggles from Secrets Manager when configured', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        SecretString: JSON.stringify({
          'booking-orchestrator': {
            state: 'pilot',
            rollout: 0.25,
            owner: 'bookings',
            description: 'Pilot orchestrator',
            ticket: 'FIX-3100'
          }
        }),
        VersionId: 'initial'
      })
      .mockResolvedValueOnce({ VersionId: 'updated' });

    const mockClient = { send };
    const service = await import('../src/services/featureToggleService.js');
    config.featureToggles.secretArn = 'arn:aws:secretsmanager:eu-west-2:123:secret:feature-toggles';
    service.overrideSecretsManagerClient(mockClient);

    const toggles = await service.listFeatureToggles({ forceRefresh: true });
    expect(toggles).toHaveLength(1);
    expect(toggles[0]).toMatchObject({ key: 'booking-orchestrator', state: 'pilot', rollout: 0.25 });

    const updated = await service.upsertFeatureToggle(
      'booking-orchestrator',
      { state: 'enabled', rollout: 0.85, description: 'Ramp-up', ticket: 'FIX-3100' },
      'admin-user'
    );

    expect(updated).toMatchObject({
      key: 'booking-orchestrator',
      state: 'enabled',
      rollout: 0.85,
      lastModifiedBy: 'admin-user'
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ SecretString: expect.any(String) })
      })
    );

    const models = await import('../src/models/index.js');
    expect(models.sequelize.query).toHaveBeenCalledOnce();
  });
});

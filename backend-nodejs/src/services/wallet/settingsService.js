import { WalletConfiguration } from '../../models/index.js';
import { ensureSettingsStructure } from './helpers.js';

export async function getLatestSettings() {
  const configuration = await WalletConfiguration.findOne({ order: [['updated_at', 'DESC']] });
  return ensureSettingsStructure(configuration?.settings ?? {});
}

export async function saveWalletSettings({ actorId, settings }) {
  const sanitized = ensureSettingsStructure(settings);
  const [configuration, created] = await WalletConfiguration.findOrCreate({
    where: { name: 'default' },
    defaults: {
      settings: sanitized,
      createdBy: actorId ?? null,
      updatedBy: actorId ?? null
    }
  });

  if (!created) {
    configuration.settings = sanitized;
    configuration.updatedBy = actorId ?? null;
    await configuration.save();
  }

  return sanitized;
}

export default {
  getLatestSettings,
  saveWalletSettings
};

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { decryptString, encryptString, stableHash } from '../utils/security/fieldEncryption.js';

function normaliseJson(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

class ProviderByokIntegration extends Model {
  get credentials() {
    const payload = this.getDataValue('credentialsEncrypted');
    if (!payload) {
      return null;
    }
    try {
      const decrypted = decryptString(payload, `provider-byok:${this.getDataValue('integration') || 'integration'}`);
      const parsed = JSON.parse(decrypted);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  set credentials(value) {
    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
      this.setDataValue('credentialsEncrypted', null);
      this.setDataValue('credentialFingerprint', null);
      return;
    }
    const serialised = typeof value === 'string' ? value : JSON.stringify(value);
    const context = `provider-byok:${this.getDataValue('integration') || 'integration'}`;
    this.setDataValue('credentialsEncrypted', encryptString(serialised, context));
    this.setDataValue('credentialFingerprint', stableHash(serialised, `${context}:fingerprint`));
  }
}

ProviderByokIntegration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    integration: {
      type: DataTypes.STRING(64),
      allowNull: false,
      set(value) {
        if (typeof value !== 'string') {
          throw new TypeError('integration must be a string');
        }
        this.setDataValue('integration', value.trim().toLowerCase());
      }
    },
    displayName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'display_name',
      set(value) {
        if (typeof value !== 'string' || !value.trim()) {
          throw new TypeError('displayName must be a non-empty string');
        }
        this.setDataValue('displayName', value.trim());
      }
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'inactive',
      set(value) {
        if (typeof value !== 'string' || !value.trim()) {
          this.setDataValue('status', 'inactive');
          return;
        }
        this.setDataValue('status', value.trim().toLowerCase());
      }
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      set(value) {
        this.setDataValue('settings', normaliseJson(value));
      }
    },
    credentialsEncrypted: {
      type: DataTypes.TEXT,
      field: 'credentials_encrypted',
      allowNull: true
    },
    credentialFingerprint: {
      type: DataTypes.STRING(128),
      field: 'credential_fingerprint',
      allowNull: true
    },
    lastRotatedAt: {
      type: DataTypes.DATE,
      field: 'last_rotated_at',
      allowNull: true
    },
    lastRotatedBy: {
      type: DataTypes.UUID,
      field: 'last_rotated_by',
      allowNull: true
    },
    lastTestStatus: {
      type: DataTypes.STRING(32),
      field: 'last_test_status',
      allowNull: true,
      set(value) {
        if (value == null) {
          this.setDataValue('lastTestStatus', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('lastTestStatus must be a string when provided');
        }
        this.setDataValue('lastTestStatus', value.trim().toLowerCase());
      }
    },
    lastTestAt: {
      type: DataTypes.DATE,
      field: 'last_test_at',
      allowNull: true
    },
    lastTestNotes: {
      type: DataTypes.TEXT,
      field: 'last_test_notes',
      allowNull: true,
      set(value) {
        if (value == null) {
          this.setDataValue('lastTestNotes', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('lastTestNotes must be a string when provided');
        }
        this.setDataValue('lastTestNotes', value.trim());
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      set(value) {
        this.setDataValue('metadata', normaliseJson(value));
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      field: 'updated_by',
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ProviderByokIntegration',
    tableName: 'provider_byok_integrations',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default ProviderByokIntegration;

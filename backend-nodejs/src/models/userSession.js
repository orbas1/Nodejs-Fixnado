import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class UserSession extends Model {
  isActive(referenceDate = new Date()) {
    if (this.revokedAt) {
      return false;
    }
    return this.expiresAt ? new Date(this.expiresAt) > referenceDate : false;
  }
}

UserSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    refreshTokenHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      field: 'refresh_token_hash'
    },
    sessionFingerprint: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'session_fingerprint'
    },
    clientType: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'web',
      field: 'client_type'
    },
    clientVersion: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'client_version'
    },
    deviceLabel: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'device_label'
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_used_at'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    modelName: 'UserSession',
    tableName: 'user_sessions',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default UserSession;

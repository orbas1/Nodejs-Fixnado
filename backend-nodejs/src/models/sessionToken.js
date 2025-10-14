import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SessionToken extends Model {
  isRevoked() {
    return Boolean(this.revokedAt);
  }

  isExpired(referenceDate = new Date()) {
    return new Date(this.expiresAt).getTime() <= referenceDate.getTime();
  }
}

SessionToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    tokenHash: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    context: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'web'
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    lastRotatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'SessionToken',
    tableName: 'session_tokens'
  }
);

export default SessionToken;

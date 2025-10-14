import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ConsentEvent extends Model {}

ConsentEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    sessionId: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    consentType: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    consentVersion: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    granted: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'ConsentEvent',
    tableName: 'consent_events'
  }
);

export default ConsentEvent;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ScamDetectionEvent extends Model {}

ScamDetectionEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceType: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actorRole: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    riskScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    triggered: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    signals: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ScamDetectionEvent',
    tableName: 'scam_detection_events'
  }
);

export default ScamDetectionEvent;

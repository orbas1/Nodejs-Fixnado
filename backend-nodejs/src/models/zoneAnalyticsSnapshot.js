import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ZoneAnalyticsSnapshot extends Model {}

ZoneAnalyticsSnapshot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    zoneId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    capturedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    bookingTotals: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    slaBreaches: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    averageAcceptanceMinutes: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ZoneAnalyticsSnapshot',
    indexes: [
      {
        fields: ['zone_id', 'captured_at']
      }
    ]
  }
);

export default ZoneAnalyticsSnapshot;

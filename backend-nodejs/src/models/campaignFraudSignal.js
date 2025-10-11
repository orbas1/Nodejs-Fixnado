import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CampaignFraudSignal extends Model {}

CampaignFraudSignal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaignId: {
      field: 'campaign_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    flightId: {
      field: 'flight_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    metricDate: {
      field: 'metric_date',
      type: DataTypes.DATE,
      allowNull: true
    },
    signalType: {
      field: 'signal_type',
      type: DataTypes.ENUM('overspend', 'underspend', 'suspicious_ctr', 'suspicious_cvr', 'no_spend', 'delivery_gap'),
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'critical'),
      allowNull: false,
      defaultValue: 'warning'
    },
    detectedAt: {
      field: 'detected_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    resolvedAt: {
      field: 'resolved_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    resolutionNote: {
      field: 'resolution_note',
      type: DataTypes.TEXT,
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
    modelName: 'CampaignFraudSignal',
    tableName: 'CampaignFraudSignal'
  }
);

export default CampaignFraudSignal;

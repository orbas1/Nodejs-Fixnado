import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class DisputeHealthBucket extends Model {}

DisputeHealthBucket.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    cadence: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    windowDurationHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'window_duration_hours'
    },
    ownerName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'owner_name'
    },
    ownerRole: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'owner_role'
    },
    escalationContact: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'escalation_contact'
    },
    playbookUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'playbook_url'
    },
    heroImageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'hero_image_url'
    },
    checklist: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('on_track', 'monitor', 'at_risk'),
      allowNull: false,
      defaultValue: 'on_track'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'archived_at'
    }
  },
  {
    sequelize,
    modelName: 'DisputeHealthBucket',
    tableName: 'dispute_health_buckets',
    underscored: true
  }
);

export default DisputeHealthBucket;

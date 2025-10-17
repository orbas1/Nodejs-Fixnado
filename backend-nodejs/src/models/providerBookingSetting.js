import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderBookingSetting extends Model {}

ProviderBookingSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'company_id'
    },
    dispatchStrategy: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'round_robin',
      field: 'dispatch_strategy'
    },
    autoAssignEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'auto_assign_enabled'
    },
    defaultSlaHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      field: 'default_sla_hours'
    },
    allowCustomerEdits: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'allow_customer_edits'
    },
    intakeChannels: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'intake_channels'
    },
    escalationContacts: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'escalation_contacts'
    },
    dispatchPlaybooks: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'dispatch_playbooks'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    notesTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes_template'
    }
  },
  {
    sequelize,
    modelName: 'ProviderBookingSetting',
    tableName: 'ProviderBookingSetting',
    underscored: true
  }
);

export default ProviderBookingSetting;

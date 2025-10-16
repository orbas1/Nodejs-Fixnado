import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CommunicationsEscalationRule extends Model {}

CommunicationsEscalationRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    configurationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'configuration_id'
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    triggerType: {
      type: DataTypes.ENUM('keyword', 'inactivity', 'sentiment', 'manual'),
      allowNull: false,
      defaultValue: 'keyword',
      field: 'trigger_type'
    },
    triggerMetadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      field: 'trigger_metadata'
    },
    targetType: {
      type: DataTypes.ENUM('user', 'team', 'email', 'webhook'),
      allowNull: false,
      defaultValue: 'user',
      field: 'target_type'
    },
    targetReference: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'target_reference'
    },
    targetLabel: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'target_label'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    slaMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      field: 'sla_minutes'
    },
    allowedRoles: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'allowed_roles'
    },
    responseTemplate: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'response_template'
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'CommunicationsEscalationRule',
    tableName: 'CommunicationsEscalationRule'
  }
);

export default CommunicationsEscalationRule;

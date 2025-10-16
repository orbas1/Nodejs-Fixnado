import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InboxQueue extends Model {}

InboxQueue.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(140),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    slaMinutes: {
      field: 'sla_minutes',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15
    },
    escalationMinutes: {
      field: 'escalation_minutes',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45
    },
    allowedRoles: {
      field: 'allowed_roles',
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['support']
    },
    autoResponderEnabled: {
      field: 'auto_responder_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    triageFormUrl: {
      field: 'triage_form_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    channels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['in-app']
    },
    accentColor: {
      field: 'accent_color',
      type: DataTypes.STRING(9),
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'InboxQueue',
    tableName: 'InboxQueue'
  }
);

export default InboxQueue;

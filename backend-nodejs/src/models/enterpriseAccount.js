import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseAccount extends Model {}

EnterpriseAccount.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active'
    },
    priority: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'standard'
    },
    accountManager: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    supportEmail: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    billingEmail: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    supportPhone: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    logoUrl: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    heroImageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    escalationNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'EnterpriseAccount',
    indexes: [
      {
        fields: ['slug'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['archived_at']
      }
    ]
  }
);

export default EnterpriseAccount;

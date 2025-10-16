import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseStakeholder extends Model {}

EnterpriseStakeholder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    enterpriseAccountId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    escalationLevel: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    avatarUrl: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    notes: {
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
    }
  },
  {
    sequelize,
    modelName: 'EnterpriseStakeholder',
    indexes: [
      {
        fields: ['enterprise_account_id']
      },
      {
        fields: ['role']
      },
      {
        fields: ['is_primary']
      }
    ]
  }
);

export default EnterpriseStakeholder;

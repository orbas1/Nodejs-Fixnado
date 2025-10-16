import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterprisePlaybook extends Model {}

EnterprisePlaybook.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'draft'
    },
    documentUrl: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastReviewedAt: {
      type: DataTypes.DATE,
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
    modelName: 'EnterprisePlaybook',
    indexes: [
      {
        fields: ['enterprise_account_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['owner']
      }
    ]
  }
);

export default EnterprisePlaybook;

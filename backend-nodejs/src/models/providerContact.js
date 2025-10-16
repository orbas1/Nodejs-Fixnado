import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderContact extends Model {}

ProviderContact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('owner', 'operations', 'finance', 'compliance', 'support', 'sales', 'other'),
      allowNull: false,
      defaultValue: 'operations'
    },
    isPrimary: {
      field: 'is_primary',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatarUrl: {
      field: 'avatar_url',
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ProviderContact',
    tableName: 'ProviderContact',
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['type']
      }
    ]
  }
);

export default ProviderContact;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseSite extends Model {}

EnterpriseSite.init(
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
    code: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'operational'
    },
    addressLine1: {
      type: DataTypes.STRING(180),
      allowNull: true
    },
    addressLine2: {
      type: DataTypes.STRING(180),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING(24),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    contactName: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    contactPhone: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    capacityNotes: {
      type: DataTypes.STRING(240),
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    mapUrl: {
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
    modelName: 'EnterpriseSite',
    indexes: [
      {
        fields: ['enterprise_account_id']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['enterprise_account_id', 'code']
      }
    ]
  }
);

export default EnterpriseSite;

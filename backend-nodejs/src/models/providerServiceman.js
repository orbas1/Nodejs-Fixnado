import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderServiceman extends Model {}

ProviderServiceman.init(
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
      type: DataTypes.STRING(160),
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
    status: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'active'
    },
    availabilityStatus: {
      field: 'availability_status',
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'available'
    },
    availabilityPercentage: {
      field: 'availability_percentage',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    hourlyRate: {
      field: 'hourly_rate',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    avatarUrl: {
      field: 'avatar_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    certifications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderServiceman',
    tableName: 'ProviderServicemen',
    underscored: true
  }
);

export default ProviderServiceman;

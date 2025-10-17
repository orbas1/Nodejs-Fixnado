import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanIdentity extends Model {}

ServicemanIdentity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_review', 'approved', 'rejected', 'suspended', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    riskRating: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    verificationLevel: {
      type: DataTypes.ENUM('standard', 'enhanced', 'expedited'),
      allowNull: false,
      defaultValue: 'standard'
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    requestedAt: { type: DataTypes.DATE, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  },
  {
    sequelize,
    modelName: 'ServicemanIdentity',
    tableName: 'ServicemanIdentity'
  }
);

export default ServicemanIdentity;

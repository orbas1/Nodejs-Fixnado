import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanIdentityDocument extends Model {}

ServicemanIdentityDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    identityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    documentType: {
      type: DataTypes.ENUM(
        'passport',
        'driving_license',
        'work_permit',
        'national_id',
        'insurance_certificate',
        'other'
      ),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_review', 'approved', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    documentNumber: { type: DataTypes.STRING, allowNull: true },
    issuingCountry: { type: DataTypes.STRING, allowNull: true },
    issuedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    fileUrl: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true }
  },
  {
    sequelize,
    modelName: 'ServicemanIdentityDocument',
    tableName: 'ServicemanIdentityDocument'
  }
);

export default ServicemanIdentityDocument;

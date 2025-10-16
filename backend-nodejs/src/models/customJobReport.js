import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CustomJobReport extends Model {}

CustomJobReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    metrics: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'CustomJobReport',
    tableName: 'CustomJobReport',
    underscored: true
  }
);

export default CustomJobReport;

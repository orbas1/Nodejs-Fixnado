import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RentalTaxonomyAssignment extends Model {}

RentalTaxonomyAssignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rentalAssetId: {
      field: 'rental_asset_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    nodeId: {
      field: 'node_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    isPrimary: {
      field: 'is_primary',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'RentalTaxonomyAssignment',
    tableName: 'rental_taxonomy_assignments',
    underscored: true
  }
);

export default RentalTaxonomyAssignment;

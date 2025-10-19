import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MarketplaceTaxonomyFacet extends Model {}

MarketplaceTaxonomyFacet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    domainId: {
      field: 'domain_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    label: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dataType: {
      field: 'data_type',
      type: DataTypes.ENUM('string', 'integer', 'decimal', 'boolean', 'enum', 'multi_select'),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    isRequired: {
      field: 'is_required',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isFilterable: {
      field: 'is_filterable',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isSearchable: {
      field: 'is_searchable',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'MarketplaceTaxonomyFacet',
    tableName: 'marketplace_taxonomy_facets',
    underscored: true
  }
);

export default MarketplaceTaxonomyFacet;

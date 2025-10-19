import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MarketplaceTaxonomyNodeFacet extends Model {}

MarketplaceTaxonomyNodeFacet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nodeId: {
      field: 'node_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    facetId: {
      field: 'facet_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    defaultValue: {
      field: 'default_value',
      type: DataTypes.JSONB,
      allowNull: true
    },
    constraints: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'MarketplaceTaxonomyNodeFacet',
    tableName: 'marketplace_taxonomy_node_facets',
    underscored: true
  }
);

export default MarketplaceTaxonomyNodeFacet;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MarketplaceTaxonomyNode extends Model {}

MarketplaceTaxonomyNode.init(
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
    parentId: {
      field: 'parent_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    lineage: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    searchKeywords: {
      field: 'search_keywords',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    synonyms: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    filters: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    commercialTags: {
      field: 'commercial_tags',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    regulatoryNotes: {
      field: 'regulatory_notes',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    sortOrder: {
      field: 'sort_order',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
      field: 'is_active',
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
    modelName: 'MarketplaceTaxonomyNode',
    tableName: 'marketplace_taxonomy_nodes',
    underscored: true
  }
);

export default MarketplaceTaxonomyNode;

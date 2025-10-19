import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MarketplaceTaxonomyDomain extends Model {}

MarketplaceTaxonomyDomain.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    label: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    steward: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    revision: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'MarketplaceTaxonomyDomain',
    tableName: 'marketplace_taxonomy_domains',
    underscored: true
  }
);

export default MarketplaceTaxonomyDomain;

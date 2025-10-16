import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogTag extends Model {}

BlogTag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metaTitle: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'meta_title'
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'meta_description'
    },
    metaKeywords: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'meta_keywords'
    },
    canonicalUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'canonical_url'
    },
    ogImageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'og_image_url'
    },
    ogImageAlt: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'og_image_alt'
    },
    noindex: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    structuredData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      field: 'structured_data'
    },
    synonyms: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    roleAccess: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['admin'],
      field: 'role_access'
    },
    ownerRole: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'admin',
      field: 'owner_role'
    }
  },
  {
    sequelize,
    modelName: 'BlogTag',
    tableName: 'blog_tags',
    indexes: [{ fields: ['slug'], unique: true }]
  }
);

export default BlogTag;

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogPostRevision extends Model {}

BlogPostRevision.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'post_id'
    },
    recordedById: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'recorded_by_id'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'published', 'archived'),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  },
  {
    sequelize,
    modelName: 'BlogPostRevision',
    tableName: 'blog_post_revisions',
    timestamps: false
  }
);

export default BlogPostRevision;

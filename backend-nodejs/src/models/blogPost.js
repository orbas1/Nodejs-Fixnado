import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogPost extends Model {}

BlogPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    heroImageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    heroImageAlt: {
      type: DataTypes.STRING,
      allowNull: true
    },
    readingTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'BlogPost',
    tableName: 'blog_posts',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
      { fields: ['publishedAt'] }
    ]
  }
);

export default BlogPost;

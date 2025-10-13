import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Post extends Model {}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    budget: DataTypes.STRING,
    budgetAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    budgetCurrency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GBP'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categoryOther: {
      type: DataTypes.STRING,
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    location: DataTypes.STRING,
    zoneId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    allowOutOfZone: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    bidDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('open', 'assigned', 'completed'),
      defaultValue: 'open'
    }
  },
  {
    sequelize,
    modelName: 'Post'
  }
);

export default Post;

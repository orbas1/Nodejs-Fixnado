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
    location: DataTypes.STRING,
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

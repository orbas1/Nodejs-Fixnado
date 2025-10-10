import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MarketplaceItem extends Model {}

MarketplaceItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    pricePerDay: DataTypes.DECIMAL,
    purchasePrice: DataTypes.DECIMAL,
    location: DataTypes.STRING,
    availability: {
      type: DataTypes.ENUM('rent', 'buy', 'both'),
      defaultValue: 'rent'
    }
  },
  {
    sequelize,
    modelName: 'MarketplaceItem'
  }
);

export default MarketplaceItem;

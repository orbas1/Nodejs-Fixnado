import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Escrow extends Model {}

Escrow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    fundedAt: DataTypes.DATE,
    releasedAt: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('pending', 'funded', 'released', 'disputed'),
      defaultValue: 'pending'
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'region_id'
    }
  },
  {
    sequelize,
    modelName: 'Escrow'
  }
);

export default Escrow;

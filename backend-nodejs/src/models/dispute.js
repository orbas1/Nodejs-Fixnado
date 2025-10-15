import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Dispute extends Model {}

Dispute.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    escrowId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    openedBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    reason: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('open', 'under_review', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    resolution: DataTypes.TEXT,
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'region_id'
    }
  },
  {
    sequelize,
    modelName: 'Dispute'
  }
);

export default Dispute;

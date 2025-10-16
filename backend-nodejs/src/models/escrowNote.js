import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EscrowNote extends Model {}

EscrowNote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    escrowId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'escrow_id'
    },
    authorId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'author_id'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    pinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'EscrowNote'
  }
);

export default EscrowNote;

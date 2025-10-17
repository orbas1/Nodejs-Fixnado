import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BookingNote extends Model {}

BookingNote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id'
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'author_id'
    },
    authorType: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'author_type'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_pinned'
    }
  },
  {
    sequelize,
    modelName: 'BookingNote',
    tableName: 'booking_notes',
    underscored: true
  }
);

export default BookingNote;

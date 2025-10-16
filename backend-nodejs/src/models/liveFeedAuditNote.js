import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class LiveFeedAuditNote extends Model {}

LiveFeedAuditNote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    auditId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'audit_id'
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'author_id'
    },
    authorRole: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'author_role'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    modelName: 'LiveFeedAuditNote',
    tableName: 'live_feed_audit_notes',
    underscored: true
  }
);

export default LiveFeedAuditNote;

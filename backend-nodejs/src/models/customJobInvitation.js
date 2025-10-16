import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const INVITATION_STATUSES = ['pending', 'accepted', 'declined', 'cancelled'];
const INVITATION_TARGETS = ['provider', 'serviceman', 'user'];

class CustomJobInvitation extends Model {}

CustomJobInvitation.init(
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
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by'
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'target_id'
    },
    targetType: {
      type: DataTypes.ENUM(...INVITATION_TARGETS),
      allowNull: false,
      field: 'target_type'
    },
    targetHandle: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'target_handle'
    },
    targetEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'target_email'
    },
    status: {
      type: DataTypes.ENUM(...INVITATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending'
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'responded_at'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'CustomJobInvitation',
    tableName: 'CustomJobInvitation',
    underscored: true
  }
);

export { INVITATION_STATUSES, INVITATION_TARGETS };
export default CustomJobInvitation;

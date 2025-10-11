import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CampaignTargetingRule extends Model {}

CampaignTargetingRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaignId: {
      field: 'campaign_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    ruleType: {
      field: 'rule_type',
      type: DataTypes.ENUM('zone', 'category', 'language', 'device', 'audience', 'schedule', 'insured_only', 'keyword'),
      allowNull: false
    },
    operator: {
      type: DataTypes.ENUM('include', 'exclude'),
      allowNull: false,
      defaultValue: 'include'
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'CampaignTargetingRule',
    tableName: 'CampaignTargetingRule'
  }
);

export default CampaignTargetingRule;

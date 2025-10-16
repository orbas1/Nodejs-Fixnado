export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.addColumn('AdCampaign', 'network', {
    type: Sequelize.STRING(40),
    allowNull: false,
    defaultValue: 'fixnado'
  });

  await queryInterface.addIndex('AdCampaign', ['network'], {
    name: 'ad_campaign_network'
  });

  await queryInterface.createTable('CampaignCreative', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    campaign_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AdCampaign', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('draft', 'in_review', 'active', 'paused', 'retired'),
      allowNull: false,
      defaultValue: 'draft'
    },
    format: {
      type: Sequelize.ENUM('image', 'video', 'carousel', 'html', 'native'),
      allowNull: false,
      defaultValue: 'image'
    },
    headline: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    call_to_action: {
      type: Sequelize.STRING(60),
      allowNull: true
    },
    asset_url: {
      type: Sequelize.STRING(2048),
      allowNull: false
    },
    thumbnail_url: {
      type: Sequelize.STRING(2048),
      allowNull: true
    },
    review_status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    rejection_reason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('CampaignCreative', ['campaign_id'], {
    name: 'campaign_creative_campaign'
  });
  await queryInterface.addIndex('CampaignCreative', ['status'], {
    name: 'campaign_creative_status'
  });
  await queryInterface.addIndex('CampaignCreative', ['format'], {
    name: 'campaign_creative_format'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('CampaignCreative', 'campaign_creative_format');
  await queryInterface.removeIndex('CampaignCreative', 'campaign_creative_status');
  await queryInterface.removeIndex('CampaignCreative', 'campaign_creative_campaign');
  await queryInterface.dropTable('CampaignCreative');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CampaignCreative_status";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CampaignCreative_format";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CampaignCreative_review_status";');

  await queryInterface.removeIndex('AdCampaign', 'ad_campaign_network');
  await queryInterface.removeColumn('AdCampaign', 'network');
}

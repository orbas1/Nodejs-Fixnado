export async function up({ context: queryInterface, Sequelize }) {
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
    flight_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'CampaignFlight', key: 'id' },
      onDelete: 'SET NULL'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    format: {
      type: Sequelize.ENUM('image', 'video', 'html', 'text', 'carousel'),
      allowNull: false,
      defaultValue: 'image'
    },
    status: {
      type: Sequelize.ENUM('draft', 'review', 'active', 'paused', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    headline: {
      type: Sequelize.STRING(180),
      allowNull: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    call_to_action: {
      type: Sequelize.STRING(64),
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

  await queryInterface.addIndex('CampaignCreative', ['campaign_id', 'status'], {
    name: 'campaign_creative_campaign_status'
  });
  await queryInterface.addIndex('CampaignCreative', ['flight_id'], {
    name: 'campaign_creative_flight'
  });

  await queryInterface.createTable('CampaignAudienceSegment', {
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
    segment_type: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'custom'
    },
    status: {
      type: Sequelize.ENUM('draft', 'active', 'paused', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    size_estimate: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    engagement_rate: {
      type: Sequelize.DECIMAL(9, 6),
      allowNull: true
    },
    synced_at: {
      type: Sequelize.DATE,
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

  await queryInterface.addIndex('CampaignAudienceSegment', ['campaign_id', 'status'], {
    name: 'campaign_audience_campaign_status'
  });
  await queryInterface.addIndex('CampaignAudienceSegment', ['segment_type'], {
    name: 'campaign_audience_type'
  });

  await queryInterface.createTable('CampaignPlacement', {
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
    flight_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'CampaignFlight', key: 'id' },
      onDelete: 'SET NULL'
    },
    channel: {
      type: Sequelize.ENUM('marketplace', 'email', 'push', 'sms', 'display', 'social'),
      allowNull: false,
      defaultValue: 'marketplace'
    },
    format: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'native'
    },
    status: {
      type: Sequelize.ENUM('planned', 'active', 'paused', 'completed'),
      allowNull: false,
      defaultValue: 'planned'
    },
    bid_amount: {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: true
    },
    bid_currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    cpm: {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: true
    },
    inventory_source: {
      type: Sequelize.STRING(160),
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

  await queryInterface.addIndex('CampaignPlacement', ['campaign_id', 'status'], {
    name: 'campaign_placement_campaign_status'
  });
  await queryInterface.addIndex('CampaignPlacement', ['channel'], {
    name: 'campaign_placement_channel'
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.dropTable('CampaignPlacement');
  await queryInterface.dropTable('CampaignAudienceSegment');
  await queryInterface.dropTable('CampaignCreative');

  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_CampaignCreative_format\";\");
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_CampaignCreative_status\";\");
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_CampaignAudienceSegment_status\";\");
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_CampaignPlacement_channel\";\");
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_CampaignPlacement_status\";\");
}

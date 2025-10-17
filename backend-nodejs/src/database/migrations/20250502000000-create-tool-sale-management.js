export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('ToolSaleProfile', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    inventory_item_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'InventoryItem', key: 'id' },
      onDelete: 'SET NULL'
    },
    marketplace_item_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'MarketplaceItem', key: 'id' },
      onDelete: 'SET NULL'
    },
    tagline: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    short_description: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    long_description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    hero_image_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    showcase_video_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    gallery_images: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    tags: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    keyword_tags: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    settings: {
      type: Sequelize.JSONB,
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

  await queryInterface.addIndex('ToolSaleProfile', ['company_id'], {
    name: 'tool_sale_profile_company'
  });

  await queryInterface.createTable('ToolSaleCoupon', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    tool_sale_profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'ToolSaleProfile', key: 'id' },
      onDelete: 'CASCADE'
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    code: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    discount_type: {
      type: Sequelize.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage'
    },
    discount_value: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: Sequelize.STRING(12),
      allowNull: true
    },
    min_order_total: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    },
    starts_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    max_redemptions: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    max_redemptions_per_customer: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    auto_apply: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: Sequelize.ENUM('draft', 'scheduled', 'active', 'expired', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    image_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    terms_url: {
      type: Sequelize.STRING(512),
      allowNull: true
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

  await queryInterface.addIndex('ToolSaleCoupon', ['tool_sale_profile_id'], {
    name: 'tool_sale_coupon_profile'
  });
  await queryInterface.addIndex('ToolSaleCoupon', ['company_id', 'code'], {
    name: 'tool_sale_coupon_company_code',
    unique: true
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('ToolSaleCoupon', 'tool_sale_coupon_company_code');
  await queryInterface.removeIndex('ToolSaleCoupon', 'tool_sale_coupon_profile');
  await queryInterface.dropTable('ToolSaleCoupon');
  await queryInterface.removeIndex('ToolSaleProfile', 'tool_sale_profile_company');
  await queryInterface.dropTable('ToolSaleProfile');
}

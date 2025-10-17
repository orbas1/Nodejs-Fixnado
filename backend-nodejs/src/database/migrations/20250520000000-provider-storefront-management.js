const STOREFRONT_STATUS_ENUM = 'enum_provider_storefronts_status';
const INVENTORY_VISIBILITY_ENUM = 'enum_provider_storefront_inventory_visibility';
const COUPON_STATUS_ENUM = 'enum_provider_storefront_coupons_status';
const COUPON_DISCOUNT_ENUM = 'enum_provider_storefront_coupons_discount_type';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('provider_storefronts', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    slug: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    tagline: {
      type: Sequelize.STRING(200),
      allowNull: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    hero_image_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    contact_email: {
      type: Sequelize.STRING(180),
      allowNull: true
    },
    contact_phone: {
      type: Sequelize.STRING(40),
      allowNull: true
    },
    primary_color: {
      type: Sequelize.STRING(16),
      allowNull: true
    },
    accent_color: {
      type: Sequelize.STRING(16),
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('draft', 'live', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    is_published: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    published_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    review_required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
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

  await queryInterface.addConstraint('provider_storefronts', {
    fields: ['company_id'],
    type: 'unique',
    name: 'uniq_provider_storefronts_company'
  });

  await queryInterface.addIndex('provider_storefronts', ['slug'], {
    unique: true,
    name: 'uniq_provider_storefronts_slug'
  });

  await queryInterface.createTable('provider_storefront_inventory', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    storefront_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'provider_storefronts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    sku: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    summary: {
      type: Sequelize.STRING(240),
      allowNull: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    price_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    price_currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    stock_on_hand: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reorder_point: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    restock_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    visibility: {
      type: Sequelize.ENUM('public', 'private', 'archived'),
      allowNull: false,
      defaultValue: 'public'
    },
    featured: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    image_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    metadata: {
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

  await queryInterface.addIndex('provider_storefront_inventory', ['storefront_id']);
  await queryInterface.addIndex('provider_storefront_inventory', ['sku']);

  await queryInterface.createTable('provider_storefront_coupons', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    storefront_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'provider_storefronts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    code: {
      type: Sequelize.STRING(40),
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(160),
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
      type: Sequelize.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0
    },
    min_order_total: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    max_discount_value: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    starts_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    ends_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    usage_limit: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    usage_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: Sequelize.ENUM('draft', 'scheduled', 'active', 'expired', 'disabled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    applies_to: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    metadata: {
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

  await queryInterface.addConstraint('provider_storefront_coupons', {
    fields: ['storefront_id', 'code'],
    type: 'unique',
    name: 'uniq_provider_storefront_coupons_code'
  });

  await queryInterface.addIndex('provider_storefront_coupons', ['status']);

}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('provider_storefront_coupons');
  await queryInterface.dropTable('provider_storefront_inventory');
  await queryInterface.dropTable('provider_storefronts');

  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${COUPON_STATUS_ENUM}";`);
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${COUPON_DISCOUNT_ENUM}";`);
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${INVENTORY_VISIBILITY_ENUM}";`);
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${STOREFRONT_STATUS_ENUM}";`);
}

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('User', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('(UUID())'),
      primaryKey: true
    },
    first_name: { type: Sequelize.STRING, allowNull: false },
    last_name: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password_hash: { type: Sequelize.STRING, allowNull: false },
    address: { type: Sequelize.STRING },
    age: { type: Sequelize.INTEGER },
    type: { type: Sequelize.ENUM('user', 'company', 'servicemen'), allowNull: false },
    two_factor_email: { type: Sequelize.BOOLEAN, defaultValue: false },
    two_factor_app: { type: Sequelize.BOOLEAN, defaultValue: false },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('Company', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    legal_structure: { type: Sequelize.STRING, allowNull: false },
    contact_name: { type: Sequelize.STRING },
    contact_email: { type: Sequelize.STRING },
    service_regions: { type: Sequelize.TEXT },
    marketplace_intent: { type: Sequelize.TEXT },
    verified: { type: Sequelize.BOOLEAN, defaultValue: false },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('Service', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    company_id: {
      type: Sequelize.UUID,
      references: { model: 'Company', key: 'id' },
      onDelete: 'SET NULL'
    },
    provider_id: {
      type: Sequelize.UUID,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    title: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.TEXT },
    category: { type: Sequelize.STRING },
    price: { type: Sequelize.DECIMAL(10, 2) },
    currency: { type: Sequelize.STRING, defaultValue: 'USD' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('Post', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    title: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.TEXT },
    budget: { type: Sequelize.STRING },
    location: { type: Sequelize.STRING },
    status: { type: Sequelize.ENUM('open', 'assigned', 'completed'), defaultValue: 'open' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('MarketplaceItem', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    title: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.TEXT },
    price_per_day: { type: Sequelize.DECIMAL(10, 2) },
    purchase_price: { type: Sequelize.DECIMAL(10, 2) },
    location: { type: Sequelize.STRING },
    availability: { type: Sequelize.ENUM('rent', 'buy', 'both'), defaultValue: 'rent' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('ServiceZone', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: { type: Sequelize.STRING, allowNull: false },
    geo_json: { type: Sequelize.JSON },
    demand_level: { type: Sequelize.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('Order', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    buyer_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    service_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Service', key: 'id' },
      onDelete: 'CASCADE'
    },
    status: {
      type: Sequelize.ENUM('draft', 'funded', 'in_progress', 'completed', 'disputed'),
      defaultValue: 'draft'
    },
    total_amount: { type: Sequelize.DECIMAL(10, 2) },
    currency: { type: Sequelize.STRING, defaultValue: 'USD' },
    scheduled_for: { type: Sequelize.DATE },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('Escrow', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    order_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Order', key: 'id' },
      onDelete: 'CASCADE'
    },
    funded_at: { type: Sequelize.DATE },
    released_at: { type: Sequelize.DATE },
    status: { type: Sequelize.ENUM('pending', 'funded', 'released', 'disputed'), defaultValue: 'pending' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });

  await queryInterface.createTable('Dispute', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
    escrow_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Escrow', key: 'id' },
      onDelete: 'CASCADE'
    },
    opened_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    reason: { type: Sequelize.TEXT },
    status: { type: Sequelize.ENUM('open', 'under_review', 'resolved', 'closed'), defaultValue: 'open' },
    resolution: { type: Sequelize.TEXT },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('Dispute');
  await queryInterface.dropTable('Escrow');
  await queryInterface.dropTable('Order');
  await queryInterface.dropTable('ServiceZone');
  await queryInterface.dropTable('MarketplaceItem');
  await queryInterface.dropTable('Post');
  await queryInterface.dropTable('Service');
  await queryInterface.dropTable('Company');
  await queryInterface.dropTable('User');
}

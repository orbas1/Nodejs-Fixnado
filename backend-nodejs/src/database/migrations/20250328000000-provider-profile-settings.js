import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.addColumn('ProviderProfile', 'tagline', {
    type: DataTypes.STRING(160),
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'mission_statement', {
    type: DataTypes.TEXT,
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'brand_primary_color', {
    type: DataTypes.STRING(32),
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'brand_secondary_color', {
    type: DataTypes.STRING(32),
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'brand_font', {
    type: DataTypes.STRING(80),
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'support_hours', {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  });
  await queryInterface.addColumn('ProviderProfile', 'social_links', {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  });
  await queryInterface.addColumn('ProviderProfile', 'media_gallery', {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  });
  await queryInterface.addColumn('ProviderProfile', 'dispatch_radius_km', {
    type: DataTypes.INTEGER,
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'preferred_response_minutes', {
    type: DataTypes.INTEGER,
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'billing_email', {
    type: DataTypes.STRING(180),
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'billing_phone', {
    type: DataTypes.STRING(40),
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'operations_playbook_url', {
    type: DataTypes.STRING(255),
    allowNull: true
  });
  await queryInterface.addColumn('ProviderProfile', 'insurance_policy_url', {
    type: DataTypes.STRING(255),
    allowNull: true
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('ProviderProfile', 'insurance_policy_url');
  await queryInterface.removeColumn('ProviderProfile', 'operations_playbook_url');
  await queryInterface.removeColumn('ProviderProfile', 'billing_phone');
  await queryInterface.removeColumn('ProviderProfile', 'billing_email');
  await queryInterface.removeColumn('ProviderProfile', 'preferred_response_minutes');
  await queryInterface.removeColumn('ProviderProfile', 'dispatch_radius_km');
  await queryInterface.removeColumn('ProviderProfile', 'media_gallery');
  await queryInterface.removeColumn('ProviderProfile', 'social_links');
  await queryInterface.removeColumn('ProviderProfile', 'support_hours');
  await queryInterface.removeColumn('ProviderProfile', 'brand_font');
  await queryInterface.removeColumn('ProviderProfile', 'brand_secondary_color');
  await queryInterface.removeColumn('ProviderProfile', 'brand_primary_color');
  await queryInterface.removeColumn('ProviderProfile', 'mission_statement');
  await queryInterface.removeColumn('ProviderProfile', 'tagline');
}

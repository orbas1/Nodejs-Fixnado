import { DataTypes } from 'sequelize';

const COLUMNS = [
  ['zone_label_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['zone_code_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['service_catalogues_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['onsite_contact_name_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['onsite_contact_phone_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['onsite_contact_email_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['access_window_start_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['access_window_end_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['parking_information_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['loading_dock_details_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['security_notes_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['floor_level_encrypted', { type: DataTypes.TEXT, allowNull: true }],
  ['map_image_url_encrypted', { type: DataTypes.TEXT, allowNull: true }]
];

export async function up({ context: queryInterface }) {
  await Promise.all(
    COLUMNS.map(([name, definition]) => queryInterface.addColumn('customer_locations', name, definition))
  );
}

export async function down({ context: queryInterface }) {
  await Promise.all(COLUMNS.map(([name]) => queryInterface.removeColumn('customer_locations', name)));
}

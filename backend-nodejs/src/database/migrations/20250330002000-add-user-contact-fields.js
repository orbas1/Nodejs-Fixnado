export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.addColumn('User', 'phone_number_encrypted', {
    type: Sequelize.TEXT,
    allowNull: true
  });
  await queryInterface.addColumn('User', 'profile_image_url', {
    type: Sequelize.STRING(2048),
    allowNull: true
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('User', 'profile_image_url');
  await queryInterface.removeColumn('User', 'phone_number_encrypted');
}

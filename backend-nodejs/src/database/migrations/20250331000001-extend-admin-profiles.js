export async function up({ context: queryInterface, Sequelize }) {
  await Promise.all([
    queryInterface.addColumn('AdminProfile', 'escalation_contacts', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    }),
    queryInterface.addColumn('AdminProfile', 'out_of_office', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    }),
    queryInterface.addColumn('AdminProfile', 'resource_links', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    })
  ]);
}

export async function down({ context: queryInterface }) {
  await Promise.all([
    queryInterface.removeColumn('AdminProfile', 'escalation_contacts'),
    queryInterface.removeColumn('AdminProfile', 'out_of_office'),
    queryInterface.removeColumn('AdminProfile', 'resource_links')
  ]);
}

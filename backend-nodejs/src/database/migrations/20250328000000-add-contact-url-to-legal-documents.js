export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.addColumn('LegalDocuments', 'contact_url', {
    type: Sequelize.TEXT,
    allowNull: true
  });

  await queryInterface.sequelize.transaction(async (transaction) => {
    const [documents] = await queryInterface.sequelize.query(
      "SELECT id, slug FROM \"LegalDocuments\"",
      { transaction }
    );

    const updates = documents.map((doc) => {
      const fallbackUrl = `https://fixnado.com/legal/${doc.slug}`;
      return queryInterface.bulkUpdate(
        'LegalDocuments',
        { contact_url: fallbackUrl },
        { id: doc.id, contact_url: null },
        { transaction }
      );
    });

    await Promise.all(updates);
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('LegalDocuments', 'contact_url');
}

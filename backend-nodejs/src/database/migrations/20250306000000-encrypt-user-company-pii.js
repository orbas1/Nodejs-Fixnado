import {
  decryptString,
  encryptString,
  normaliseEmail,
  protectEmail,
  stableHash
} from '../../utils/security/fieldEncryption.js';

function mapUserRows(rows) {
  return rows.map((row) => {
    const firstName = typeof row.first_name === 'string' ? row.first_name.trim() : '';
    const lastName = typeof row.last_name === 'string' ? row.last_name.trim() : '';
    const address = typeof row.address === 'string' ? row.address.trim() : '';
    if (!firstName || !lastName) {
      throw new Error(`User ${row.id} is missing required name fields for encryption.`);
    }

    const { encrypted, hash } = protectEmail(row.email);
    return {
      id: row.id,
      firstName: encryptString(firstName, 'user:firstName'),
      lastName: encryptString(lastName, 'user:lastName'),
      email: encrypted,
      emailHash: hash,
      address: address ? encryptString(address, 'user:address') : null
    };
  });
}

function mapCompanyRows(rows) {
  return rows.map((row) => {
    const contactName = typeof row.contact_name === 'string' ? row.contact_name.trim() : '';
    const contactEmail = typeof row.contact_email === 'string' ? row.contact_email.trim() : '';
    return {
      id: row.id,
      contactName: contactName ? encryptString(contactName, 'company:contactName') : null,
      contactEmail: contactEmail ? encryptString(contactEmail, 'company:contactEmail') : null,
      contactEmailHash: contactEmail
        ? stableHash(normaliseEmail(contactEmail), 'company:contactEmail')
        : null
    };
  });
}

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn(
      'User',
      'first_name_encrypted',
      { type: Sequelize.TEXT },
      { transaction }
    );
    await queryInterface.addColumn(
      'User',
      'last_name_encrypted',
      { type: Sequelize.TEXT },
      { transaction }
    );
    await queryInterface.addColumn(
      'User',
      'email_encrypted',
      { type: Sequelize.TEXT },
      { transaction }
    );
    await queryInterface.addColumn(
      'User',
      'email_hash',
      { type: Sequelize.STRING(128) },
      { transaction }
    );
    await queryInterface.addColumn(
      'User',
      'address_encrypted',
      { type: Sequelize.TEXT },
      { transaction }
    );

    const [users] = await queryInterface.sequelize.query(
      'SELECT id, first_name, last_name, email, address FROM "User"',
      { transaction }
    );
    const encryptedUsers = mapUserRows(users);

    for (const user of encryptedUsers) {
      await queryInterface.sequelize.query(
        `UPDATE "User"
           SET first_name_encrypted = :firstName,
               last_name_encrypted = :lastName,
               email_encrypted = :email,
               email_hash = :emailHash,
               address_encrypted = :address
         WHERE id = :id`,
        {
          transaction,
          replacements: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailHash: user.emailHash,
            address: user.address
          }
        }
      );
    }

    await queryInterface.removeColumn('User', 'first_name', { transaction });
    await queryInterface.removeColumn('User', 'last_name', { transaction });
    await queryInterface.removeColumn('User', 'email', { transaction });
    await queryInterface.removeColumn('User', 'address', { transaction });

    await queryInterface.changeColumn(
      'User',
      'first_name_encrypted',
      { type: Sequelize.TEXT, allowNull: false },
      { transaction }
    );
    await queryInterface.changeColumn(
      'User',
      'last_name_encrypted',
      { type: Sequelize.TEXT, allowNull: false },
      { transaction }
    );
    await queryInterface.changeColumn(
      'User',
      'email_encrypted',
      { type: Sequelize.TEXT, allowNull: false },
      { transaction }
    );
    await queryInterface.changeColumn(
      'User',
      'email_hash',
      { type: Sequelize.STRING(128), allowNull: false },
      { transaction }
    );

    await queryInterface.addIndex('User', ['email_hash'], {
      unique: true,
      name: 'user_email_hash_unique',
      transaction
    });

    await queryInterface.addColumn(
      'Company',
      'contact_name_encrypted',
      { type: Sequelize.TEXT },
      { transaction }
    );
    await queryInterface.addColumn(
      'Company',
      'contact_email_encrypted',
      { type: Sequelize.TEXT },
      { transaction }
    );
    await queryInterface.addColumn(
      'Company',
      'contact_email_hash',
      { type: Sequelize.STRING(128) },
      { transaction }
    );

    const [companies] = await queryInterface.sequelize.query(
      'SELECT id, contact_name, contact_email FROM "Company"',
      { transaction }
    );
    const encryptedCompanies = mapCompanyRows(companies);

    for (const company of encryptedCompanies) {
      await queryInterface.sequelize.query(
        `UPDATE "Company"
           SET contact_name_encrypted = :contactName,
               contact_email_encrypted = :contactEmail,
               contact_email_hash = :contactEmailHash
         WHERE id = :id`,
        {
          transaction,
          replacements: {
            id: company.id,
            contactName: company.contactName,
            contactEmail: company.contactEmail,
            contactEmailHash: company.contactEmailHash
          }
        }
      );
    }

    await queryInterface.removeColumn('Company', 'contact_name', { transaction });
    await queryInterface.removeColumn('Company', 'contact_email', { transaction });

    await queryInterface.changeColumn(
      'Company',
      'contact_name_encrypted',
      { type: Sequelize.TEXT, allowNull: true },
      { transaction }
    );
    await queryInterface.changeColumn(
      'Company',
      'contact_email_encrypted',
      { type: Sequelize.TEXT, allowNull: true },
      { transaction }
    );
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn(
      'User',
      'first_name',
      { type: Sequelize.STRING, allowNull: false },
      { transaction }
    );
    await queryInterface.addColumn(
      'User',
      'last_name',
      { type: Sequelize.STRING, allowNull: false },
      { transaction }
    );
    await queryInterface.addColumn(
      'User',
      'email',
      { type: Sequelize.STRING, allowNull: false },
      { transaction }
    );
    await queryInterface.addColumn(
      'User',
      'address',
      { type: Sequelize.STRING, allowNull: true },
      { transaction }
    );

    const [users] = await queryInterface.sequelize.query(
      'SELECT id, first_name_encrypted, last_name_encrypted, email_encrypted, address_encrypted FROM "User"',
      { transaction }
    );

    for (const row of users) {
      await queryInterface.sequelize.query(
        `UPDATE "User"
           SET first_name = :firstName,
               last_name = :lastName,
               email = :email,
               address = :address
         WHERE id = :id`,
        {
          transaction,
          replacements: {
            id: row.id,
            firstName: decryptString(row.first_name_encrypted, 'user:firstName'),
            lastName: decryptString(row.last_name_encrypted, 'user:lastName'),
            email: decryptString(row.email_encrypted, 'user:email'),
            address: row.address_encrypted
              ? decryptString(row.address_encrypted, 'user:address')
              : null
          }
        }
      );
    }

    await queryInterface.removeIndex('User', 'user_email_hash_unique', { transaction });
    await queryInterface.removeColumn('User', 'first_name_encrypted', { transaction });
    await queryInterface.removeColumn('User', 'last_name_encrypted', { transaction });
    await queryInterface.removeColumn('User', 'email_encrypted', { transaction });
    await queryInterface.removeColumn('User', 'email_hash', { transaction });
    await queryInterface.removeColumn('User', 'address_encrypted', { transaction });

    await queryInterface.addColumn(
      'Company',
      'contact_name',
      { type: Sequelize.STRING, allowNull: true },
      { transaction }
    );
    await queryInterface.addColumn(
      'Company',
      'contact_email',
      { type: Sequelize.STRING, allowNull: true },
      { transaction }
    );

    const [companies] = await queryInterface.sequelize.query(
      'SELECT id, contact_name_encrypted, contact_email_encrypted FROM "Company"',
      { transaction }
    );

    for (const row of companies) {
      await queryInterface.sequelize.query(
        `UPDATE "Company"
           SET contact_name = :contactName,
               contact_email = :contactEmail
         WHERE id = :id`,
        {
          transaction,
          replacements: {
            id: row.id,
            contactName: row.contact_name_encrypted
              ? decryptString(row.contact_name_encrypted, 'company:contactName')
              : null,
            contactEmail: row.contact_email_encrypted
              ? decryptString(row.contact_email_encrypted, 'company:contactEmail')
              : null
          }
        }
      );
    }

    await queryInterface.removeColumn('Company', 'contact_name_encrypted', { transaction });
    await queryInterface.removeColumn('Company', 'contact_email_encrypted', { transaction });
    await queryInterface.removeColumn('Company', 'contact_email_hash', { transaction });
  });
}

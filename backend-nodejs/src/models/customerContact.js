import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { encryptString, decryptString } from '../utils/security/fieldEncryption.js';

function encryptedAttribute(attribute, context, field, { allowNull = true } = {}) {
  return {
    type: DataTypes.TEXT,
    allowNull,
    field,
    set(value) {
      if (value === null || value === undefined || value === '') {
        this.setDataValue(attribute, null);
        return;
      }

      if (typeof value !== 'string') {
        throw new TypeError(`${context} must be a string when provided.`);
      }

      const trimmed = value.trim();
      if (!trimmed) {
        this.setDataValue(attribute, null);
        return;
      }

      this.setDataValue(attribute, encryptString(trimmed, context));
    },
    get() {
      const stored = this.getDataValue(attribute);
      return stored ? decryptString(stored, context) : null;
    }
  };
}

class CustomerContact extends Model {}

CustomerContact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    name: encryptedAttribute('name', 'customerContact:name', 'name_encrypted', { allowNull: false }),
    role: encryptedAttribute('role', 'customerContact:role', 'role_encrypted'),
    email: encryptedAttribute('email', 'customerContact:email', 'email_encrypted'),
    phone: encryptedAttribute('phone', 'customerContact:phone', 'phone_encrypted'),
    contactType: {
      type: DataTypes.ENUM('operations', 'finance', 'support', 'billing', 'executive', 'other'),
      allowNull: false,
      defaultValue: 'operations',
      field: 'contact_type'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary'
    },
    notes: encryptedAttribute('notes', 'customerContact:notes', 'notes_encrypted'),
    avatarUrl: encryptedAttribute('avatarUrl', 'customerContact:avatarUrl', 'avatar_url_encrypted')
  },
  {
    sequelize,
    modelName: 'CustomerContact',
    tableName: 'customer_contacts',
    underscored: true
  }
);

export default CustomerContact;

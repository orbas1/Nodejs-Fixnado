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

class CustomerLocation extends Model {}

CustomerLocation.init(
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
    label: encryptedAttribute('label', 'customerLocation:label', 'label_encrypted'),
    addressLine1: encryptedAttribute('addressLine1', 'customerLocation:addressLine1', 'address_line1_encrypted'),
    addressLine2: encryptedAttribute('addressLine2', 'customerLocation:addressLine2', 'address_line2_encrypted'),
    city: encryptedAttribute('city', 'customerLocation:city', 'city_encrypted'),
    region: encryptedAttribute('region', 'customerLocation:region', 'region_encrypted'),
    postalCode: encryptedAttribute('postalCode', 'customerLocation:postalCode', 'postal_code_encrypted'),
    country: encryptedAttribute('country', 'customerLocation:country', 'country_encrypted'),
    accessNotes: encryptedAttribute('accessNotes', 'customerLocation:accessNotes', 'access_notes_encrypted'),
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary'
    }
  },
  {
    sequelize,
    modelName: 'CustomerLocation',
    tableName: 'customer_locations',
    underscored: true
  }
);

export default CustomerLocation;

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

class CustomerProfile extends Model {}

CustomerProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    preferredName: encryptedAttribute('preferredName', 'customerProfile:preferredName', 'preferred_name_encrypted'),
    companyName: encryptedAttribute('companyName', 'customerProfile:companyName', 'company_name_encrypted'),
    jobTitle: encryptedAttribute('jobTitle', 'customerProfile:jobTitle', 'job_title_encrypted'),
    primaryEmail: encryptedAttribute('primaryEmail', 'customerProfile:primaryEmail', 'primary_email_encrypted'),
    primaryPhone: encryptedAttribute('primaryPhone', 'customerProfile:primaryPhone', 'primary_phone_encrypted'),
    preferredContactMethod: encryptedAttribute(
      'preferredContactMethod',
      'customerProfile:preferredContactMethod',
      'preferred_contact_method_encrypted'
    ),
    billingEmail: encryptedAttribute('billingEmail', 'customerProfile:billingEmail', 'billing_email_encrypted'),
    timezone: encryptedAttribute('timezone', 'customerProfile:timezone', 'timezone_encrypted'),
    locale: encryptedAttribute('locale', 'customerProfile:locale', 'locale_encrypted'),
    defaultCurrency: encryptedAttribute('defaultCurrency', 'customerProfile:currency', 'default_currency_encrypted'),
    avatarUrl: encryptedAttribute('avatarUrl', 'customerProfile:avatarUrl', 'avatar_url_encrypted'),
    coverImageUrl: encryptedAttribute('coverImageUrl', 'customerProfile:coverImageUrl', 'cover_image_url_encrypted'),
    supportNotes: encryptedAttribute('supportNotes', 'customerProfile:supportNotes', 'support_notes_encrypted'),
    escalationWindowMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 120,
      field: 'escalation_window_minutes'
    },
    marketingOptIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'marketing_opt_in'
    },
    notificationsEmailOptIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notifications_email_opt_in'
    },
    notificationsSmsOptIn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'notifications_sms_opt_in'
    }
  },
  {
    sequelize,
    modelName: 'CustomerProfile',
    tableName: 'customer_profiles',
    underscored: true
  }
);

export default CustomerProfile;

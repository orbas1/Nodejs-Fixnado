import User from '../user.js';
import ServicemanByokProfile from '../servicemanByokProfile.js';
import ServicemanByokConnector from '../servicemanByokConnector.js';
import ServicemanByokAuditEvent from '../servicemanByokAuditEvent.js';

let initialised = false;

export default function ensureServicemanByokAssociations() {
  if (initialised) {
    return;
  }

  if (!ServicemanByokProfile.associations?.serviceman) {
    ServicemanByokProfile.belongsTo(User, { foreignKey: 'userId', as: 'serviceman' });
  }

  if (!User.associations?.servicemanByokProfile) {
    User.hasOne(ServicemanByokProfile, { foreignKey: 'userId', as: 'servicemanByokProfile' });
  }

  if (!ServicemanByokProfile.associations?.connectors) {
    ServicemanByokProfile.hasMany(ServicemanByokConnector, { foreignKey: 'profileId', as: 'connectors' });
  }

  if (!ServicemanByokConnector.associations?.profile) {
    ServicemanByokConnector.belongsTo(ServicemanByokProfile, { foreignKey: 'profileId', as: 'profile' });
  }

  if (!ServicemanByokProfile.associations?.auditEvents) {
    ServicemanByokProfile.hasMany(ServicemanByokAuditEvent, { foreignKey: 'profileId', as: 'auditEvents' });
  }

  if (!ServicemanByokAuditEvent.associations?.profile) {
    ServicemanByokAuditEvent.belongsTo(ServicemanByokProfile, { foreignKey: 'profileId', as: 'profile' });
  }

  if (!ServicemanByokConnector.associations?.auditTrail) {
    ServicemanByokConnector.hasMany(ServicemanByokAuditEvent, { foreignKey: 'connectorId', as: 'auditTrail' });
  }

  if (!ServicemanByokAuditEvent.associations?.connector) {
    ServicemanByokAuditEvent.belongsTo(ServicemanByokConnector, { foreignKey: 'connectorId', as: 'connector' });
  }

  initialised = true;
}

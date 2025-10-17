import sequelize from '../config/database.js';
import User from './user.js';
import UserProfileSetting from './userProfileSetting.js';
import ServicemanProfileSetting from './servicemanProfileSetting.js';
import Company from './company.js';
import UserPreference from './userPreference.js';
import Service from './service.js';
import ServiceCategory from './serviceCategory.js';
import Post from './post.js';
import MarketplaceItem from './marketplaceItem.js';
import ServiceZone from './serviceZone.js';
import ServiceZoneCoverage from './serviceZoneCoverage.js';
import Order from './order.js';
import OrderNote from './orderNote.js';
import Escrow from './escrow.js';
import EscrowMilestone from './escrowMilestone.js';
import EscrowNote from './escrowNote.js';
import EscrowWorkLog from './escrowWorkLog.js';
import Dispute from './dispute.js';
import ServicemanProfile from './servicemanProfile.js';
import ServicemanShiftRule from './servicemanShiftRule.js';
import ServicemanCertification from './servicemanCertification.js';
import ServicemanEquipmentItem from './servicemanEquipmentItem.js';
import UiPreferenceTelemetry from './uiPreferenceTelemetry.js';
import UiPreferenceTelemetrySnapshot from './uiPreferenceTelemetrySnapshot.js';
import ZoneAnalyticsSnapshot from './zoneAnalyticsSnapshot.js';
import ProviderProfile from './providerProfile.js';
import ProviderWebsitePreference from './providerWebsitePreference.js';
import ProviderContact from './providerContact.js';
import ProviderCoverage from './providerCoverage.js';
import ProviderServiceman from './providerServiceman.js';
import ProviderServicemanAvailability from './providerServicemanAvailability.js';
import ProviderServicemanZone from './providerServicemanZone.js';
import ProviderServicemanMedia from './providerServicemanMedia.js';
import ProviderTaxProfile from './providerTaxProfile.js';
import ProviderTaxFiling from './providerTaxFiling.js';
import ProviderByokIntegration from './providerByokIntegration.js';
import ProviderByokAuditLog from './providerByokAuditLog.js';
import ProviderCrewMember from './providerCrewMember.js';
import ProviderCrewAvailability from './providerCrewAvailability.js';
import ProviderCrewDeployment from './providerCrewDeployment.js';
import ProviderCrewDelegation from './providerCrewDelegation.js';
import ProviderOnboardingTask from './providerOnboardingTask.js';
import ProviderOnboardingRequirement from './providerOnboardingRequirement.js';
import ProviderOnboardingNote from './providerOnboardingNote.js';
import ProviderStorefront from './providerStorefront.js';
import ProviderStorefrontInventory from './providerStorefrontInventory.js';
import ProviderStorefrontCoupon from './providerStorefrontCoupon.js';
import ProviderEscrowPolicy from './providerEscrowPolicy.js';
import Booking from './booking.js';
import BookingAssignment from './bookingAssignment.js';
import BookingBid from './bookingBid.js';
import BookingBidComment from './bookingBidComment.js';
import BookingNote from './bookingNote.js';
import BookingTemplate from './bookingTemplate.js';
import BookingHistoryEntry from './bookingHistoryEntry.js';
import ServicemanBookingSetting from './servicemanBookingSetting.js';
import InventoryItem from './inventoryItem.js';
import InventoryLedgerEntry from './inventoryLedgerEntry.js';
import InventoryAlert from './inventoryAlert.js';
import InventoryCategory from './inventoryCategory.js';
import InventoryTag from './inventoryTag.js';
import InventoryItemTag from './inventoryItemTag.js';
import InventoryItemMedia from './inventoryItemMedia.js';
import InventoryItemSupplier from './inventoryItemSupplier.js';
import InventoryLocationZone from './inventoryLocationZone.js';
import RentalAgreement from './rentalAgreement.js';
import RentalCheckpoint from './rentalCheckpoint.js';
import ComplianceDocument from './complianceDocument.js';
import ComplianceControl from './complianceControl.js';
import InsuredSellerApplication from './insuredSellerApplication.js';
import MarketplaceModerationAction from './marketplaceModerationAction.js';
import ProviderCalendarSetting from './providerCalendarSetting.js';
import ProviderCalendarEvent from './providerCalendarEvent.js';
import AdCampaign from './adCampaign.js';
import CampaignCreative from './campaignCreative.js';
import CampaignFlight from './campaignFlight.js';
import CampaignTargetingRule from './campaignTargetingRule.js';
import CampaignInvoice from './campaignInvoice.js';
import CampaignDailyMetric from './campaignDailyMetric.js';
import CampaignFraudSignal from './campaignFraudSignal.js';
import CampaignAnalyticsExport from './campaignAnalyticsExport.js';
import CampaignCreative from './campaignCreative.js';
import CampaignAudienceSegment from './campaignAudienceSegment.js';
import CampaignPlacement from './campaignPlacement.js';
import AnalyticsEvent from './analyticsEvent.js';
import AnalyticsPipelineRun from './analyticsPipelineRun.js';
import Conversation from './conversation.js';
import ConversationParticipant from './conversationParticipant.js';
import ConversationMessage from './conversationMessage.js';
import MessageDelivery from './messageDelivery.js';
import AccountSupportTask from './accountSupportTask.js';
import AccountSupportTaskUpdate from './accountSupportTaskUpdate.js';
import AdminUserProfile from './adminUserProfile.js';
import CustomJobBid from './customJobBid.js';
import CustomJobBidMessage from './customJobBidMessage.js';
import CustomJobInvitation from './customJobInvitation.js';
import CustomJobReport from './customJobReport.js';
import PlatformSetting from './platformSetting.js';
import CommunicationsInboxConfiguration from './communicationsInboxConfiguration.js';
import CommunicationsEntryPoint from './communicationsEntryPoint.js';
import CommunicationsQuickReply from './communicationsQuickReply.js';
import CommunicationsEscalationRule from './communicationsEscalationRule.js';
import BlogPost from './blogPost.js';
import BlogCategory from './blogCategory.js';
import BlogTag from './blogTag.js';
import BlogMedia from './blogMedia.js';
import BlogPostCategory from './blogPostCategory.js';
import BlogPostTag from './blogPostTag.js';
import BlogPostRevision from './blogPostRevision.js';
import WebsitePage from './websitePage.js';
import WebsiteContentBlock from './websiteContentBlock.js';
import WebsiteNavigationMenu from './websiteNavigationMenu.js';
import WebsiteNavigationItem from './websiteNavigationItem.js';
import AffiliateProfile from './affiliateProfile.js';
import AdminProfile from './adminProfile.js';
import AffiliateCommissionRule from './affiliateCommissionRule.js';
import AffiliateReferral from './affiliateReferral.js';
import AffiliateLedgerEntry from './affiliateLedgerEntry.js';
import SecurityAuditEvent from './securityAuditEvent.js';
import AdminAuditEvent from './adminAuditEvent.js';
import SecuritySignalConfig from './securitySignalConfig.js';
import SecurityAutomationTask from './securityAutomationTask.js';
import TelemetryConnector from './telemetryConnector.js';
import UserSession from './userSession.js';
import ConsentEvent from './consentEvent.js';
import Region from './region.js';
import DataSubjectRequest from './dataSubjectRequest.js';
import FinanceTransactionHistory from './financeTransactionHistory.js';
import Payment from './payment.js';
import PayoutRequest from './payoutRequest.js';
import FinanceInvoice from './financeInvoice.js';
import FinanceWebhookEvent from './financeWebhookEvent.js';
import MessageHistory from './messageHistory.js';
import StorefrontRevisionLog from './storefrontRevisionLog.js';
import WarehouseExportRun from './warehouseExportRun.js';
import WalletConfiguration from './walletConfiguration.js';
import WalletAccount from './walletAccount.js';
import WalletTransaction from './walletTransaction.js';
import RbacRole from './rbacRole.js';
import RbacRolePermission from './rbacRolePermission.js';
import RbacRoleInheritance from './rbacRoleInheritance.js';
import RbacRoleAssignment from './rbacRoleAssignment.js';
import AdminProfile from './adminProfile.js';
import AdminDelegate from './adminDelegate.js';
import DisputeHealthBucket from './disputeHealthBucket.js';
import DisputeHealthEntry from './disputeHealthEntry.js';
import CommandMetricSetting from './commandMetricSetting.js';
import CommandMetricCard from './commandMetricCard.js';
import ServicemanMetricSetting from './servicemanMetricSetting.js';
import ServicemanMetricCard from './servicemanMetricCard.js';
import OperationsQueueBoard from './operationsQueueBoard.js';
import OperationsQueueUpdate from './operationsQueueUpdate.js';
import AutomationInitiative from './automationInitiative.js';
import EnterpriseAccount from './enterpriseAccount.js';
import EnterpriseSite from './enterpriseSite.js';
import EnterpriseStakeholder from './enterpriseStakeholder.js';
import EnterprisePlaybook from './enterprisePlaybook.js';
import EnterpriseUpgradeRequest from './enterpriseUpgradeRequest.js';
import EnterpriseUpgradeContact from './enterpriseUpgradeContact.js';
import EnterpriseUpgradeSite from './enterpriseUpgradeSite.js';
import EnterpriseUpgradeChecklistItem from './enterpriseUpgradeChecklistItem.js';
import EnterpriseUpgradeDocument from './enterpriseUpgradeDocument.js';
import AppearanceProfile from './appearanceProfile.js';
import AppearanceAsset from './appearanceAsset.js';
import AppearanceVariant from './appearanceVariant.js';
import Supplier from './supplier.js';
import PurchaseOrder from './purchaseOrder.js';
import PurchaseOrderItem from './purchaseOrderItem.js';
import ServicemanIdentity from './servicemanIdentity.js';
import ServicemanIdentityDocument from './servicemanIdentityDocument.js';
import ServicemanIdentityCheck from './servicemanIdentityCheck.js';
import ServicemanIdentityWatcher from './servicemanIdentityWatcher.js';
import ServicemanIdentityEvent from './servicemanIdentityEvent.js';
import PurchaseAttachment from './purchaseAttachment.js';
import PurchaseBudget from './purchaseBudget.js';
import ServicemanFinancialProfile from './servicemanFinancialProfile.js';
import ServicemanFinancialEarning from './servicemanFinancialEarning.js';
import ServicemanExpenseClaim from './servicemanExpenseClaim.js';
import ServicemanAllowance from './servicemanAllowance.js';
import HomePage from './homePage.js';
import HomePageSection from './homePageSection.js';
import HomePageComponent from './homePageComponent.js';
import LegalDocument from './legalDocument.js';
import LegalDocumentVersion from './legalDocumentVersion.js';
import LiveFeedAuditEvent from './liveFeedAuditEvent.js';
import LiveFeedAuditNote from './liveFeedAuditNote.js';
import SystemSettingAudit from './systemSettingAudit.js';
import ServiceTaxonomyType from './serviceTaxonomyType.js';
import ServiceTaxonomyCategory from './serviceTaxonomyCategory.js';
import WalletAccount from './walletAccount.js';
import WalletTransaction from './walletTransaction.js';
import WalletPaymentMethod from './walletPaymentMethod.js';
import CustomerProfile from './customerProfile.js';
import CustomerContact from './customerContact.js';
import CustomerLocation from './customerLocation.js';
import CustomerCoupon from './customerCoupon.js';
import CustomerAccountSetting from './customerAccountSetting.js';
import CustomerNotificationRecipient from './customerNotificationRecipient.js';
import CustomerDisputeCase from './customerDisputeCase.js';
import CustomerDisputeTask from './customerDisputeTask.js';
import CustomerDisputeNote from './customerDisputeNote.js';
import CustomerDisputeEvidence from './customerDisputeEvidence.js';
import ServicemanDisputeCase from './servicemanDisputeCase.js';
import ServicemanDisputeTask from './servicemanDisputeTask.js';
import ServicemanDisputeNote from './servicemanDisputeNote.js';
import ServicemanDisputeEvidence from './servicemanDisputeEvidence.js';
import InboxQueue from './inboxQueue.js';
import InboxConfiguration from './inboxConfiguration.js';
import InboxTemplate from './inboxTemplate.js';
import ServicemanByokProfile from './servicemanByokProfile.js';
import ServicemanByokConnector from './servicemanByokConnector.js';
import ServicemanByokAuditEvent from './servicemanByokAuditEvent.js';
import ToolSaleProfile from './toolSaleProfile.js';
import ToolSaleCoupon from './toolSaleCoupon.js';

User.hasOne(Company, { foreignKey: 'userId' });
Company.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(UserPreference, { foreignKey: 'userId', as: 'preferences' });
UserPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserProfileSetting, { foreignKey: 'userId', as: 'profileSettings' });
UserProfileSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(ServicemanProfileSetting, { foreignKey: 'userId', as: 'servicemanProfile' });
ServicemanProfileSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(CustomerAccountSetting, { foreignKey: 'userId', as: 'accountSetting' });
CustomerAccountSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(ServicemanProfile, { foreignKey: 'userId', as: 'servicemanProfile' });
ServicemanProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ServicemanProfile.hasMany(ServicemanShiftRule, { foreignKey: 'profileId', as: 'shiftRules' });
ServicemanShiftRule.belongsTo(ServicemanProfile, { foreignKey: 'profileId', as: 'profile' });
ServicemanProfile.hasMany(ServicemanCertification, { foreignKey: 'profileId', as: 'certifications' });
ServicemanCertification.belongsTo(ServicemanProfile, { foreignKey: 'profileId', as: 'profile' });
ServicemanProfile.hasMany(ServicemanEquipmentItem, { foreignKey: 'profileId', as: 'equipment' });
ServicemanEquipmentItem.belongsTo(ServicemanProfile, { foreignKey: 'profileId', as: 'profile' });
User.hasOne(ServicemanIdentity, { foreignKey: 'servicemanId', as: 'identityProfile' });
ServicemanIdentity.belongsTo(User, { foreignKey: 'servicemanId', as: 'serviceman' });
ServicemanIdentity.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

ServicemanIdentity.hasMany(ServicemanIdentityDocument, { foreignKey: 'identityId', as: 'documents' });
ServicemanIdentityDocument.belongsTo(ServicemanIdentity, { foreignKey: 'identityId', as: 'identity' });

ServicemanIdentity.hasMany(ServicemanIdentityCheck, { foreignKey: 'identityId', as: 'checks' });
ServicemanIdentityCheck.belongsTo(ServicemanIdentity, { foreignKey: 'identityId', as: 'identity' });

ServicemanIdentity.hasMany(ServicemanIdentityWatcher, { foreignKey: 'identityId', as: 'watchers' });
ServicemanIdentityWatcher.belongsTo(ServicemanIdentity, { foreignKey: 'identityId', as: 'identity' });

ServicemanIdentity.hasMany(ServicemanIdentityEvent, { foreignKey: 'identityId', as: 'events' });
ServicemanIdentityEvent.belongsTo(ServicemanIdentity, { foreignKey: 'identityId', as: 'identity' });
ServicemanIdentityEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(ServicemanIdentityEvent, { foreignKey: 'actorId', as: 'identityEvents' });
User.hasOne(ServicemanBookingSetting, { foreignKey: 'servicemanId', as: 'servicemanBookingSetting' });
ServicemanBookingSetting.belongsTo(User, { foreignKey: 'servicemanId', as: 'serviceman' });

CustomerAccountSetting.hasMany(CustomerNotificationRecipient, {
  foreignKey: 'accountSettingId',
  as: 'recipients'
});
CustomerNotificationRecipient.belongsTo(CustomerAccountSetting, {
  foreignKey: 'accountSettingId',
  as: 'accountSetting'
});

Region.hasMany(User, { foreignKey: 'regionId', as: 'users' });
User.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

User.hasOne(AdminUserProfile, { foreignKey: 'userId', as: 'adminProfile' });
AdminUserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Region.hasMany(Company, { foreignKey: 'regionId', as: 'companies' });
Company.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Company.hasOne(ProviderProfile, { foreignKey: 'companyId', as: 'profile' });
ProviderProfile.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasOne(ProviderWebsitePreference, { foreignKey: 'companyId', as: 'websitePreferences' });
ProviderWebsitePreference.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(ProviderContact, { foreignKey: 'companyId', as: 'contacts' });
ProviderContact.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(ProviderCoverage, { foreignKey: 'companyId', as: 'coverage' });
ProviderCoverage.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasOne(ProviderTaxProfile, { foreignKey: 'companyId', as: 'taxProfile' });
ProviderTaxProfile.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(ProviderTaxFiling, { foreignKey: 'companyId', as: 'taxFilings' });
ProviderTaxFiling.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(ProviderByokIntegration, { foreignKey: 'companyId', as: 'byokIntegrations' });
ProviderByokIntegration.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

ProviderByokIntegration.hasMany(ProviderByokAuditLog, { foreignKey: 'integrationId', as: 'auditLogs' });
ProviderByokAuditLog.belongsTo(ProviderByokIntegration, { foreignKey: 'integrationId', as: 'integration' });
ProviderByokAuditLog.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(EnterpriseUpgradeRequest, {
  foreignKey: 'companyId',
  as: 'enterpriseUpgrades',
  onDelete: 'CASCADE',
  hooks: true
});
EnterpriseUpgradeRequest.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

EnterpriseUpgradeRequest.hasMany(EnterpriseUpgradeContact, {
  foreignKey: 'upgradeRequestId',
  as: 'contacts',
  onDelete: 'CASCADE',
  hooks: true
});
EnterpriseUpgradeContact.belongsTo(EnterpriseUpgradeRequest, {
  foreignKey: 'upgradeRequestId',
  as: 'upgradeRequest'
});

EnterpriseUpgradeRequest.hasMany(EnterpriseUpgradeSite, {
  foreignKey: 'upgradeRequestId',
  as: 'sites',
  onDelete: 'CASCADE',
  hooks: true
});
EnterpriseUpgradeSite.belongsTo(EnterpriseUpgradeRequest, {
  foreignKey: 'upgradeRequestId',
  as: 'upgradeRequest'
});

EnterpriseUpgradeRequest.hasMany(EnterpriseUpgradeChecklistItem, {
  foreignKey: 'upgradeRequestId',
  as: 'checklistItems',
  onDelete: 'CASCADE',
  hooks: true
});
EnterpriseUpgradeChecklistItem.belongsTo(EnterpriseUpgradeRequest, {
  foreignKey: 'upgradeRequestId',
  as: 'upgradeRequest'
});

EnterpriseUpgradeRequest.hasMany(EnterpriseUpgradeDocument, {
  foreignKey: 'upgradeRequestId',
  as: 'documents',
  onDelete: 'CASCADE',
  hooks: true
});
EnterpriseUpgradeDocument.belongsTo(EnterpriseUpgradeRequest, {
  foreignKey: 'upgradeRequestId',
  as: 'upgradeRequest'
});
Company.hasOne(ProviderCalendarSetting, { foreignKey: 'companyId', as: 'calendarSetting' });
ProviderCalendarSetting.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(ProviderCalendarEvent, { foreignKey: 'companyId', as: 'calendarEvents' });
ProviderCalendarEvent.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasOne(ProviderStorefront, { foreignKey: 'companyId', as: 'storefront' });
ProviderStorefront.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
ProviderStorefront.hasMany(ProviderStorefrontInventory, {
  foreignKey: 'storefrontId',
  as: 'inventory'
});
ProviderStorefrontInventory.belongsTo(ProviderStorefront, {
  foreignKey: 'storefrontId',
  as: 'storefront'
});
ProviderStorefront.hasMany(ProviderStorefrontCoupon, { foreignKey: 'storefrontId', as: 'coupons' });
ProviderStorefrontCoupon.belongsTo(ProviderStorefront, { foreignKey: 'storefrontId', as: 'storefront' });

ServiceZone.hasMany(ProviderCoverage, { foreignKey: 'zoneId', as: 'providerCoverage' });
ProviderCoverage.belongsTo(ServiceZone, { foreignKey: 'zoneId', as: 'zone' });

Company.hasMany(ProviderServiceman, { foreignKey: 'companyId', as: 'servicemen' });
ProviderServiceman.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

ProviderServiceman.hasMany(ProviderServicemanAvailability, {
  foreignKey: 'servicemanId',
  as: 'availabilities'
});
ProviderServicemanAvailability.belongsTo(ProviderServiceman, {
  foreignKey: 'servicemanId',
  as: 'serviceman'
});

ProviderServiceman.hasMany(ProviderServicemanZone, { foreignKey: 'servicemanId', as: 'zoneLinks' });
ProviderServicemanZone.belongsTo(ProviderServiceman, { foreignKey: 'servicemanId', as: 'serviceman' });
ProviderServicemanZone.belongsTo(ServiceZone, { foreignKey: 'zoneId', as: 'zone' });
ServiceZone.hasMany(ProviderServicemanZone, { foreignKey: 'zoneId', as: 'servicemanLinks' });

ProviderServiceman.belongsToMany(ServiceZone, {
  through: ProviderServicemanZone,
  foreignKey: 'servicemanId',
  otherKey: 'zoneId',
  as: 'zones'
});
ServiceZone.belongsToMany(ProviderServiceman, {
  through: ProviderServicemanZone,
  foreignKey: 'zoneId',
  otherKey: 'servicemanId',
  as: 'servicemen'
});

ProviderServiceman.hasMany(ProviderServicemanMedia, { foreignKey: 'servicemanId', as: 'media' });
ProviderServicemanMedia.belongsTo(ProviderServiceman, { foreignKey: 'servicemanId', as: 'serviceman' });
Company.hasMany(ProviderCrewMember, { foreignKey: 'companyId', as: 'crewMembers' });
ProviderCrewMember.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

ProviderCrewMember.hasMany(ProviderCrewAvailability, {
  foreignKey: 'crewMemberId',
  as: 'availability',
  onDelete: 'CASCADE',
  hooks: true
});
ProviderCrewAvailability.belongsTo(ProviderCrewMember, {
  foreignKey: 'crewMemberId',
  as: 'crewMember',
  onDelete: 'CASCADE'
});
Company.hasMany(ProviderCrewAvailability, { foreignKey: 'companyId', as: 'crewAvailability' });
ProviderCrewAvailability.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

ProviderCrewMember.hasMany(ProviderCrewDeployment, {
  foreignKey: 'crewMemberId',
  as: 'deployments',
  onDelete: 'CASCADE',
  hooks: true
});
ProviderCrewDeployment.belongsTo(ProviderCrewMember, {
  foreignKey: 'crewMemberId',
  as: 'crewMember',
  onDelete: 'CASCADE'
});
Company.hasMany(ProviderCrewDeployment, { foreignKey: 'companyId', as: 'crewDeployments' });
ProviderCrewDeployment.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

ProviderCrewMember.hasMany(ProviderCrewDelegation, {
  foreignKey: 'crewMemberId',
  as: 'delegations',
  onDelete: 'SET NULL',
  hooks: true
});
ProviderCrewDelegation.belongsTo(ProviderCrewMember, {
  foreignKey: 'crewMemberId',
  as: 'crewMember',
  onDelete: 'SET NULL'
});
Company.hasMany(ProviderCrewDelegation, { foreignKey: 'companyId', as: 'delegations' });
ProviderCrewDelegation.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(ProviderOnboardingTask, { foreignKey: 'companyId', as: 'onboardingTasks' });
ProviderOnboardingTask.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
ProviderOnboardingTask.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Company.hasMany(ProviderOnboardingRequirement, { foreignKey: 'companyId', as: 'onboardingRequirements' });
ProviderOnboardingRequirement.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
ProviderOnboardingRequirement.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

Company.hasMany(ProviderOnboardingNote, { foreignKey: 'companyId', as: 'onboardingNotes' });
ProviderOnboardingNote.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
ProviderOnboardingNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(CustomerProfile, { foreignKey: 'userId', as: 'customerProfile' });
CustomerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CustomerContact, { foreignKey: 'userId', as: 'customerContacts' });
CustomerContact.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CustomerLocation, { foreignKey: 'userId', as: 'customerLocations' });
CustomerLocation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CustomerDisputeCase, { foreignKey: 'userId', as: 'customerDisputeCases' });
CustomerDisputeCase.belongsTo(User, { foreignKey: 'userId', as: 'customer' });

CustomerDisputeCase.belongsTo(Dispute, { foreignKey: 'disputeId', as: 'platformDispute' });
Dispute.hasMany(CustomerDisputeCase, { foreignKey: 'disputeId', as: 'customerCases' });

CustomerDisputeCase.hasMany(CustomerDisputeTask, { foreignKey: 'disputeCaseId', as: 'tasks' });
CustomerDisputeTask.belongsTo(CustomerDisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });

CustomerDisputeCase.hasMany(CustomerDisputeNote, { foreignKey: 'disputeCaseId', as: 'notes' });
CustomerDisputeNote.belongsTo(CustomerDisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });
CustomerDisputeNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(CustomerDisputeNote, { foreignKey: 'authorId', as: 'authoredDisputeNotes' });

CustomerDisputeCase.hasMany(CustomerDisputeEvidence, { foreignKey: 'disputeCaseId', as: 'evidence' });
CustomerDisputeEvidence.belongsTo(CustomerDisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });
CustomerDisputeEvidence.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(CustomerDisputeEvidence, { foreignKey: 'uploadedBy', as: 'uploadedDisputeEvidence' });
User.hasMany(ServicemanDisputeCase, { foreignKey: 'servicemanId', as: 'servicemanDisputeCases' });
ServicemanDisputeCase.belongsTo(User, { foreignKey: 'servicemanId', as: 'serviceman' });
ServicemanDisputeCase.belongsTo(Dispute, { foreignKey: 'disputeId', as: 'platformDispute' });
Dispute.hasMany(ServicemanDisputeCase, { foreignKey: 'disputeId', as: 'servicemanCases' });
ServicemanDisputeCase.hasMany(ServicemanDisputeTask, { foreignKey: 'disputeCaseId', as: 'tasks' });
ServicemanDisputeTask.belongsTo(ServicemanDisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });
ServicemanDisputeCase.hasMany(ServicemanDisputeNote, { foreignKey: 'disputeCaseId', as: 'notes' });
ServicemanDisputeNote.belongsTo(ServicemanDisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });
ServicemanDisputeNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(ServicemanDisputeNote, { foreignKey: 'authorId', as: 'authoredServicemanDisputeNotes' });
ServicemanDisputeCase.hasMany(ServicemanDisputeEvidence, { foreignKey: 'disputeCaseId', as: 'evidence' });
ServicemanDisputeEvidence.belongsTo(ServicemanDisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });
ServicemanDisputeEvidence.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(ServicemanDisputeEvidence, { foreignKey: 'uploadedBy', as: 'uploadedServicemanDisputeEvidence' });
User.hasMany(CustomerCoupon, { foreignKey: 'userId', as: 'customerCoupons' });
CustomerCoupon.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.belongsTo(ServiceZone, { foreignKey: 'zoneId', as: 'zone' });
ServiceZone.hasMany(Post, { foreignKey: 'zoneId', as: 'customJobs' });

Post.hasMany(CustomJobBid, { foreignKey: 'postId', as: 'bids' });
CustomJobBid.belongsTo(Post, { foreignKey: 'postId', as: 'job' });
Post.belongsTo(CustomJobBid, { foreignKey: 'awardedBidId', as: 'awardedBid' });
CustomJobBid.hasMany(Post, { foreignKey: 'awardedBidId', as: 'awardedJobs' });
Post.belongsTo(User, { foreignKey: 'awardedBy', as: 'awardedByUser' });
User.hasMany(Post, { foreignKey: 'awardedBy', as: 'awardedCustomJobs' });

CustomJobBid.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });
User.hasMany(CustomJobBid, { foreignKey: 'providerId', as: 'customJobBids' });

CustomJobBid.belongsTo(Company, { foreignKey: 'companyId', as: 'providerCompany' });
Company.hasMany(CustomJobBid, { foreignKey: 'companyId', as: 'customJobBids' });

CustomJobBid.hasMany(CustomJobBidMessage, { foreignKey: 'bidId', as: 'messages' });
CustomJobBidMessage.belongsTo(CustomJobBid, { foreignKey: 'bidId', as: 'bid' });
CustomJobBidMessage.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Post.hasMany(CustomJobInvitation, { foreignKey: 'postId', as: 'invitations' });
CustomJobInvitation.belongsTo(Post, { foreignKey: 'postId', as: 'job' });
Company.hasMany(CustomJobInvitation, { foreignKey: 'companyId', as: 'customJobInvitations' });
CustomJobInvitation.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
User.hasMany(CustomJobInvitation, { foreignKey: 'createdBy', as: 'customJobInvitationsCreated' });
CustomJobInvitation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(CustomJobInvitation, { foreignKey: 'targetId', as: 'customJobInvites' });
CustomJobInvitation.belongsTo(User, { foreignKey: 'targetId', as: 'target' });

Company.hasMany(CustomJobReport, { foreignKey: 'companyId', as: 'customJobReports' });
CustomJobReport.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
CustomJobReport.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
CustomJobReport.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

Company.hasMany(Service, { foreignKey: 'companyId' });
Service.belongsTo(Company, { foreignKey: 'companyId' });

ServiceCategory.hasMany(Service, { foreignKey: 'categoryId', as: 'listings' });
Service.belongsTo(ServiceCategory, { foreignKey: 'categoryId', as: 'categoryRef' });

ServiceCategory.hasMany(ServiceCategory, { foreignKey: 'parentId', as: 'children' });
ServiceCategory.belongsTo(ServiceCategory, { foreignKey: 'parentId', as: 'parent' });

User.hasMany(Service, { foreignKey: 'providerId' });
Service.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });

User.hasMany(ProviderEscrowPolicy, { foreignKey: 'providerId', as: 'providerEscrowPolicies' });
ProviderEscrowPolicy.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

Company.hasMany(ProviderEscrowPolicy, { foreignKey: 'companyId', as: 'escrowPolicies' });
ProviderEscrowPolicy.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

User.hasOne(AdminProfile, { foreignKey: 'userId', as: 'adminProfile' });
AdminProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

AdminProfile.hasMany(AdminDelegate, { foreignKey: 'adminProfileId', as: 'delegates' });
AdminDelegate.belongsTo(AdminProfile, { foreignKey: 'adminProfileId', as: 'adminProfile' });

Service.hasMany(Order, { foreignKey: 'serviceId' });
Order.belongsTo(Service, { foreignKey: 'serviceId' });

User.hasMany(Order, { foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });

Order.hasMany(OrderNote, { foreignKey: 'orderId', as: 'notes' });
OrderNote.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

OrderNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(OrderNote, { foreignKey: 'authorId', as: 'orderNotes' });

Region.hasMany(Order, { foreignKey: 'regionId', as: 'orders' });
Order.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Order.hasOne(Escrow, { foreignKey: 'orderId' });
Escrow.belongsTo(Order, { foreignKey: 'orderId' });

Region.hasMany(Escrow, { foreignKey: 'regionId', as: 'escrows' });
Escrow.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Escrow.hasMany(Dispute, { foreignKey: 'escrowId' });
Dispute.belongsTo(Escrow, { foreignKey: 'escrowId' });

Region.hasMany(Dispute, { foreignKey: 'regionId', as: 'disputes' });
Dispute.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Escrow.hasMany(EscrowMilestone, { foreignKey: 'escrowId', as: 'milestones' });
EscrowMilestone.belongsTo(Escrow, { foreignKey: 'escrowId', as: 'escrow' });

Escrow.hasMany(EscrowNote, { foreignKey: 'escrowId', as: 'notes' });
EscrowNote.belongsTo(Escrow, { foreignKey: 'escrowId', as: 'escrow' });

Escrow.hasMany(EscrowWorkLog, { foreignKey: 'escrowId', as: 'workLogs' });
EscrowWorkLog.belongsTo(Escrow, { foreignKey: 'escrowId', as: 'escrow' });

EscrowMilestone.hasMany(EscrowWorkLog, { foreignKey: 'milestoneId', as: 'workLogs' });
EscrowWorkLog.belongsTo(EscrowMilestone, { foreignKey: 'milestoneId', as: 'milestone' });

User.hasMany(EscrowWorkLog, { foreignKey: 'authorId', as: 'escrowWorkLogs' });
EscrowWorkLog.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Service.hasMany(Payment, { foreignKey: 'serviceId', as: 'payments' });
Payment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

User.hasMany(Payment, { foreignKey: 'buyerId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'buyerId', as: 'buyerAccount' });

User.hasMany(Payment, { foreignKey: 'providerId', as: 'providerPayments' });
Payment.belongsTo(User, { foreignKey: 'providerId', as: 'providerAccount' });

Region.hasMany(Payment, { foreignKey: 'regionId', as: 'payments' });
Payment.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Payment.hasMany(PayoutRequest, { foreignKey: 'paymentId', as: 'payouts' });
PayoutRequest.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

User.hasMany(PayoutRequest, { foreignKey: 'providerId', as: 'payoutRequests' });
PayoutRequest.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

Region.hasMany(PayoutRequest, { foreignKey: 'regionId', as: 'payoutRequests' });
PayoutRequest.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Order.hasOne(FinanceInvoice, { foreignKey: 'orderId', as: 'invoice' });
FinanceInvoice.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Region.hasMany(FinanceInvoice, { foreignKey: 'regionId', as: 'invoices' });
FinanceInvoice.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

PurchaseBudget.hasMany(PurchaseOrder, { foreignKey: 'budgetId', as: 'orders' });
PurchaseOrder.belongsTo(PurchaseBudget, { foreignKey: 'budgetId', as: 'budget' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'order' });

PurchaseOrder.hasMany(PurchaseAttachment, { foreignKey: 'purchaseOrderId', as: 'attachments' });
PurchaseAttachment.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'order' });

User.hasMany(PurchaseOrder, { foreignKey: 'createdBy', as: 'createdPurchaseOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(PurchaseOrder, { foreignKey: 'updatedBy', as: 'updatedPurchaseOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

  User.hasMany(PurchaseAttachment, { foreignKey: 'uploadedBy', as: 'uploadedPurchaseAttachments' });
  PurchaseAttachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

  User.hasOne(ServicemanFinancialProfile, {
    foreignKey: 'servicemanId',
    as: 'servicemanFinancialProfile'
  });
  ServicemanFinancialProfile.belongsTo(User, { foreignKey: 'servicemanId', as: 'serviceman' });

  User.hasMany(ServicemanFinancialEarning, {
    foreignKey: 'servicemanId',
    as: 'servicemanFinancialEarnings'
  });
  ServicemanFinancialEarning.belongsTo(User, { foreignKey: 'servicemanId', as: 'serviceman' });
  ServicemanFinancialEarning.belongsTo(User, { foreignKey: 'recordedBy', as: 'recordedByUser' });
  ServicemanFinancialEarning.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

  User.hasMany(ServicemanExpenseClaim, {
    foreignKey: 'servicemanId',
    as: 'servicemanExpenseClaims'
  });
  ServicemanExpenseClaim.belongsTo(User, { foreignKey: 'servicemanId', as: 'serviceman' });
  ServicemanExpenseClaim.belongsTo(User, { foreignKey: 'approvedBy', as: 'approvedByUser' });

  User.hasMany(ServicemanAllowance, {
    foreignKey: 'servicemanId',
    as: 'servicemanAllowances'
  });
  ServicemanAllowance.belongsTo(User, { foreignKey: 'servicemanId', as: 'serviceman' });
  ServicemanAllowance.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
  ServicemanAllowance.belongsTo(User, { foreignKey: 'updatedBy', as: 'updatedByUser' });

  FinanceTransactionHistory.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
  Payment.hasMany(FinanceTransactionHistory, { foreignKey: 'paymentId', as: 'history' });

FinanceTransactionHistory.belongsTo(PayoutRequest, { foreignKey: 'payoutRequestId', as: 'payoutRequest' });
PayoutRequest.hasMany(FinanceTransactionHistory, { foreignKey: 'payoutRequestId', as: 'history' });

FinanceTransactionHistory.belongsTo(FinanceInvoice, { foreignKey: 'invoiceId', as: 'invoice' });
FinanceInvoice.hasMany(FinanceTransactionHistory, { foreignKey: 'invoiceId', as: 'history' });

FinanceWebhookEvent.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
FinanceWebhookEvent.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
FinanceWebhookEvent.belongsTo(Escrow, { foreignKey: 'escrowId', as: 'escrow' });
Order.hasMany(FinanceWebhookEvent, { foreignKey: 'orderId', as: 'financeEvents' });
Payment.hasMany(FinanceWebhookEvent, { foreignKey: 'paymentId', as: 'webhookEvents' });
Escrow.hasMany(FinanceWebhookEvent, { foreignKey: 'escrowId', as: 'webhookEvents' });

WalletAccount.hasMany(WalletTransaction, {
  foreignKey: 'walletAccountId',
  sourceKey: 'id',
  as: 'transactions'
});
WalletTransaction.belongsTo(WalletAccount, {
  foreignKey: 'walletAccountId',
  targetKey: 'id',
  as: 'walletAccount'
});
DisputeHealthBucket.hasMany(DisputeHealthEntry, { foreignKey: 'bucketId', as: 'entries' });
DisputeHealthEntry.belongsTo(DisputeHealthBucket, { foreignKey: 'bucketId', as: 'bucket' });
InboxQueue.hasMany(Conversation, { foreignKey: 'queueId', as: 'conversations' });
Conversation.belongsTo(InboxQueue, { foreignKey: 'queueId', as: 'queue' });

InboxQueue.hasMany(InboxTemplate, { foreignKey: 'queueId', as: 'templates' });
InboxTemplate.belongsTo(InboxQueue, { foreignKey: 'queueId', as: 'queue' });

InboxConfiguration.belongsTo(InboxQueue, { foreignKey: 'defaultQueueId', as: 'defaultQueue' });

Company.hasMany(MarketplaceItem, { foreignKey: 'companyId' });
MarketplaceItem.belongsTo(Company, { foreignKey: 'companyId' });

Region.hasMany(MarketplaceItem, { foreignKey: 'regionId', as: 'marketplaceItems' });
MarketplaceItem.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Company.hasMany(ComplianceDocument, { foreignKey: 'companyId' });
ComplianceDocument.belongsTo(Company, { foreignKey: 'companyId' });
ComplianceDocument.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
ComplianceDocument.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

Company.hasMany(ComplianceControl, { foreignKey: 'companyId', as: 'complianceControls' });
ComplianceControl.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
User.hasMany(ComplianceControl, { foreignKey: 'ownerId', as: 'ownedComplianceControls' });
ComplianceControl.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Company.hasOne(InsuredSellerApplication, { foreignKey: 'companyId' });
InsuredSellerApplication.belongsTo(Company, { foreignKey: 'companyId' });
InsuredSellerApplication.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

MarketplaceItem.hasMany(MarketplaceModerationAction, {
  foreignKey: 'entity_id',
  constraints: false,
  scope: { entity_type: 'marketplace_item' },
  as: 'moderationActions'
});
MarketplaceModerationAction.belongsTo(MarketplaceItem, {
  foreignKey: 'entity_id',
  constraints: false
});
MarketplaceModerationAction.belongsTo(User, { foreignKey: 'actorId', as: 'actor', constraints: false });

MarketplaceItem.hasMany(StorefrontRevisionLog, { foreignKey: 'marketplaceItemId', as: 'revisionLogs' });
StorefrontRevisionLog.belongsTo(MarketplaceItem, { foreignKey: 'marketplaceItemId', as: 'item' });
StorefrontRevisionLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
StorefrontRevisionLog.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
Region.hasMany(StorefrontRevisionLog, { foreignKey: 'regionId', as: 'storefrontRevisions' });

LiveFeedAuditEvent.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
User.hasMany(LiveFeedAuditEvent, { foreignKey: 'actor_id', as: 'liveFeedAuditEvents' });
LiveFeedAuditEvent.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });
User.hasMany(LiveFeedAuditEvent, { foreignKey: 'assignee_id', as: 'assignedLiveFeedAudits' });
LiveFeedAuditEvent.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Post.hasMany(LiveFeedAuditEvent, { foreignKey: 'post_id', as: 'auditEvents' });
LiveFeedAuditEvent.belongsTo(ServiceZone, { foreignKey: 'zone_id', as: 'zone' });
ServiceZone.hasMany(LiveFeedAuditEvent, { foreignKey: 'zone_id', as: 'auditEvents' });
LiveFeedAuditEvent.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(LiveFeedAuditEvent, { foreignKey: 'company_id', as: 'liveFeedAuditEvents' });
LiveFeedAuditEvent.hasMany(LiveFeedAuditNote, { foreignKey: 'audit_id', as: 'notes' });
LiveFeedAuditNote.belongsTo(LiveFeedAuditEvent, { foreignKey: 'audit_id', as: 'audit' });
LiveFeedAuditNote.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
User.hasMany(LiveFeedAuditNote, { foreignKey: 'author_id', as: 'liveFeedAuditNotes' });
ServiceTaxonomyType.hasMany(ServiceTaxonomyCategory, { foreignKey: 'typeId', as: 'categories' });
ServiceTaxonomyCategory.belongsTo(ServiceTaxonomyType, { foreignKey: 'typeId', as: 'type' });
SecuritySignalConfig.hasMany(SecurityAutomationTask, {
  sourceKey: 'metricKey',
  foreignKey: 'signalKey',
  as: 'automationTasks'
});
SecurityAutomationTask.belongsTo(SecuritySignalConfig, {
  foreignKey: 'signalKey',
  targetKey: 'metricKey',
  as: 'signal'
});

AdCampaign.belongsTo(Company, { foreignKey: 'companyId' });
Company.hasMany(AdCampaign, { foreignKey: 'companyId' });

AdCampaign.hasMany(CampaignFlight, { foreignKey: 'campaignId', as: 'flights' });
CampaignFlight.belongsTo(AdCampaign, { foreignKey: 'campaignId' });

AdCampaign.hasMany(CampaignTargetingRule, { foreignKey: 'campaignId', as: 'targetingRules' });
CampaignTargetingRule.belongsTo(AdCampaign, { foreignKey: 'campaignId' });

AdCampaign.hasMany(CampaignInvoice, { foreignKey: 'campaignId', as: 'invoices' });
CampaignInvoice.belongsTo(AdCampaign, { foreignKey: 'campaignId' });
CampaignInvoice.belongsTo(CampaignFlight, { foreignKey: 'flightId' });
CampaignInvoice.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
CampaignInvoice.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
Region.hasMany(CampaignInvoice, { foreignKey: 'regionId', as: 'campaignInvoices' });

AdCampaign.hasMany(CampaignDailyMetric, { foreignKey: 'campaignId', as: 'dailyMetrics' });
CampaignDailyMetric.belongsTo(AdCampaign, { foreignKey: 'campaignId' });
CampaignDailyMetric.belongsTo(CampaignFlight, { foreignKey: 'flightId' });

AdCampaign.hasMany(CampaignCreative, { foreignKey: 'campaignId', as: 'creatives' });
CampaignCreative.belongsTo(AdCampaign, { foreignKey: 'campaignId', as: 'campaign' });

CampaignDailyMetric.hasOne(CampaignAnalyticsExport, {
  foreignKey: 'campaignDailyMetricId',
  as: 'analyticsExport'
});
CampaignAnalyticsExport.belongsTo(CampaignDailyMetric, {
  foreignKey: 'campaignDailyMetricId',
  as: 'dailyMetric'
});

FinanceTransactionHistory.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
FinanceTransactionHistory.belongsTo(Escrow, { foreignKey: 'escrowId', as: 'escrow' });
FinanceTransactionHistory.belongsTo(Dispute, { foreignKey: 'disputeId', as: 'dispute' });
FinanceTransactionHistory.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
FinanceTransactionHistory.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
Region.hasMany(FinanceTransactionHistory, { foreignKey: 'regionId', as: 'financeHistory' });
Order.hasMany(FinanceTransactionHistory, { foreignKey: 'orderId', as: 'financeHistory' });
Escrow.hasMany(FinanceTransactionHistory, { foreignKey: 'escrowId', as: 'financeEvents' });
Dispute.hasMany(FinanceTransactionHistory, { foreignKey: 'disputeId', as: 'financeEvents' });

AdCampaign.hasMany(CampaignFraudSignal, { foreignKey: 'campaignId', as: 'fraudSignals' });
CampaignFraudSignal.belongsTo(AdCampaign, { foreignKey: 'campaignId' });
CampaignFraudSignal.belongsTo(CampaignFlight, { foreignKey: 'flightId' });

AdCampaign.hasMany(CampaignCreative, { foreignKey: 'campaignId', as: 'creatives' });
CampaignCreative.belongsTo(AdCampaign, { foreignKey: 'campaignId' });
CampaignCreative.belongsTo(CampaignFlight, { foreignKey: 'flightId', as: 'flight' });

AdCampaign.hasMany(CampaignAudienceSegment, { foreignKey: 'campaignId', as: 'audienceSegments' });
CampaignAudienceSegment.belongsTo(AdCampaign, { foreignKey: 'campaignId' });

AdCampaign.hasMany(CampaignPlacement, { foreignKey: 'campaignId', as: 'placements' });
CampaignPlacement.belongsTo(AdCampaign, { foreignKey: 'campaignId' });
CampaignPlacement.belongsTo(CampaignFlight, { foreignKey: 'flightId', as: 'flight' });

Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

Conversation.hasMany(ConversationMessage, { foreignKey: 'conversationId', as: 'messages' });
ConversationMessage.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

Region.hasMany(Conversation, { foreignKey: 'regionId', as: 'conversations' });
Conversation.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
Region.hasMany(ConversationMessage, { foreignKey: 'regionId', as: 'messages' });
ConversationMessage.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

ConversationParticipant.hasMany(ConversationMessage, {
  foreignKey: 'senderParticipantId',
  as: 'outboundMessages'
});
ConversationMessage.belongsTo(ConversationParticipant, {
  foreignKey: 'senderParticipantId',
  as: 'sender'
});

ConversationMessage.hasMany(MessageDelivery, { foreignKey: 'conversationMessageId', as: 'deliveries' });
MessageDelivery.belongsTo(ConversationMessage, { foreignKey: 'conversationMessageId', as: 'message' });

Region.hasMany(MessageDelivery, { foreignKey: 'regionId', as: 'deliveries' });
MessageDelivery.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

ConversationMessage.hasMany(MessageHistory, { foreignKey: 'messageId', as: 'history' });
MessageHistory.belongsTo(ConversationMessage, { foreignKey: 'messageId', as: 'message' });
MessageHistory.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

ConversationParticipant.hasMany(MessageDelivery, { foreignKey: 'participantId', as: 'deliveries' });
MessageDelivery.belongsTo(ConversationParticipant, { foreignKey: 'participantId', as: 'participant' });

AccountSupportTask.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(AccountSupportTask, { foreignKey: 'companyId', as: 'accountSupportTasks' });

AccountSupportTask.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AccountSupportTask, { foreignKey: 'userId', as: 'accountSupportTasks' });

AccountSupportTask.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

AccountSupportTask.hasMany(AccountSupportTaskUpdate, { foreignKey: 'taskId', as: 'updates' });
AccountSupportTaskUpdate.belongsTo(AccountSupportTask, { foreignKey: 'taskId', as: 'task' });
OperationsQueueBoard.hasMany(OperationsQueueUpdate, { foreignKey: 'boardId', as: 'updates' });
OperationsQueueUpdate.belongsTo(OperationsQueueBoard, { foreignKey: 'boardId', as: 'board' });
CommunicationsInboxConfiguration.hasMany(CommunicationsEntryPoint, {
  foreignKey: 'configurationId',
  as: 'entryPoints'
});
CommunicationsEntryPoint.belongsTo(CommunicationsInboxConfiguration, {
  foreignKey: 'configurationId',
  as: 'configuration'
});

CommunicationsInboxConfiguration.hasMany(CommunicationsQuickReply, {
  foreignKey: 'configurationId',
  as: 'quickReplies'
});
CommunicationsQuickReply.belongsTo(CommunicationsInboxConfiguration, {
  foreignKey: 'configurationId',
  as: 'configuration'
});

CommunicationsInboxConfiguration.hasMany(CommunicationsEscalationRule, {
  foreignKey: 'configurationId',
  as: 'escalationRules'
});
CommunicationsEscalationRule.belongsTo(CommunicationsInboxConfiguration, {
  foreignKey: 'configurationId',
  as: 'configuration'
});

User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SecurityAuditEvent, { foreignKey: 'userId', as: 'securityAuditEvents' });
SecurityAuditEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

AdminAuditEvent.belongsTo(User, { foreignKey: 'created_by', as: 'createdByUser', constraints: false });
AdminAuditEvent.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser', constraints: false });

User.hasMany(ConsentEvent, { foreignKey: 'userId', as: 'consentEvents' });
ConsentEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Company.hasMany(InventoryItem, { foreignKey: 'companyId' });
InventoryItem.belongsTo(Company, { foreignKey: 'companyId' });

InventoryCategory.hasMany(InventoryItem, { foreignKey: 'categoryId', as: 'items' });
InventoryItem.belongsTo(InventoryCategory, { foreignKey: 'categoryId', as: 'categoryRef' });

InventoryLocationZone.hasMany(InventoryItem, { foreignKey: 'locationZoneId', as: 'items' });
InventoryItem.belongsTo(InventoryLocationZone, { foreignKey: 'locationZoneId', as: 'locationZone' });

InventoryItem.hasMany(InventoryLedgerEntry, { foreignKey: 'itemId' });
InventoryLedgerEntry.belongsTo(InventoryItem, { foreignKey: 'itemId' });

InventoryItem.hasMany(InventoryAlert, { foreignKey: 'itemId' });
InventoryAlert.belongsTo(InventoryItem, { foreignKey: 'itemId' });

InventoryItem.belongsToMany(InventoryTag, {
  through: InventoryItemTag,
  foreignKey: 'itemId',
  otherKey: 'tagId',
  as: 'tags'
});
InventoryTag.belongsToMany(InventoryItem, {
  through: InventoryItemTag,
  foreignKey: 'tagId',
  otherKey: 'itemId',
  as: 'items'
});

InventoryItem.hasMany(InventoryItemMedia, { foreignKey: 'itemId', as: 'media' });
InventoryItemMedia.belongsTo(InventoryItem, { foreignKey: 'itemId', as: 'item' });

InventoryItem.hasMany(InventoryItemSupplier, { foreignKey: 'itemId', as: 'supplierLinks' });
InventoryItemSupplier.belongsTo(InventoryItem, { foreignKey: 'itemId', as: 'item' });
InventoryItemSupplier.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(InventoryItemSupplier, { foreignKey: 'supplierId', as: 'inventoryLinks' });

InventoryItem.hasMany(RentalAgreement, { foreignKey: 'itemId' });
RentalAgreement.belongsTo(InventoryItem, { foreignKey: 'itemId' });

InventoryItem.hasOne(ToolSaleProfile, { foreignKey: 'inventoryItemId', as: 'toolSaleProfile' });
ToolSaleProfile.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId', as: 'inventoryItem' });

MarketplaceItem.hasOne(ToolSaleProfile, { foreignKey: 'marketplaceItemId', as: 'toolSaleProfile' });
ToolSaleProfile.belongsTo(MarketplaceItem, { foreignKey: 'marketplaceItemId', as: 'marketplaceItem' });

Company.hasMany(ToolSaleProfile, { foreignKey: 'companyId', as: 'toolSaleProfiles' });
ToolSaleProfile.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

ToolSaleProfile.hasMany(ToolSaleCoupon, { foreignKey: 'toolSaleProfileId', as: 'coupons' });
ToolSaleCoupon.belongsTo(ToolSaleProfile, { foreignKey: 'toolSaleProfileId', as: 'profile' });

Company.hasMany(ToolSaleCoupon, { foreignKey: 'companyId', as: 'toolSaleCoupons' });
ToolSaleCoupon.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

MarketplaceItem.hasMany(RentalAgreement, { foreignKey: 'marketplaceItemId' });
RentalAgreement.belongsTo(MarketplaceItem, { foreignKey: 'marketplaceItemId' });

Company.hasMany(RentalAgreement, { foreignKey: 'companyId' });
RentalAgreement.belongsTo(Company, { foreignKey: 'companyId' });

Region.hasMany(RentalAgreement, { foreignKey: 'regionId', as: 'rentalAgreements' });
RentalAgreement.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

User.hasMany(RentalAgreement, { foreignKey: 'renterId', as: 'Rentals' });
RentalAgreement.belongsTo(User, { as: 'renter', foreignKey: 'renterId' });

Booking.hasMany(RentalAgreement, { foreignKey: 'bookingId' });
RentalAgreement.belongsTo(Booking, { foreignKey: 'bookingId' });

RentalAgreement.hasMany(RentalCheckpoint, { foreignKey: 'rentalAgreementId' });
RentalCheckpoint.belongsTo(RentalAgreement, { foreignKey: 'rentalAgreementId' });

Company.hasMany(ServiceZone, { foreignKey: 'companyId' });
ServiceZone.belongsTo(Company, { foreignKey: 'companyId' });

ServiceZone.hasMany(ZoneAnalyticsSnapshot, { foreignKey: 'zoneId' });
ZoneAnalyticsSnapshot.belongsTo(ServiceZone, { foreignKey: 'zoneId' });

ServiceZone.hasMany(Booking, { foreignKey: 'zoneId' });
Booking.belongsTo(ServiceZone, { foreignKey: 'zoneId' });

ServiceZone.hasMany(ServiceZoneCoverage, { foreignKey: 'zoneId', as: 'coverages' });
ServiceZoneCoverage.belongsTo(ServiceZone, { foreignKey: 'zoneId', as: 'zone' });

Service.hasMany(ServiceZoneCoverage, { foreignKey: 'serviceId', as: 'zoneCoverage' });
ServiceZoneCoverage.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

User.hasOne(AffiliateProfile, { foreignKey: 'userId', as: 'affiliateProfile' });
AffiliateProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(AdminProfile, { foreignKey: 'userId', as: 'adminProfile' });
AdminProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

AffiliateProfile.hasMany(AffiliateReferral, { foreignKey: 'affiliateProfileId', as: 'referrals' });
AffiliateReferral.belongsTo(AffiliateProfile, { foreignKey: 'affiliateProfileId', as: 'affiliate' });
AffiliateReferral.belongsTo(User, { foreignKey: 'referredUserId', as: 'referredUser' });

AffiliateProfile.hasMany(AffiliateLedgerEntry, { foreignKey: 'affiliateProfileId', as: 'ledgerEntries' });
AffiliateLedgerEntry.belongsTo(AffiliateProfile, { foreignKey: 'affiliateProfileId', as: 'affiliate' });
AffiliateLedgerEntry.belongsTo(AffiliateReferral, { foreignKey: 'referralId', as: 'referral' });
AffiliateLedgerEntry.belongsTo(AffiliateCommissionRule, { foreignKey: 'commissionRuleId', as: 'commissionRule' });

AffiliateCommissionRule.hasMany(AffiliateLedgerEntry, { foreignKey: 'commissionRuleId', as: 'ledgerEntries' });

User.hasMany(DataSubjectRequest, { foreignKey: 'userId', as: 'dataSubjectRequests' });
DataSubjectRequest.belongsTo(User, { foreignKey: 'userId', as: 'requester' });
Region.hasMany(DataSubjectRequest, { foreignKey: 'regionId', as: 'dataSubjectRequests' });
DataSubjectRequest.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Region.hasMany(WarehouseExportRun, { foreignKey: 'regionId', as: 'warehouseExports' });
WarehouseExportRun.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
User.hasMany(WarehouseExportRun, { foreignKey: 'triggeredBy', as: 'warehouseExportRuns' });
WarehouseExportRun.belongsTo(User, { foreignKey: 'triggeredBy', as: 'triggeredByUser' });

AppearanceProfile.hasMany(AppearanceAsset, { foreignKey: 'profileId', as: 'assets' });
AppearanceAsset.belongsTo(AppearanceProfile, { foreignKey: 'profileId', as: 'profile' });

AppearanceProfile.hasMany(AppearanceVariant, { foreignKey: 'profileId', as: 'variants' });
AppearanceVariant.belongsTo(AppearanceProfile, { foreignKey: 'profileId', as: 'profile' });
LegalDocument.hasMany(LegalDocumentVersion, { foreignKey: 'documentId', as: 'versions' });
LegalDocument.belongsTo(LegalDocumentVersion, {
  foreignKey: 'currentVersionId',
  as: 'currentVersion'
});
LegalDocumentVersion.belongsTo(LegalDocument, { foreignKey: 'documentId', as: 'document' });
User.hasMany(WalletAccount, { foreignKey: 'userId', as: 'walletAccounts' });
WalletAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Company.hasMany(WalletAccount, { foreignKey: 'companyId', as: 'walletAccounts' });
WalletAccount.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

WalletAccount.hasMany(WalletTransaction, { foreignKey: 'walletAccountId', as: 'transactions' });
WalletTransaction.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });

WalletAccount.hasMany(WalletPaymentMethod, { foreignKey: 'walletAccountId', as: 'paymentMethods' });
WalletPaymentMethod.belongsTo(WalletAccount, { foreignKey: 'walletAccountId', as: 'walletAccount' });

WalletAccount.belongsTo(WalletPaymentMethod, { foreignKey: 'autopayoutMethodId', as: 'autopayoutMethod' });

Company.hasMany(Booking, { foreignKey: 'companyId' });
Booking.belongsTo(Company, { foreignKey: 'companyId' });

User.hasMany(Booking, { foreignKey: 'customerId' });
Booking.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

Booking.hasMany(BookingAssignment, { foreignKey: 'bookingId' });
BookingAssignment.belongsTo(Booking, { foreignKey: 'bookingId' });
User.hasMany(BookingAssignment, { foreignKey: 'providerId', as: 'providerAssignments' });
BookingAssignment.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

Booking.hasMany(ProviderCalendarEvent, { foreignKey: 'bookingId', as: 'calendarEvents' });
ProviderCalendarEvent.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
User.hasMany(BookingAssignment, { foreignKey: 'providerId', as: 'bookingAssignments' });
BookingAssignment.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

User.hasMany(BookingAssignment, { foreignKey: 'providerId', as: 'bookingAssignments' });
BookingAssignment.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

Booking.hasMany(BookingBid, { foreignKey: 'bookingId' });
BookingBid.belongsTo(Booking, { foreignKey: 'bookingId' });

BookingBid.hasMany(BookingBidComment, { foreignKey: 'bidId' });
BookingBidComment.belongsTo(BookingBid, { foreignKey: 'bidId' });

Booking.hasMany(BookingNote, { foreignKey: 'bookingId', as: 'notes' });
BookingNote.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Booking.hasMany(BookingHistoryEntry, { foreignKey: 'bookingId', as: 'history' });
BookingHistoryEntry.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

BlogPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(BlogPost, { foreignKey: 'authorId', as: 'blogPosts' });

EnterpriseAccount.hasMany(EnterpriseSite, {
  foreignKey: 'enterpriseAccountId',
  as: 'sites',
  onDelete: 'CASCADE',
  hooks: true
});
EnterpriseSite.belongsTo(EnterpriseAccount, { foreignKey: 'enterpriseAccountId', as: 'account' });

EnterpriseAccount.hasMany(EnterpriseStakeholder, {
  foreignKey: 'enterpriseAccountId',
  as: 'stakeholders',
  onDelete: 'CASCADE',
  hooks: true
});
EnterpriseStakeholder.belongsTo(EnterpriseAccount, { foreignKey: 'enterpriseAccountId', as: 'account' });

EnterpriseAccount.hasMany(EnterprisePlaybook, {
  foreignKey: 'enterpriseAccountId',
  as: 'playbooks',
  onDelete: 'CASCADE',
  hooks: true
});
EnterprisePlaybook.belongsTo(EnterpriseAccount, { foreignKey: 'enterpriseAccountId', as: 'account' });

BlogPost.belongsToMany(BlogCategory, {
  through: BlogPostCategory,
  foreignKey: 'postId',
  otherKey: 'categoryId',
  as: 'categories'
});
BlogCategory.belongsToMany(BlogPost, {
  through: BlogPostCategory,
  foreignKey: 'categoryId',
  otherKey: 'postId',
  as: 'posts'
});

BlogPost.belongsToMany(BlogTag, {
  through: BlogPostTag,
  foreignKey: 'postId',
  otherKey: 'tagId',
  as: 'tags'
});
BlogTag.belongsToMany(BlogPost, {
  through: BlogPostTag,
  foreignKey: 'tagId',
  otherKey: 'postId',
  as: 'posts'
});

BlogPost.hasMany(BlogMedia, { foreignKey: 'postId', as: 'media' });
BlogMedia.belongsTo(BlogPost, { foreignKey: 'postId', as: 'post' });

BlogPost.hasMany(BlogPostRevision, { foreignKey: 'postId', as: 'revisions' });
BlogPostRevision.belongsTo(BlogPost, { foreignKey: 'postId', as: 'post' });
BlogPostRevision.belongsTo(User, { foreignKey: 'recordedById', as: 'recordedBy' });
User.hasMany(BlogPostRevision, { foreignKey: 'recordedById', as: 'recordedBlogRevisions' });
RbacRole.hasMany(RbacRolePermission, { foreignKey: 'roleId', as: 'permissionEntries' });
RbacRolePermission.belongsTo(RbacRole, { foreignKey: 'roleId', as: 'role' });

RbacRole.hasMany(RbacRoleInheritance, { foreignKey: 'roleId', as: 'inheritanceEntries' });
RbacRoleInheritance.belongsTo(RbacRole, { foreignKey: 'roleId', as: 'role' });
RbacRoleInheritance.belongsTo(RbacRole, { foreignKey: 'parentRoleId', as: 'parentRole' });

RbacRole.hasMany(RbacRoleAssignment, { foreignKey: 'roleId', as: 'assignments' });
RbacRoleAssignment.belongsTo(RbacRole, { foreignKey: 'roleId', as: 'role' });

User.hasMany(RbacRoleAssignment, { foreignKey: 'userId', as: 'roleAssignments' });
RbacRoleAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
RbacRoleAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });
HomePage.hasMany(HomePageSection, {
  foreignKey: 'homePageId',
  as: 'sections',
  onDelete: 'CASCADE',
  hooks: true
});
HomePageSection.belongsTo(HomePage, { foreignKey: 'homePageId', as: 'page' });

HomePageSection.hasMany(HomePageComponent, {
  foreignKey: 'sectionId',
  as: 'components',
  onDelete: 'CASCADE',
  hooks: true
});
HomePageComponent.belongsTo(HomePageSection, { foreignKey: 'sectionId', as: 'section' });

HomePage.hasMany(HomePageComponent, {
  foreignKey: 'homePageId',
  as: 'components',
  onDelete: 'CASCADE',
  hooks: true
});
HomePageComponent.belongsTo(HomePage, { foreignKey: 'homePageId', as: 'page' });
ServicemanByokProfile.belongsTo(User, { foreignKey: 'userId', as: 'serviceman' });
User.hasOne(ServicemanByokProfile, { foreignKey: 'userId', as: 'servicemanByokProfile' });
ServicemanByokProfile.hasMany(ServicemanByokConnector, { foreignKey: 'profileId', as: 'connectors' });
ServicemanByokConnector.belongsTo(ServicemanByokProfile, { foreignKey: 'profileId', as: 'profile' });
ServicemanByokProfile.hasMany(ServicemanByokAuditEvent, { foreignKey: 'profileId', as: 'auditEvents' });
ServicemanByokAuditEvent.belongsTo(ServicemanByokProfile, { foreignKey: 'profileId', as: 'profile' });
ServicemanByokConnector.hasMany(ServicemanByokAuditEvent, { foreignKey: 'connectorId', as: 'auditTrail' });
ServicemanByokAuditEvent.belongsTo(ServicemanByokConnector, { foreignKey: 'connectorId', as: 'connector' });
export default sequelize;
WebsitePage.hasMany(WebsiteContentBlock, { foreignKey: 'pageId', as: 'blocks' });
WebsiteContentBlock.belongsTo(WebsitePage, { foreignKey: 'pageId', as: 'page' });

WebsiteNavigationMenu.hasMany(WebsiteNavigationItem, { foreignKey: 'menuId', as: 'items' });
WebsiteNavigationItem.belongsTo(WebsiteNavigationMenu, { foreignKey: 'menuId', as: 'menu' });
WebsiteNavigationItem.belongsTo(WebsiteNavigationItem, { foreignKey: 'parentId', as: 'parent' });
WebsiteNavigationItem.hasMany(WebsiteNavigationItem, { foreignKey: 'parentId', as: 'children' });

export {
  sequelize,
  User,
  UserProfileSetting,
  ServicemanProfileSetting,
  Company,
  UserPreference,
  Service,
  ServiceCategory,
  Post,
  MarketplaceItem,
  ServiceZone,
  ServiceZoneCoverage,
  Order,
  OrderNote,
  Escrow,
  EscrowMilestone,
    EscrowNote,
    EscrowWorkLog,
  Dispute,
  ServicemanProfile,
  ServicemanShiftRule,
  ServicemanCertification,
  ServicemanEquipmentItem,
  UiPreferenceTelemetry,
  UiPreferenceTelemetrySnapshot,
  ZoneAnalyticsSnapshot,
  ProviderProfile,
  ProviderContact,
  ProviderCoverage,
  Booking,
  BookingAssignment,
  BookingBid,
  BookingBidComment,
  BookingNote,
  BookingTemplate,
  BookingHistoryEntry,
  ProviderCalendarSetting,
  ProviderCalendarEvent,
  ServicemanBookingSetting,
  CustomJobBid,
  CustomJobBidMessage,
  CustomJobInvitation,
  CustomJobReport,
  InventoryItem,
  InventoryLedgerEntry,
  InventoryAlert,
  InventoryCategory,
  InventoryTag,
  InventoryItemTag,
  InventoryItemMedia,
  InventoryItemSupplier,
  InventoryLocationZone,
  ToolSaleProfile,
  ToolSaleCoupon,
  RentalAgreement,
  RentalCheckpoint,
  ComplianceDocument,
  ComplianceControl,
  InsuredSellerApplication,
  MarketplaceModerationAction,
  AdCampaign,
  CampaignCreative,
  CampaignFlight,
  CampaignTargetingRule,
  CampaignInvoice,
  CampaignDailyMetric,
  CampaignFraudSignal,
  CampaignAnalyticsExport,
  CampaignCreative,
  CampaignAudienceSegment,
  CampaignPlacement,
  AnalyticsEvent,
  AnalyticsPipelineRun,
  Conversation,
  ConversationParticipant,
  ConversationMessage,
  MessageDelivery,
  AccountSupportTask,
  AccountSupportTaskUpdate,
  AdminUserProfile,
  CustomJobBid,
  CustomJobBidMessage,
  PlatformSetting,
  CommunicationsInboxConfiguration,
  CommunicationsEntryPoint,
  CommunicationsQuickReply,
  CommunicationsEscalationRule,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPostCategory,
  BlogPostTag,
  BlogPostRevision,
  WebsitePage,
  WebsiteContentBlock,
  WebsiteNavigationMenu,
  WebsiteNavigationItem,
  AffiliateProfile,
  AdminProfile,
  AffiliateCommissionRule,
  AffiliateReferral,
  AffiliateLedgerEntry,
  SecurityAuditEvent,
  AdminAuditEvent,
  SecuritySignalConfig,
  SecurityAutomationTask,
  TelemetryConnector,
  UserSession,
  ConsentEvent,
  Region,
  DataSubjectRequest,
  FinanceTransactionHistory,
  Payment,
  PayoutRequest,
  FinanceInvoice,
  FinanceWebhookEvent,
  MessageHistory,
  StorefrontRevisionLog,
  WarehouseExportRun,
  WalletConfiguration,
  WalletAccount,
  WalletTransaction,
  ProviderProfile,
  ProviderWebsitePreference,
  ProviderContact,
  ProviderCoverage,
  ProviderServiceman,
  ProviderServicemanAvailability,
  ProviderServicemanZone,
  ProviderServicemanMedia,
  WalletPaymentMethod,
  ProviderProfile,
  ProviderContact,
  ProviderCoverage,
  ProviderTaxProfile,
  ProviderTaxFiling,
  ProviderProfile,
  ProviderContact,
  ProviderCoverage,
  ProviderCrewMember,
  ProviderCrewAvailability,
  ProviderCrewDeployment,
  ProviderCrewDelegation,
  ProviderEscrowPolicy,
  ProviderProfile,
  ProviderContact,
  ProviderCoverage,
  RbacRole,
  RbacRolePermission,
  RbacRoleInheritance,
  RbacRoleAssignment,
  AdminProfile,
  AdminDelegate,
  DisputeHealthBucket,
  DisputeHealthEntry,
  CommandMetricSetting,
  CommandMetricCard,
  OperationsQueueBoard,
  OperationsQueueUpdate,
  AutomationInitiative,
  ServicemanMetricSetting,
  ServicemanMetricCard,
  OperationsQueueBoard,
  OperationsQueueUpdate,
  AutomationInitiative,
  AdminUserProfile,
  EnterpriseAccount,
  EnterpriseSite,
  EnterpriseStakeholder,
  EnterprisePlaybook,
  EnterpriseUpgradeRequest,
  EnterpriseUpgradeContact,
  EnterpriseUpgradeSite,
  EnterpriseUpgradeChecklistItem,
  EnterpriseUpgradeDocument,
  AppearanceProfile,
  AppearanceAsset,
  AppearanceVariant,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  ServicemanIdentity,
  ServicemanIdentityDocument,
  ServicemanIdentityCheck,
  ServicemanIdentityWatcher,
  ServicemanIdentityEvent,
  PurchaseAttachment,
  PurchaseBudget,
  ServicemanFinancialProfile,
  ServicemanFinancialEarning,
  ServicemanExpenseClaim,
  ServicemanAllowance,
  HomePage,
  HomePageSection,
  HomePageComponent,
  LegalDocument,
  LegalDocumentVersion,
  LiveFeedAuditEvent,
  LiveFeedAuditNote,
  SystemSettingAudit,
  ServiceTaxonomyType,
  ServiceTaxonomyCategory,
  WalletAccount,
  WalletTransaction,
  WalletPaymentMethod,
  CustomerProfile,
  CustomerContact,
  CustomerLocation,
  CustomerCoupon,
  CustomerAccountSetting,
  CustomerNotificationRecipient,
  CustomerDisputeCase,
  CustomerDisputeTask,
  CustomerDisputeNote,
  CustomerDisputeEvidence,
  CustomerCoupon,
  InboxQueue,
  InboxConfiguration,
  InboxTemplate,
  ServicemanByokProfile,
  ServicemanByokConnector,
  ServicemanByokAuditEvent
};

export default sequelize;

export { default as ServicemanPayment, SERVICEMAN_PAYMENT_STATUSES } from './servicemanPayment.js';
export { default as ServicemanCommissionRule, SERVICEMAN_COMMISSION_RATE_TYPES, SERVICEMAN_COMMISSION_APPROVAL_STATUSES } from './servicemanCommissionRule.js';
export { ProviderStorefront, ProviderStorefrontInventory, ProviderStorefrontCoupon };

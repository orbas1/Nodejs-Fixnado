import sequelize from '../config/database.js';
import User from './user.js';
import UserProfileSetting from './userProfileSetting.js';
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
import Dispute from './dispute.js';
import UiPreferenceTelemetry from './uiPreferenceTelemetry.js';
import UiPreferenceTelemetrySnapshot from './uiPreferenceTelemetrySnapshot.js';
import ZoneAnalyticsSnapshot from './zoneAnalyticsSnapshot.js';
import Booking from './booking.js';
import BookingAssignment from './bookingAssignment.js';
import BookingBid from './bookingBid.js';
import BookingBidComment from './bookingBidComment.js';
import BookingHistoryEntry from './bookingHistoryEntry.js';
import InventoryItem from './inventoryItem.js';
import InventoryLedgerEntry from './inventoryLedgerEntry.js';
import InventoryAlert from './inventoryAlert.js';
import RentalAgreement from './rentalAgreement.js';
import RentalCheckpoint from './rentalCheckpoint.js';
import ComplianceDocument from './complianceDocument.js';
import ComplianceControl from './complianceControl.js';
import InsuredSellerApplication from './insuredSellerApplication.js';
import MarketplaceModerationAction from './marketplaceModerationAction.js';
import AdCampaign from './adCampaign.js';
import CampaignFlight from './campaignFlight.js';
import CampaignTargetingRule from './campaignTargetingRule.js';
import CampaignInvoice from './campaignInvoice.js';
import CampaignDailyMetric from './campaignDailyMetric.js';
import CampaignFraudSignal from './campaignFraudSignal.js';
import CampaignAnalyticsExport from './campaignAnalyticsExport.js';
import AnalyticsEvent from './analyticsEvent.js';
import AnalyticsPipelineRun from './analyticsPipelineRun.js';
import Conversation from './conversation.js';
import ConversationParticipant from './conversationParticipant.js';
import ConversationMessage from './conversationMessage.js';
import MessageDelivery from './messageDelivery.js';
import AdminUserProfile from './adminUserProfile.js';
import CustomJobBid from './customJobBid.js';
import CustomJobBidMessage from './customJobBidMessage.js';
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
import WebsitePage from './websitePage.js';
import WebsiteContentBlock from './websiteContentBlock.js';
import WebsiteNavigationMenu from './websiteNavigationMenu.js';
import WebsiteNavigationItem from './websiteNavigationItem.js';
import AffiliateProfile from './affiliateProfile.js';
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
import DisputeHealthBucket from './disputeHealthBucket.js';
import DisputeHealthEntry from './disputeHealthEntry.js';
import AutomationInitiative from './automationInitiative.js';
import EnterpriseAccount from './enterpriseAccount.js';
import EnterpriseSite from './enterpriseSite.js';
import EnterpriseStakeholder from './enterpriseStakeholder.js';
import EnterprisePlaybook from './enterprisePlaybook.js';
import AppearanceProfile from './appearanceProfile.js';
import AppearanceAsset from './appearanceAsset.js';
import AppearanceVariant from './appearanceVariant.js';
import Supplier from './supplier.js';
import PurchaseOrder from './purchaseOrder.js';
import PurchaseOrderItem from './purchaseOrderItem.js';
import PurchaseAttachment from './purchaseAttachment.js';
import PurchaseBudget from './purchaseBudget.js';
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
import InboxQueue from './inboxQueue.js';
import InboxConfiguration from './inboxConfiguration.js';
import InboxTemplate from './inboxTemplate.js';

User.hasOne(Company, { foreignKey: 'userId' });
Company.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(UserPreference, { foreignKey: 'userId', as: 'preferences' });
UserPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserProfileSetting, { foreignKey: 'userId', as: 'profileSettings' });
UserProfileSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(CustomerAccountSetting, { foreignKey: 'userId', as: 'accountSetting' });
CustomerAccountSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
User.hasMany(CustomerCoupon, { foreignKey: 'userId', as: 'customerCoupons' });
CustomerCoupon.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.belongsTo(ServiceZone, { foreignKey: 'zoneId', as: 'zone' });
ServiceZone.hasMany(Post, { foreignKey: 'zoneId', as: 'customJobs' });

Post.hasMany(CustomJobBid, { foreignKey: 'postId', as: 'bids' });
CustomJobBid.belongsTo(Post, { foreignKey: 'postId', as: 'job' });

CustomJobBid.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });
User.hasMany(CustomJobBid, { foreignKey: 'providerId', as: 'customJobBids' });

CustomJobBid.belongsTo(Company, { foreignKey: 'companyId', as: 'providerCompany' });
Company.hasMany(CustomJobBid, { foreignKey: 'companyId', as: 'customJobBids' });

CustomJobBid.hasMany(CustomJobBidMessage, { foreignKey: 'bidId', as: 'messages' });
CustomJobBidMessage.belongsTo(CustomJobBid, { foreignKey: 'bidId', as: 'bid' });
CustomJobBidMessage.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Company.hasMany(Service, { foreignKey: 'companyId' });
Service.belongsTo(Company, { foreignKey: 'companyId' });

ServiceCategory.hasMany(Service, { foreignKey: 'categoryId', as: 'listings' });
Service.belongsTo(ServiceCategory, { foreignKey: 'categoryId', as: 'categoryRef' });

ServiceCategory.hasMany(ServiceCategory, { foreignKey: 'parentId', as: 'children' });
ServiceCategory.belongsTo(ServiceCategory, { foreignKey: 'parentId', as: 'parent' });

User.hasMany(Service, { foreignKey: 'providerId' });
Service.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });

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

InventoryItem.hasMany(InventoryLedgerEntry, { foreignKey: 'itemId' });
InventoryLedgerEntry.belongsTo(InventoryItem, { foreignKey: 'itemId' });

InventoryItem.hasMany(InventoryAlert, { foreignKey: 'itemId' });
InventoryAlert.belongsTo(InventoryItem, { foreignKey: 'itemId' });

InventoryItem.hasMany(RentalAgreement, { foreignKey: 'itemId' });
RentalAgreement.belongsTo(InventoryItem, { foreignKey: 'itemId' });

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

Booking.hasMany(BookingBid, { foreignKey: 'bookingId' });
BookingBid.belongsTo(Booking, { foreignKey: 'bookingId' });

BookingBid.hasMany(BookingBidComment, { foreignKey: 'bidId' });
BookingBidComment.belongsTo(BookingBid, { foreignKey: 'bidId' });

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
  Dispute,
  UiPreferenceTelemetry,
  UiPreferenceTelemetrySnapshot,
  ZoneAnalyticsSnapshot,
  Booking,
  BookingAssignment,
  BookingBid,
  BookingBidComment,
  BookingHistoryEntry,
  CustomJobBid,
  CustomJobBidMessage,
  InventoryItem,
  InventoryLedgerEntry,
  InventoryAlert,
  RentalAgreement,
  RentalCheckpoint,
  ComplianceDocument,
  ComplianceControl,
  InsuredSellerApplication,
  MarketplaceModerationAction,
  AdCampaign,
  CampaignFlight,
  CampaignTargetingRule,
  CampaignInvoice,
  CampaignDailyMetric,
  CampaignFraudSignal,
  CampaignAnalyticsExport,
  AnalyticsEvent,
  AnalyticsPipelineRun,
  Conversation,
  ConversationParticipant,
  ConversationMessage,
  MessageDelivery,
  CommunicationsInboxConfiguration,
  CommunicationsEntryPoint,
  CommunicationsQuickReply,
  CommunicationsEscalationRule,
  PlatformSetting,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPostCategory,
  BlogPostTag,
  WebsitePage,
  WebsiteContentBlock,
  WebsiteNavigationMenu,
  WebsiteNavigationItem,
  AffiliateProfile,
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
  DisputeHealthBucket,
  DisputeHealthEntry
  AutomationInitiative
  AdminUserProfile
  EnterpriseAccount,
  EnterpriseSite,
  EnterpriseStakeholder,
  EnterprisePlaybook
  AppearanceProfile,
  AppearanceAsset,
  AppearanceVariant
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseAttachment,
  PurchaseBudget
  HomePage,
  HomePageSection,
  HomePageComponent
  LegalDocument,
  LegalDocumentVersion
  LiveFeedAuditEvent,
  LiveFeedAuditNote
  SystemSettingAudit
  ServiceTaxonomyType,
  ServiceTaxonomyCategory
  WalletAccount,
  WalletTransaction,
  WalletPaymentMethod
  CustomerProfile,
  CustomerContact,
  CustomerLocation,
  CustomerAccountSetting,
  CustomerNotificationRecipient,
  CustomerDisputeCase,
  CustomerDisputeTask,
  CustomerDisputeNote,
  CustomerDisputeEvidence
  CustomerCoupon,
  CustomerAccountSetting,
  CustomerNotificationRecipient,
  InboxQueue,
  InboxConfiguration,
  InboxTemplate
};

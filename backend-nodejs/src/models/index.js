import sequelize from '../config/database.js';
import User from './user.js';
import Company from './company.js';
import Service from './service.js';
import Post from './post.js';
import MarketplaceItem from './marketplaceItem.js';
import ServiceZone from './serviceZone.js';
import ServiceZoneCoverage from './serviceZoneCoverage.js';
import Order from './order.js';
import Escrow from './escrow.js';
import Dispute from './dispute.js';
import UiPreferenceTelemetry from './uiPreferenceTelemetry.js';
import UiPreferenceTelemetrySnapshot from './uiPreferenceTelemetrySnapshot.js';
import ZoneAnalyticsSnapshot from './zoneAnalyticsSnapshot.js';
import Booking from './booking.js';
import BookingAssignment from './bookingAssignment.js';
import BookingBid from './bookingBid.js';
import BookingBidComment from './bookingBidComment.js';
import InventoryItem from './inventoryItem.js';
import InventoryLedgerEntry from './inventoryLedgerEntry.js';
import InventoryAlert from './inventoryAlert.js';
import RentalAgreement from './rentalAgreement.js';
import RentalCheckpoint from './rentalCheckpoint.js';
import ComplianceDocument from './complianceDocument.js';
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
import CustomJobBid from './customJobBid.js';
import CustomJobBidMessage from './customJobBidMessage.js';
import PlatformSetting from './platformSetting.js';
import BlogPost from './blogPost.js';
import BlogCategory from './blogCategory.js';
import BlogTag from './blogTag.js';
import BlogMedia from './blogMedia.js';
import BlogPostCategory from './blogPostCategory.js';
import BlogPostTag from './blogPostTag.js';

User.hasOne(Company, { foreignKey: 'userId' });
Company.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

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

User.hasMany(Service, { foreignKey: 'providerId' });
Service.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });

Service.hasMany(Order, { foreignKey: 'serviceId' });
Order.belongsTo(Service, { foreignKey: 'serviceId' });

User.hasMany(Order, { foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });

Order.hasOne(Escrow, { foreignKey: 'orderId' });
Escrow.belongsTo(Order, { foreignKey: 'orderId' });

Escrow.hasMany(Dispute, { foreignKey: 'escrowId' });
Dispute.belongsTo(Escrow, { foreignKey: 'escrowId' });

Company.hasMany(MarketplaceItem, { foreignKey: 'companyId' });
MarketplaceItem.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(ComplianceDocument, { foreignKey: 'companyId' });
ComplianceDocument.belongsTo(Company, { foreignKey: 'companyId' });
ComplianceDocument.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
ComplianceDocument.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

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

AdCampaign.belongsTo(Company, { foreignKey: 'companyId' });
Company.hasMany(AdCampaign, { foreignKey: 'companyId' });

AdCampaign.hasMany(CampaignFlight, { foreignKey: 'campaignId', as: 'flights' });
CampaignFlight.belongsTo(AdCampaign, { foreignKey: 'campaignId' });

AdCampaign.hasMany(CampaignTargetingRule, { foreignKey: 'campaignId', as: 'targetingRules' });
CampaignTargetingRule.belongsTo(AdCampaign, { foreignKey: 'campaignId' });

AdCampaign.hasMany(CampaignInvoice, { foreignKey: 'campaignId', as: 'invoices' });
CampaignInvoice.belongsTo(AdCampaign, { foreignKey: 'campaignId' });
CampaignInvoice.belongsTo(CampaignFlight, { foreignKey: 'flightId' });

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

AdCampaign.hasMany(CampaignFraudSignal, { foreignKey: 'campaignId', as: 'fraudSignals' });
CampaignFraudSignal.belongsTo(AdCampaign, { foreignKey: 'campaignId' });
CampaignFraudSignal.belongsTo(CampaignFlight, { foreignKey: 'flightId' });

Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

Conversation.hasMany(ConversationMessage, { foreignKey: 'conversationId', as: 'messages' });
ConversationMessage.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

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

ConversationParticipant.hasMany(MessageDelivery, { foreignKey: 'participantId', as: 'deliveries' });
MessageDelivery.belongsTo(ConversationParticipant, { foreignKey: 'participantId', as: 'participant' });

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

BlogPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(BlogPost, { foreignKey: 'authorId', as: 'blogPosts' });

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

export {
  sequelize,
  User,
  Company,
  Service,
  Post,
  MarketplaceItem,
  ServiceZone,
  ServiceZoneCoverage,
  Order,
  Escrow,
  Dispute,
  UiPreferenceTelemetry,
  UiPreferenceTelemetrySnapshot,
  ZoneAnalyticsSnapshot,
  Booking,
  BookingAssignment,
  BookingBid,
  BookingBidComment,
  CustomJobBid,
  CustomJobBidMessage,
  InventoryItem,
  InventoryLedgerEntry,
  InventoryAlert,
  RentalAgreement,
  RentalCheckpoint,
  ComplianceDocument,
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
  PlatformSetting,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPostCategory,
  BlogPostTag
};

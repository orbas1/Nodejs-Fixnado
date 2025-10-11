import 'package:collection/collection.dart';

class MessageDeliveryModel {
  MessageDeliveryModel({
    required this.id,
    required this.participantId,
    required this.status,
    this.suppressedReason,
    this.deliveredAt,
    this.readAt,
    this.metadata = const {},
  });

  final String id;
  final String participantId;
  final String status;
  final String? suppressedReason;
  final DateTime? deliveredAt;
  final DateTime? readAt;
  final Map<String, dynamic> metadata;

  factory MessageDeliveryModel.fromJson(Map<String, dynamic> json) {
    return MessageDeliveryModel(
      id: json['id'] as String,
      participantId: json['participantId'] as String,
      status: json['status'] as String,
      suppressedReason: json['suppressedReason'] as String?,
      deliveredAt: json['deliveredAt'] != null ? DateTime.tryParse(json['deliveredAt'] as String) : null,
      readAt: json['readAt'] != null ? DateTime.tryParse(json['readAt'] as String) : null,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? const {}),
    );
  }
}

class ConversationMessageModel {
  ConversationMessageModel({
    required this.id,
    required this.conversationId,
    required this.senderParticipantId,
    required this.messageType,
    required this.body,
    required this.createdAt,
    required this.aiAssistUsed,
    this.aiConfidenceScore,
    this.attachments = const [],
    this.metadata = const {},
    this.deliveries = const [],
  });

  final String id;
  final String conversationId;
  final String? senderParticipantId;
  final String messageType;
  final String body;
  final DateTime createdAt;
  final bool aiAssistUsed;
  final double? aiConfidenceScore;
  final List<dynamic> attachments;
  final Map<String, dynamic> metadata;
  final List<MessageDeliveryModel> deliveries;

  factory ConversationMessageModel.fromJson(Map<String, dynamic> json) {
    return ConversationMessageModel(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderParticipantId: json['senderParticipantId'] as String?,
      messageType: json['messageType'] as String,
      body: json['body'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      aiAssistUsed: json['aiAssistUsed'] as bool? ?? false,
      aiConfidenceScore: (json['aiConfidenceScore'] as num?)?.toDouble(),
      attachments: List<dynamic>.from(json['attachments'] as List? ?? const []),
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? const {}),
      deliveries: (json['deliveries'] as List<dynamic>? ?? const [])
          .map((item) => MessageDeliveryModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }
}

class ConversationParticipantModel {
  ConversationParticipantModel({
    required this.id,
    required this.conversationId,
    required this.participantType,
    required this.displayName,
    required this.role,
    required this.aiAssistEnabled,
    required this.notificationsEnabled,
    required this.videoEnabled,
    this.quietHoursStart,
    this.quietHoursEnd,
    this.timezone,
    this.metadata = const {},
  });

  final String id;
  final String conversationId;
  final String participantType;
  final String displayName;
  final String role;
  final bool aiAssistEnabled;
  final bool notificationsEnabled;
  final bool videoEnabled;
  final String? quietHoursStart;
  final String? quietHoursEnd;
  final String? timezone;
  final Map<String, dynamic> metadata;

  factory ConversationParticipantModel.fromJson(Map<String, dynamic> json) {
    return ConversationParticipantModel(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      participantType: json['participantType'] as String,
      displayName: json['displayName'] as String,
      role: json['role'] as String,
      aiAssistEnabled: json['aiAssistEnabled'] as bool? ?? false,
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? false,
      videoEnabled: json['videoEnabled'] as bool? ?? false,
      quietHoursStart: json['quietHoursStart'] as String?,
      quietHoursEnd: json['quietHoursEnd'] as String?,
      timezone: json['timezone'] as String?,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? const {}),
    );
  }
}

class ConversationModel {
  ConversationModel({
    required this.id,
    required this.subject,
    required this.aiAssistDefault,
    required this.retentionDays,
    this.metadata = const {},
    this.participants = const [],
    this.messages = const [],
  });

  final String id;
  final String subject;
  final bool aiAssistDefault;
  final int retentionDays;
  final Map<String, dynamic> metadata;
  final List<ConversationParticipantModel> participants;
  final List<ConversationMessageModel> messages;

  ConversationParticipantModel? participantById(String participantId) {
    return participants.firstWhereOrNull((participant) => participant.id == participantId);
  }

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['id'] as String,
      subject: json['subject'] as String,
      aiAssistDefault: json['aiAssistDefault'] as bool? ?? false,
      retentionDays: json['retentionDays'] as int? ?? 90,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? const {}),
      participants: (json['participants'] as List<dynamic>? ?? const [])
          .map((item) => ConversationParticipantModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      messages: (json['messages'] as List<dynamic>? ?? const [])
          .map((item) => ConversationMessageModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }

  ConversationModel copyWith({
    List<ConversationParticipantModel>? participants,
    List<ConversationMessageModel>? messages,
    Map<String, dynamic>? metadata,
  }) {
    return ConversationModel(
      id: id,
      subject: subject,
      aiAssistDefault: aiAssistDefault,
      retentionDays: retentionDays,
      metadata: metadata ?? this.metadata,
      participants: participants ?? this.participants,
      messages: messages ?? this.messages,
    );
  }
}

class ConversationCollection {
  ConversationCollection({required this.conversations, required this.offline});

  final List<ConversationModel> conversations;
  final bool offline;
}

class VideoSessionModel {
  VideoSessionModel({
    required this.appId,
    required this.channelName,
    required this.token,
    required this.uid,
    required this.expiresAt,
  });

  final String appId;
  final String channelName;
  final String token;
  final String uid;
  final DateTime expiresAt;

  factory VideoSessionModel.fromJson(Map<String, dynamic> json) {
    return VideoSessionModel(
      appId: json['appId'] as String,
      channelName: json['channelName'] as String,
      token: json['token'] as String,
      uid: json['uid'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }
}

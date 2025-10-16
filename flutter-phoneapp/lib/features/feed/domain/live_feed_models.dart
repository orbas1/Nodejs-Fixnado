import '../../../core/utils/currency_formatter.dart';

double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

DateTime _parseDate(dynamic value) {
  if (value is DateTime) {
    return value;
  }
  if (value is String) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}

class LiveFeedPost {
  LiveFeedPost({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.budgetLabel,
    required this.budgetAmount,
    required this.budgetCurrency,
    required this.category,
    required this.allowOutOfZone,
    required this.status,
    required this.createdAt,
    required this.zone,
    required this.metadata,
    required this.bids,
    required this.customer,
    required this.images,
    required this.bidDeadline,
  });

  factory LiveFeedPost.fromJson(Map<String, dynamic> json) {
    final zoneJson = json['zone'];
    return LiveFeedPost(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Untitled request',
      description: json['description'] as String?,
      location: json['location'] as String?,
      budgetLabel: json['budget'] as String?,
      budgetAmount: _toDouble(json['budgetAmount']),
      budgetCurrency: json['budgetCurrency'] as String? ?? 'USD',
      category: json['category'] as String?,
      allowOutOfZone: (json['allowOutOfZone'] as bool?) ?? false,
      status: json['status'] as String? ?? 'open',
      createdAt: _parseDate(json['createdAt']),
      zone: zoneJson is Map<String, dynamic> ? LiveFeedZone.fromJson(zoneJson) : null,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? {}),
      bids: (json['bids'] as List<dynamic>? ?? [])
          .map((item) => LiveFeedBid.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      customer: json['User'] is Map<String, dynamic>
          ? LiveFeedActor.fromJson(Map<String, dynamic>.from(json['User'] as Map))
          : null,
      images: (json['images'] as List<dynamic>? ?? []).map((item) => item.toString()).toList(),
      bidDeadline: json['bidDeadline'] != null ? _parseDate(json['bidDeadline']) : null,
    );
  }

  final String id;
  final String title;
  final String? description;
  final String? location;
  final String? budgetLabel;
  final double? budgetAmount;
  final String budgetCurrency;
  final String? category;
  final bool allowOutOfZone;
  final String status;
  final DateTime createdAt;
  final LiveFeedZone? zone;
  final Map<String, dynamic> metadata;
  final List<LiveFeedBid> bids;
  final LiveFeedActor? customer;
  final List<String> images;
  final DateTime? bidDeadline;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'location': location,
      'budget': budgetLabel,
      'budgetAmount': budgetAmount,
      'budgetCurrency': budgetCurrency,
      'category': category,
      'allowOutOfZone': allowOutOfZone,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'zone': zone?.toJson(),
      'metadata': metadata,
      'bids': bids.map((bid) => bid.toJson()).toList(),
      'User': customer?.toJson(),
      'images': images,
      'bidDeadline': bidDeadline?.toIso8601String(),
    };
  }

  String get budgetDisplay {
    if ((budgetLabel ?? '').isNotEmpty) {
      return budgetLabel!;
    }
    if (budgetAmount != null) {
      return CurrencyFormatter.format(budgetAmount, currency: budgetCurrency);
    }
    return 'Budget TBD';
  }

  int get bidCount => bids.length;

  LiveFeedPost copyWith({
    String? title,
    String? description,
    String? location,
    String? budgetLabel,
    double? budgetAmount,
    String? budgetCurrency,
    String? category,
    bool? allowOutOfZone,
    String? status,
    DateTime? createdAt,
    LiveFeedZone? zone,
    Map<String, dynamic>? metadata,
    List<LiveFeedBid>? bids,
    LiveFeedActor? customer,
    List<String>? images,
    DateTime? bidDeadline,
  }) {
    return LiveFeedPost(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      location: location ?? this.location,
      budgetLabel: budgetLabel ?? this.budgetLabel,
      budgetAmount: budgetAmount ?? this.budgetAmount,
      budgetCurrency: budgetCurrency ?? this.budgetCurrency,
      category: category ?? this.category,
      allowOutOfZone: allowOutOfZone ?? this.allowOutOfZone,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      zone: zone ?? this.zone,
      metadata: metadata ?? this.metadata,
      bids: bids ?? this.bids,
      customer: customer ?? this.customer,
      images: images ?? this.images,
      bidDeadline: bidDeadline ?? this.bidDeadline,
    );
  }
}

class LiveFeedZone {
  LiveFeedZone({
    required this.id,
    required this.name,
    required this.companyId,
  });

  factory LiveFeedZone.fromJson(Map<String, dynamic> json) {
    return LiveFeedZone(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Service zone',
      companyId: json['companyId'] as String?,
    );
  }

  final String id;
  final String name;
  final String? companyId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'companyId': companyId,
      };
}

class LiveFeedActor {
  LiveFeedActor({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.type,
  });

  factory LiveFeedActor.fromJson(Map<String, dynamic> json) {
    return LiveFeedActor(
      id: json['id'] as String,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      type: json['type'] as String? ?? 'user',
    );
  }

  final String id;
  final String firstName;
  final String lastName;
  final String type;

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'type': type,
      };

  String get displayName => [firstName, lastName].where((value) => value.isNotEmpty).join(' ');
}

class LiveFeedBid {
  LiveFeedBid({
    required this.id,
    required this.amount,
    required this.currency,
    required this.status,
    required this.submittedAt,
    required this.provider,
    required this.messages,
  });

  factory LiveFeedBid.fromJson(Map<String, dynamic> json) {
    return LiveFeedBid(
      id: json['id'] as String,
      amount: _toDouble(json['amount']),
      currency: json['currency'] as String? ?? 'USD',
      status: json['status'] as String? ?? 'pending',
      submittedAt: _parseDate(json['createdAt'] ?? json['submittedAt']),
      provider: json['provider'] is Map<String, dynamic>
          ? LiveFeedActor.fromJson(Map<String, dynamic>.from(json['provider'] as Map))
          : null,
      messages: (json['messages'] as List<dynamic>? ?? [])
          .map((item) => LiveFeedBidMessage.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }

  final String id;
  final double? amount;
  final String currency;
  final String status;
  final DateTime submittedAt;
  final LiveFeedActor? provider;
  final List<LiveFeedBidMessage> messages;

  Map<String, dynamic> toJson() => {
        'id': id,
        'amount': amount,
        'currency': currency,
        'status': status,
        'submittedAt': submittedAt.toIso8601String(),
        'provider': provider?.toJson(),
        'messages': messages.map((message) => message.toJson()).toList(),
      };

  LiveFeedBid copyWith({
    double? amount,
    String? currency,
    String? status,
    DateTime? submittedAt,
    LiveFeedActor? provider,
    List<LiveFeedBidMessage>? messages,
  }) {
    return LiveFeedBid(
      id: id,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      status: status ?? this.status,
      submittedAt: submittedAt ?? this.submittedAt,
      provider: provider ?? this.provider,
      messages: messages ?? this.messages,
    );
  }
}

class LiveFeedBidMessage {
  LiveFeedBidMessage({
    required this.id,
    required this.body,
    required this.createdAt,
    required this.author,
    required this.attachments,
  });

  factory LiveFeedBidMessage.fromJson(Map<String, dynamic> json) {
    return LiveFeedBidMessage(
      id: json['id'] as String,
      body: json['body'] as String? ?? '',
      createdAt: _parseDate(json['createdAt']),
      author: json['author'] is Map<String, dynamic>
          ? LiveFeedActor.fromJson(Map<String, dynamic>.from(json['author'] as Map))
          : null,
      attachments: (json['attachments'] as List<dynamic>? ?? [])
          .map((item) => LiveFeedAttachment.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }

  final String id;
  final String body;
  final DateTime createdAt;
  final LiveFeedActor? author;
  final List<LiveFeedAttachment> attachments;

  Map<String, dynamic> toJson() => {
        'id': id,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
        'author': author?.toJson(),
        'attachments': attachments.map((attachment) => attachment.toJson()).toList(),
      };
}

class LiveFeedFetchResult {
  LiveFeedFetchResult({
    required this.posts,
    required this.offline,
  });

  final List<LiveFeedPost> posts;
  final bool offline;
}

class LiveFeedAttachment {
  LiveFeedAttachment({
    required this.url,
    this.label,
  });

  factory LiveFeedAttachment.fromJson(Map<String, dynamic> json) {
    return LiveFeedAttachment(
      url: json['url'] as String,
      label: json['label'] as String?,
    );
  }

  final String url;
  final String? label;

  Map<String, dynamic> toJson() => {
        'url': url,
        if (label != null && label!.isNotEmpty) 'label': label,
      };
}

class LiveFeedServerEvent {
  LiveFeedServerEvent({
    required this.type,
    required this.data,
  });

  final String type;
  final Map<String, dynamic> data;
}

class LiveFeedJobDraft {
  LiveFeedJobDraft({
    required this.title,
    required this.description,
    this.budgetAmount,
    this.budgetCurrency,
    this.budgetLabel,
    this.category,
    this.location,
    this.zoneId,
    this.allowOutOfZone = false,
    this.bidDeadline,
  });

  final String title;
  final String description;
  final double? budgetAmount;
  final String? budgetCurrency;
  final String? budgetLabel;
  final String? category;
  final String? location;
  final String? zoneId;
  final bool allowOutOfZone;
  final DateTime? bidDeadline;

  Map<String, dynamic> toJson() => {
        'title': title,
        if (description.isNotEmpty) 'description': description,
        if (budgetAmount != null) 'budgetAmount': budgetAmount,
        if (budgetCurrency != null && budgetCurrency!.isNotEmpty) 'budgetCurrency': budgetCurrency,
        if (budgetLabel != null && budgetLabel!.isNotEmpty) 'budgetLabel': budgetLabel,
        if (category != null && category!.isNotEmpty) 'category': category,
        if (location != null && location!.isNotEmpty) 'location': location,
        if (zoneId != null && zoneId!.isNotEmpty) 'zoneId': zoneId,
        'allowOutOfZone': allowOutOfZone,
        if (bidDeadline != null) 'bidDeadline': bidDeadline!.toIso8601String(),
      };
}

class LiveFeedBidRequest {
  LiveFeedBidRequest({
    this.amount,
    this.currency,
    required this.message,
    this.attachments = const [],
  });

  final double? amount;
  final String? currency;
  final String message;
  final List<LiveFeedAttachment> attachments;

  Map<String, dynamic> toJson() => {
        if (amount != null) 'amount': amount,
        if (currency != null && currency!.isNotEmpty) 'currency': currency,
        'message': message,
        if (attachments.isNotEmpty) 'attachments': attachments.map((attachment) => attachment.toJson()).toList(),
      };
}

class LiveFeedMessageRequest {
  LiveFeedMessageRequest({
    required this.body,
    this.attachments = const [],
  });

  final String body;
  final List<LiveFeedAttachment> attachments;

  Map<String, dynamic> toJson() => {
        'body': body,
        if (attachments.isNotEmpty) 'attachments': attachments.map((attachment) => attachment.toJson()).toList(),
      };
}

class LiveFeedBidStatus {
  const LiveFeedBidStatus({
    this.loading = false,
    this.error,
    this.success = false,
  });

  final bool loading;
  final String? error;
  final bool success;

  LiveFeedBidStatus copyWith({
    bool? loading,
    String? error,
    bool clearError = false,
    bool? success,
  }) {
    return LiveFeedBidStatus(
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      success: success ?? this.success,
    );
  }
}

class LiveFeedMessageStatus {
  const LiveFeedMessageStatus({
    this.loading = false,
    this.error,
    this.success = false,
  });

  final bool loading;
  final String? error;
  final bool success;

  LiveFeedMessageStatus copyWith({
    bool? loading,
    String? error,
    bool clearError = false,
    bool? success,
  }) {
    return LiveFeedMessageStatus(
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      success: success ?? this.success,
    );
  }
}

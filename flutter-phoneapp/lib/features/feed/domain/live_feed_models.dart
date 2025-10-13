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
}

class LiveFeedBidMessage {
  LiveFeedBidMessage({
    required this.id,
    required this.body,
    required this.createdAt,
    required this.author,
  });

  factory LiveFeedBidMessage.fromJson(Map<String, dynamic> json) {
    return LiveFeedBidMessage(
      id: json['id'] as String,
      body: json['body'] as String? ?? '',
      createdAt: _parseDate(json['createdAt']),
      author: json['author'] is Map<String, dynamic>
          ? LiveFeedActor.fromJson(Map<String, dynamic>.from(json['author'] as Map))
          : null,
    );
  }

  final String id;
  final String body;
  final DateTime createdAt;
  final LiveFeedActor? author;

  Map<String, dynamic> toJson() => {
        'id': id,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
        'author': author?.toJson(),
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

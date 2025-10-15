class AuthTokens {
  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.accessTokenExpiresAt,
    required this.refreshTokenExpiresAt,
    DateTime? issuedAt,
    Map<String, dynamic>? metadata,
  })  : issuedAt = issuedAt ?? DateTime.now().toUtc(),
        metadata = Map.unmodifiable(metadata ?? <String, dynamic>{});

  final String accessToken;
  final String refreshToken;
  final DateTime accessTokenExpiresAt;
  final DateTime refreshTokenExpiresAt;
  final DateTime issuedAt;
  final Map<String, dynamic> metadata;

  bool get isAccessTokenExpired =>
      DateTime.now().toUtc().isAfter(accessTokenExpiresAt.subtract(const Duration(seconds: 15)));

  bool get isRefreshExpired =>
      DateTime.now().toUtc().isAfter(refreshTokenExpiresAt.subtract(const Duration(seconds: 15)));

  bool get shouldRefresh =>
      DateTime.now().toUtc().isAfter(accessTokenExpiresAt.subtract(const Duration(minutes: 2)));

  AuthTokens copyWith({
    String? accessToken,
    String? refreshToken,
    DateTime? accessTokenExpiresAt,
    DateTime? refreshTokenExpiresAt,
    DateTime? issuedAt,
    Map<String, dynamic>? metadata,
  }) {
    return AuthTokens(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt ?? this.accessTokenExpiresAt,
      refreshTokenExpiresAt: refreshTokenExpiresAt ?? this.refreshTokenExpiresAt,
      issuedAt: issuedAt ?? this.issuedAt,
      metadata: metadata ?? this.metadata,
    );
  }

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    final access = json['accessToken'];
    final refresh = json['refreshToken'];
    final accessExpiry = DateTime.tryParse('${json['accessTokenExpiresAt']}');
    final refreshExpiry = DateTime.tryParse('${json['refreshTokenExpiresAt']}');
    if (access is! String || access.isEmpty || refresh is! String || refresh.isEmpty) {
      throw const FormatException('Missing session tokens');
    }
    if (accessExpiry == null || refreshExpiry == null) {
      throw const FormatException('Missing session expiry metadata');
    }
    final issuedAt = json['issuedAt'];
    final metadata = json['metadata'];
    return AuthTokens(
      accessToken: access,
      refreshToken: refresh,
      accessTokenExpiresAt: accessExpiry.toUtc(),
      refreshTokenExpiresAt: refreshExpiry.toUtc(),
      issuedAt: issuedAt is String ? DateTime.tryParse(issuedAt)?.toUtc() : null,
      metadata: metadata is Map<String, dynamic> ? metadata : const <String, dynamic>{},
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'accessTokenExpiresAt': accessTokenExpiresAt.toUtc().toIso8601String(),
      'refreshTokenExpiresAt': refreshTokenExpiresAt.toUtc().toIso8601String(),
      'issuedAt': issuedAt.toUtc().toIso8601String(),
      if (metadata.isNotEmpty) 'metadata': metadata,
    };
  }
}

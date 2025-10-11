class ApiException implements Exception {
  ApiException(this.statusCode, this.message, {this.details});

  final int statusCode;
  final String message;
  final Object? details;

  @override
  String toString() => 'ApiException($statusCode, $message, details: $details)';
}

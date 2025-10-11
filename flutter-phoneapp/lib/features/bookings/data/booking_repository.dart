import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../../auth/domain/user_role.dart';
import '../domain/booking_models.dart';

class BookingRepository {
  BookingRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static String _cacheKey(UserRole role) => 'bookings:v1:${role.name}';

  Future<BookingFetchResult> fetchBookings(UserRole role, {String? status, String? zoneId}) async {
    try {
      final payload = await _client.getJson('/bookings', query: {
        if (status != null) 'status': status,
        if (zoneId != null) 'zoneId': zoneId,
      });
      final items = (payload['data'] as List<dynamic>? ?? [])
          .map((item) => BookingModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      await _cache.writeJson(_cacheKey(role), {
        'bookings': items.map((booking) => booking.toJson()).toList(),
      });
      return BookingFetchResult(bookings: items, offline: false);
    } on ApiException catch (error) {
      final cached = _cache.readJson(_cacheKey(role));
      if (cached != null) {
        return BookingFetchResult(bookings: _fromCache(cached['value']), offline: true);
      }
      throw error;
    } on TimeoutException {
      final cached = _cache.readJson(_cacheKey(role));
      if (cached != null) {
        return BookingFetchResult(bookings: _fromCache(cached['value']), offline: true);
      }
      rethrow;
    }
  }

  Future<BookingModel> fetchBooking(String bookingId) async {
    final payload = await _client.getJson('/bookings/$bookingId');
    return BookingModel.fromJson(payload);
  }

  Future<BookingModel> createBooking(CreateBookingRequest request) async {
    final payload = await _client.postJson('/bookings', body: request.toJson());
    return BookingModel.fromJson(payload);
  }

  Future<BookingModel> updateStatus(String bookingId, String status, {String? actorId, String? reason}) async {
    final payload = await _client.patchJson('/bookings/$bookingId/status', body: {
      'status': status,
      if (actorId != null) 'actorId': actorId,
      if (reason != null) 'reason': reason,
    });
    return BookingModel.fromJson(payload);
  }

  Future<BookingAssignment> respondToAssignment(String bookingId, {required String providerId, required String status}) async {
    final payload = await _client.postJson('/bookings/$bookingId/assignments/response', body: {
      'providerId': providerId,
      'status': status,
    });
    return BookingAssignment.fromJson(payload);
  }

  Future<BookingAssignment> assignProvider(String bookingId, {required String providerId, String role = 'support', String? actorId}) async {
    final payload = await _client.postJson('/bookings/$bookingId/assignments', body: {
      'actorId': actorId,
      'assignments': [
        {
          'providerId': providerId,
          'role': role,
        }
      ],
    });
    final assignments = (payload['data'] as List<dynamic>? ?? payload as List<dynamic>? ?? [])
        .map((item) => BookingAssignment.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    return assignments.first;
  }

  Future<BookingBidModel> submitBid(String bookingId, {required String providerId, required double amount, required String currency, String? message}) async {
    final payload = await _client.postJson('/bookings/$bookingId/bids', body: {
      'providerId': providerId,
      'amount': amount,
      'currency': currency,
      if (message != null && message.isNotEmpty) 'message': message,
    });
    return BookingBidModel.fromJson(payload);
  }

  Future<BookingBidModel> updateBidStatus(String bookingId, String bidId, {required String status, required String actorId}) async {
    final payload = await _client.patchJson('/bookings/$bookingId/bids/$bidId/status', body: {
      'status': status,
      'actorId': actorId,
    });
    return BookingBidModel.fromJson(payload);
  }

  Future<BookingModel> triggerDispute(String bookingId, {required String actorId, required String reason}) async {
    final payload = await _client.postJson('/bookings/$bookingId/disputes', body: {
      'actorId': actorId,
      'reason': reason,
    });
    return BookingModel.fromJson(payload);
  }

  List<BookingModel> _fromCache(Object? raw) {
    if (raw is Map<String, dynamic>) {
      final bookings = (raw['bookings'] as List<dynamic>? ?? [])
          .map((item) => BookingModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      return bookings;
    }
    if (raw is List<dynamic>) {
      return raw
          .map((item) => BookingModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    return [];
  }
}

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return BookingRepository(client, cache);
});

class BookingFetchResult {
  BookingFetchResult({required this.bookings, required this.offline});

  final List<BookingModel> bookings;
  final bool offline;
}

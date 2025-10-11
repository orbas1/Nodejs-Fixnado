import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../../auth/domain/user_role.dart';
import '../domain/rental_models.dart';

class RentalRepository {
  RentalRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static String _cacheKey(UserRole role) => 'rentals:v1:${role.name}';

  Future<RentalFetchResult> fetchRentals(UserRole role, {String? status, String? companyId, String? renterId}) async {
    try {
      final payload = await _client.getJson('/rentals', query: {
        if (status != null) 'status': status,
        if (companyId != null) 'companyId': companyId,
        if (renterId != null) 'renterId': renterId,
      });
      final items = (payload['data'] as List<dynamic>? ?? [])
          .map((item) => RentalAgreementModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      await _cache.writeJson(_cacheKey(role), {
        'agreements': items.map((agreement) => agreement.toJson()).toList(),
      });
      return RentalFetchResult(rentals: items, offline: false);
    } on ApiException catch (error) {
      final cached = _cache.readJson(_cacheKey(role));
      if (cached != null) {
        return RentalFetchResult(rentals: _fromCache(cached['value']), offline: true);
      }
      throw error;
    } on TimeoutException {
      final cached = _cache.readJson(_cacheKey(role));
      if (cached != null) {
        return RentalFetchResult(rentals: _fromCache(cached['value']), offline: true);
      }
      rethrow;
    }
  }

  Future<RentalAgreementModel> fetchRental(String rentalId) async {
    final payload = await _client.getJson('/rentals/$rentalId');
    return RentalAgreementModel.fromJson(payload);
  }

  Future<RentalAgreementModel> approveRental(String rentalId, {String? actorId, String? notes}) async {
    final payload = await _client.postJson('/rentals/$rentalId/approve', body: {
      if (actorId != null) 'actorId': actorId,
      if (notes != null) 'approvalNotes': notes,
    });
    return RentalAgreementModel.fromJson(payload);
  }

  Future<RentalAgreementModel> requestRental({
    required String itemId,
    required String renterId,
    String? bookingId,
    String? marketplaceItemId,
    int quantity = 1,
    DateTime? rentalStart,
    DateTime? rentalEnd,
    String? notes,
    String? actorId,
    String actorRole = 'customer',
  }) async {
    final payload = await _client.postJson('/rentals', body: {
      'itemId': itemId,
      'renterId': renterId,
      if (bookingId != null) 'bookingId': bookingId,
      if (marketplaceItemId != null) 'marketplaceItemId': marketplaceItemId,
      'quantity': quantity,
      if (rentalStart != null) 'rentalStart': rentalStart.toUtc().toIso8601String(),
      if (rentalEnd != null) 'rentalEnd': rentalEnd.toUtc().toIso8601String(),
      if (notes != null) 'notes': notes,
      if (actorId != null) 'actorId': actorId,
      'actorRole': actorRole,
    });
    return RentalAgreementModel.fromJson(payload);
  }

  Future<RentalAgreementModel> schedulePickup(String rentalId, {required DateTime pickupAt, required DateTime returnDueAt, String? actorId, String? notes}) async {
    final payload = await _client.postJson('/rentals/$rentalId/schedule-pickup', body: {
      'pickupAt': pickupAt.toUtc().toIso8601String(),
      'returnDueAt': returnDueAt.toUtc().toIso8601String(),
      if (actorId != null) 'actorId': actorId,
      if (notes != null) 'logisticsNotes': notes,
    });
    return RentalAgreementModel.fromJson(payload);
  }

  Future<RentalAgreementModel> recordCheckout(String rentalId, {String? actorId, Map<String, dynamic>? conditionOut, DateTime? rentalStartAt, String? notes}) async {
    final payload = await _client.postJson('/rentals/$rentalId/checkout', body: {
      if (actorId != null) 'actorId': actorId,
      if (conditionOut != null) 'conditionOut': conditionOut,
      if (rentalStartAt != null) 'rentalStartAt': rentalStartAt.toUtc().toIso8601String(),
      if (notes != null) 'handoverNotes': notes,
    });
    return RentalAgreementModel.fromJson(payload);
  }

  Future<RentalAgreementModel> markReturned(String rentalId, {String? actorId, Map<String, dynamic>? conditionIn, DateTime? returnedAt, String? notes}) async {
    final payload = await _client.postJson('/rentals/$rentalId/return', body: {
      if (actorId != null) 'actorId': actorId,
      if (conditionIn != null) 'conditionIn': conditionIn,
      if (returnedAt != null) 'returnedAt': returnedAt.toUtc().toIso8601String(),
      if (notes != null) 'notes': notes,
    });
    return RentalAgreementModel.fromJson(payload);
  }

  Future<RentalAgreementModel> completeInspection(String rentalId, {String? actorId, String outcome = 'clear', List<Map<String, dynamic>> charges = const [], String? notes}) async {
    final payload = await _client.postJson('/rentals/$rentalId/inspection', body: {
      'outcome': outcome,
      'charges': charges,
      if (actorId != null) 'actorId': actorId,
      if (notes != null) 'inspectionNotes': notes,
    });
    return RentalAgreementModel.fromJson(payload);
  }

  Future<RentalAgreementModel> cancelRental(String rentalId, {String? actorId, String? reason}) async {
    final payload = await _client.postJson('/rentals/$rentalId/cancel', body: {
      if (actorId != null) 'actorId': actorId,
      if (reason != null) 'reason': reason,
    });
    return RentalAgreementModel.fromJson(payload);
  }

  List<RentalAgreementModel> _fromCache(Object? raw) {
    if (raw is Map<String, dynamic>) {
      return (raw['agreements'] as List<dynamic>? ?? [])
          .map((item) => RentalAgreementModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    if (raw is List<dynamic>) {
      return raw
          .map((item) => RentalAgreementModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }
    return [];
  }
}

final rentalRepositoryProvider = Provider<RentalRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return RentalRepository(client, cache);
});

class RentalFetchResult {
  RentalFetchResult({required this.rentals, required this.offline});

  final List<RentalAgreementModel> rentals;
  final bool offline;
}

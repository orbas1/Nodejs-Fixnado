import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../../auth/domain/user_role.dart';
import '../domain/storefront_models.dart';

class StorefrontRepository {
  StorefrontRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static const _allowedRoles = {UserRole.provider, UserRole.admin};

  static String _cacheKeyFor(UserRole role) => 'storefront:v1:${role.name}';

  Future<StorefrontFetchResult> fetchStorefront(UserRole role, {bool bypassCache = false}) async {
    if (!_allowedRoles.contains(role)) {
      throw StorefrontAccessDenied('Persona ${role.name} is not authorised to manage the storefront.');
    }

    final cacheKey = _cacheKeyFor(role);
    StorefrontSnapshot? cachedSnapshot;
    if (!bypassCache) {
      final cached = _cache.readJson(cacheKey);
      if (cached != null) {
        final value = Map<String, dynamic>.from(cached['value'] as Map);
        cachedSnapshot = StorefrontSnapshot.fromJson(value);
        final cachedAt = cached['updatedAt'] != null ? DateTime.tryParse(cached['updatedAt'] as String) : null;
        if (cachedAt != null) {
          cachedSnapshot = cachedSnapshot.copyWith(generatedAt: cachedAt);
        }
      }
    }

    try {
      final snapshot = await _loadRemote(role);
      await _cache.writeJson(cacheKey, snapshot.toJson());
      return StorefrontFetchResult(snapshot: snapshot, offline: false);
    } on TimeoutException catch (_) {
      if (cachedSnapshot != null) {
        return StorefrontFetchResult(snapshot: cachedSnapshot, offline: true);
      }
      rethrow;
    } on ApiException catch (error) {
      if (error.statusCode == 403) {
        throw StorefrontAccessDenied('This storefront session is restricted. Switch persona and try again.');
      }
      if (cachedSnapshot != null) {
        return StorefrontFetchResult(snapshot: cachedSnapshot, offline: true);
      }
      rethrow;
    }
  }

  Future<StorefrontSnapshot> _loadRemote(UserRole role) async {
    final payload = await _client.getJson(
      '/panel/provider/storefront',
      headers: {
        'X-Fixnado-Role': role == UserRole.admin ? 'admin' : 'company',
        'X-Fixnado-Persona': role.name,
      },
    );
    final data = Map<String, dynamic>.from(payload['data'] as Map? ?? payload as Map? ?? {});
    final meta = Map<String, dynamic>.from(payload['meta'] as Map? ?? {});
    final snapshot = StorefrontSnapshot.fromJson({
      ...data,
      'generatedAt': meta['generatedAt']?.toString() ?? DateTime.now().toIso8601String(),
    });
    return snapshot.copyWith(
      generatedAt: DateTime.tryParse(meta['generatedAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

final storefrontRepositoryProvider = Provider<StorefrontRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return StorefrontRepository(client, cache);
});

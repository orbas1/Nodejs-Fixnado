import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/bootstrap.dart';
import '../network/api_client.dart';
import '../storage/local_cache.dart';

enum PushAuthorizationStatus {
  notDetermined,
  denied,
  granted,
  provisional,
  restricted,
  ephemeral,
  limited,
  unknown,
}

extension PushAuthorizationStatusX on PushAuthorizationStatus {
  static PushAuthorizationStatus fromName(String? value) {
    switch (value?.toLowerCase()) {
      case 'authorized':
      case 'granted':
      case 'allow':
        return PushAuthorizationStatus.granted;
      case 'denied':
      case 'block':
        return PushAuthorizationStatus.denied;
      case 'not_determined':
      case 'notdetermined':
      case 'prompt':
        return PushAuthorizationStatus.notDetermined;
      case 'provisional':
        return PushAuthorizationStatus.provisional;
      case 'ephemeral':
        return PushAuthorizationStatus.ephemeral;
      case 'restricted':
        return PushAuthorizationStatus.restricted;
      case 'limited':
        return PushAuthorizationStatus.limited;
      default:
        return PushAuthorizationStatus.unknown;
    }
  }

  bool get canReceiveNotifications {
    switch (this) {
      case PushAuthorizationStatus.granted:
      case PushAuthorizationStatus.provisional:
      case PushAuthorizationStatus.ephemeral:
      case PushAuthorizationStatus.limited:
        return true;
      case PushAuthorizationStatus.notDetermined:
      case PushAuthorizationStatus.denied:
      case PushAuthorizationStatus.restricted:
      case PushAuthorizationStatus.unknown:
        return false;
    }
  }
}

abstract class PushNotificationsPlatform {
  String get platformName;

  Future<PushAuthorizationStatus> getAuthorizationStatus();

  Future<PushAuthorizationStatus> requestAuthorization();

  Future<String?> getToken();

  Future<void> openSettings();
}

class MethodChannelPushNotificationsPlatform implements PushNotificationsPlatform {
  MethodChannelPushNotificationsPlatform({MethodChannel? channel})
      : _channel = channel ?? const MethodChannel('fixnado/push_notifications');

  final MethodChannel _channel;

  @override
  String get platformName {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.macOS:
        return 'macos';
      case TargetPlatform.windows:
        return 'windows';
      case TargetPlatform.linux:
        return 'linux';
      case TargetPlatform.fuchsia:
        return 'fuchsia';
      case TargetPlatform.androidTV:
        return 'android_tv';
      case TargetPlatform.iOSCatalyst:
        return 'ios_catalyst';
      case TargetPlatform.visionOS:
        return 'vision_os';
    }
  }

  Future<PushAuthorizationStatus> _invokeStatus(String method) async {
    try {
      final value = await _channel.invokeMethod<String>(method);
      return PushAuthorizationStatusX.fromName(value);
    } on MissingPluginException {
      return PushAuthorizationStatus.unknown;
    } on PlatformException {
      return PushAuthorizationStatus.unknown;
    }
  }

  @override
  Future<PushAuthorizationStatus> getAuthorizationStatus() => _invokeStatus('getAuthorizationStatus');

  @override
  Future<PushAuthorizationStatus> requestAuthorization() => _invokeStatus('requestAuthorization');

  @override
  Future<String?> getToken() async {
    try {
      final token = await _channel.invokeMethod<String>('getToken');
      if (token == null || token.isEmpty) {
        return null;
      }
      return token;
    } on MissingPluginException {
      return null;
    } on PlatformException {
      return null;
    }
  }

  @override
  Future<void> openSettings() async {
    try {
      await _channel.invokeMethod<void>('openSettings');
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    }
  }
}

class PushNotificationSnapshot {
  const PushNotificationSnapshot({
    required this.authorizationStatus,
    this.token,
    this.participantId,
    this.platform,
    this.lastSyncedAt,
  });

  final PushAuthorizationStatus authorizationStatus;
  final String? token;
  final String? participantId;
  final String? platform;
  final DateTime? lastSyncedAt;

  bool get hasToken => token != null && token!.isNotEmpty;
}

class PushRegistrationResult {
  PushRegistrationResult({
    required this.authorizationStatus,
    required this.syncedAt,
    this.token,
    this.participantId,
    this.platform,
    this.updatedToken = false,
  });

  final PushAuthorizationStatus authorizationStatus;
  final DateTime syncedAt;
  final String? token;
  final String? participantId;
  final String? platform;
  final bool updatedToken;

  bool get registered => token != null && token!.isNotEmpty;
}

class PushNotificationsService {
  PushNotificationsService(this._client, this._cache, this._platform);

  static const String registrationEndpoint = '/notifications/push/devices';
  static const String revokeEndpoint = '/notifications/push/devices/revoke';
  static const String _statusCacheKey = 'push_notifications:status';
  static const String _registrationCacheKey = 'push_notifications:registration';

  final FixnadoApiClient _client;
  final LocalCache _cache;
  final PushNotificationsPlatform _platform;

  PushNotificationSnapshot getCachedSnapshot() {
    final statusEntry = _cache.readJson(_statusCacheKey);
    final statusValue = statusEntry?["value"];
    final status = statusValue is Map<String, dynamic>
        ? PushAuthorizationStatusX.fromName(statusValue['status'] as String?)
        : PushAuthorizationStatus.unknown;
    final statusSyncedAt = statusValue is Map<String, dynamic>
        ? DateTime.tryParse(statusValue['syncedAt'] as String? ?? '')
        : null;

    final registrationEntry = _cache.readJson(_registrationCacheKey);
    final registrationValue = registrationEntry?["value"];
    String? token;
    String? participantId;
    String? platform;
    DateTime? tokenSyncedAt;
    if (registrationValue is Map<String, dynamic>) {
      token = registrationValue['token'] as String?;
      participantId = registrationValue['participantId'] as String?;
      platform = registrationValue['platform'] as String?;
      tokenSyncedAt = DateTime.tryParse(registrationValue['syncedAt'] as String? ?? '');
    }

    return PushNotificationSnapshot(
      authorizationStatus: status,
      token: token,
      participantId: participantId,
      platform: platform,
      lastSyncedAt: tokenSyncedAt ?? statusSyncedAt,
    );
  }

  Future<PushRegistrationResult> syncRegistration({
    required String participantId,
    bool requestPermissionIfNeeded = true,
    bool forceRefresh = false,
  }) async {
    final currentStatus = await _platform.getAuthorizationStatus();
    var finalStatus = currentStatus;

    if (finalStatus == PushAuthorizationStatus.notDetermined && requestPermissionIfNeeded) {
      finalStatus = await _platform.requestAuthorization();
    }

    final now = DateTime.now().toUtc();
    await _cache.writeJson(_statusCacheKey, {
      'status': finalStatus.name,
      'syncedAt': now.toIso8601String(),
    });

    if (!finalStatus.canReceiveNotifications) {
      await _cache.remove(_registrationCacheKey);
      return PushRegistrationResult(
        authorizationStatus: finalStatus,
        syncedAt: now,
      );
    }

    String? token;
    try {
      token = await _platform.getToken();
    } catch (_) {
      token = null;
    }

    if (token == null || token.isEmpty) {
      await _cache.remove(_registrationCacheKey);
      return PushRegistrationResult(
        authorizationStatus: finalStatus,
        syncedAt: now,
      );
    }

    final cached = _cache.readJson(_registrationCacheKey);
    final cachedValue = cached?["value"];
    final cachedToken = cachedValue is Map<String, dynamic> ? cachedValue['token'] as String? : null;
    final cachedParticipant = cachedValue is Map<String, dynamic> ? cachedValue['participantId'] as String? : null;

    final shouldRegister = forceRefresh || cachedToken != token || cachedParticipant != participantId;

    if (shouldRegister) {
      await _client.postJson(
        registrationEndpoint,
        body: {
          'participantId': participantId,
          'token': token,
          'platform': _platform.platformName,
          'syncedAt': now.toIso8601String(),
        },
      );
    }

    await _cache.writeJson(_registrationCacheKey, {
      'participantId': participantId,
      'token': token,
      'platform': _platform.platformName,
      'syncedAt': now.toIso8601String(),
    });

    return PushRegistrationResult(
      authorizationStatus: finalStatus,
      token: token,
      participantId: participantId,
      platform: _platform.platformName,
      updatedToken: shouldRegister,
      syncedAt: now,
    );
  }

  Future<void> unregister({bool notifyBackend = true}) async {
    final snapshot = getCachedSnapshot();
    if (snapshot.hasToken && notifyBackend) {
      try {
        await _client.postJson(
          revokeEndpoint,
          body: {
            'token': snapshot.token,
            'participantId': snapshot.participantId,
            'platform': snapshot.platform ?? _platform.platformName,
          },
        );
      } catch (_) {
        // Ignored to ensure local cleanup still happens.
      }
    }

    await _cache.remove(_registrationCacheKey);
  }

  Future<void> openSettings() => _platform.openSettings();
}

final pushNotificationsPlatformProvider = Provider<PushNotificationsPlatform>((ref) {
  return MethodChannelPushNotificationsPlatform();
});

final pushNotificationsServiceProvider = Provider<PushNotificationsService>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  final platform = ref.watch(pushNotificationsPlatformProvider);
  return PushNotificationsService(client, cache, platform);
});

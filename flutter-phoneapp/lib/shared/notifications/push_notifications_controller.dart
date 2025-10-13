import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/notifications/push_notifications_service.dart';

final pushNotificationsControllerProvider =
    StateNotifierProvider<PushNotificationsController, PushNotificationsState>((ref) {
  final service = ref.watch(pushNotificationsServiceProvider);
  return PushNotificationsController(service);
});

class PushNotificationsController extends StateNotifier<PushNotificationsState> {
  PushNotificationsController(this._service)
      : super(_fromSnapshot(_service.getCachedSnapshot()));

  final PushNotificationsService _service;

  static PushNotificationsState _fromSnapshot(PushNotificationSnapshot snapshot) {
    final registered = snapshot.hasToken && snapshot.authorizationStatus.canReceiveNotifications;
    return PushNotificationsState(
      authorizationStatus: snapshot.authorizationStatus,
      token: snapshot.token,
      participantId: snapshot.participantId,
      lastSyncedAt: snapshot.lastSyncedAt,
      registered: registered,
    );
  }

  Future<void> sync({
    required String participantId,
    bool requestPermissionIfNeeded = true,
    bool forceRefresh = false,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final result = await _service.syncRegistration(
        participantId: participantId,
        requestPermissionIfNeeded: requestPermissionIfNeeded,
        forceRefresh: forceRefresh,
      );
      state = state.copyWith(
        isLoading: false,
        authorizationStatus: result.authorizationStatus,
        token: result.token,
        participantId: result.participantId ?? participantId,
        lastSyncedAt: result.syncedAt,
        registered: result.registered,
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }

  Future<void> unregister({bool notifyBackend = true}) async {
    await _service.unregister(notifyBackend: notifyBackend);
    state = state.copyWith(
      token: null,
      registered: false,
      lastSyncedAt: DateTime.now().toUtc(),
    );
  }

  Future<void> openSettings() => _service.openSettings();
}

class PushNotificationsState {
  const PushNotificationsState({
    this.authorizationStatus = PushAuthorizationStatus.unknown,
    this.token,
    this.participantId,
    this.lastSyncedAt,
    this.registered = false,
    this.isLoading = false,
    this.errorMessage,
  });

  final PushAuthorizationStatus authorizationStatus;
  final String? token;
  final String? participantId;
  final DateTime? lastSyncedAt;
  final bool registered;
  final bool isLoading;
  final String? errorMessage;

  static const _sentinel = Object();

  PushNotificationsState copyWith({
    PushAuthorizationStatus? authorizationStatus,
    Object? token = _sentinel,
    Object? participantId = _sentinel,
    DateTime? lastSyncedAt,
    bool? registered,
    bool? isLoading,
    Object? errorMessage = _sentinel,
  }) {
    return PushNotificationsState(
      authorizationStatus: authorizationStatus ?? this.authorizationStatus,
      token: identical(token, _sentinel) ? this.token : token as String?,
      participantId: identical(participantId, _sentinel) ? this.participantId : participantId as String?,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      registered: registered ?? this.registered,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: identical(errorMessage, _sentinel) ? this.errorMessage : errorMessage as String?,
    );
  }
}

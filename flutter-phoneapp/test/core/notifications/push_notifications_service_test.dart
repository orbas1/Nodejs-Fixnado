import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:fixnado_mobile/core/network/api_client.dart';
import 'package:fixnado_mobile/core/notifications/push_notifications_service.dart';
import 'package:fixnado_mobile/core/storage/local_cache.dart';

class _MockApiClient extends Mock implements FixnadoApiClient {}

class _MockPushNotificationsPlatform extends Mock implements PushNotificationsPlatform {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late LocalCache cache;
  late _MockApiClient apiClient;
  late _MockPushNotificationsPlatform platform;
  late PushNotificationsService service;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    cache = LocalCache(prefs);
    apiClient = _MockApiClient();
    platform = _MockPushNotificationsPlatform();
    service = PushNotificationsService(apiClient, cache, platform);

    when(() => platform.platformName).thenReturn('ios');
  });

  group('syncRegistration', () {
    test('returns denied status without registering when permission is blocked', () async {
      when(() => platform.getAuthorizationStatus()).thenAnswer((_) async => PushAuthorizationStatus.denied);

      final result = await service.syncRegistration(participantId: 'participant-1');

      expect(result.authorizationStatus, PushAuthorizationStatus.denied);
      expect(result.token, isNull);
      expect(result.registered, isFalse);
      verifyNever(() => platform.requestAuthorization());
      verifyNever(() => apiClient.postJson(any(), body: any(named: 'body')));
    });

    test('requests permission when status not determined', () async {
      when(() => platform.getAuthorizationStatus()).thenAnswer((_) async => PushAuthorizationStatus.notDetermined);
      when(() => platform.requestAuthorization()).thenAnswer((_) async => PushAuthorizationStatus.granted);
      when(() => platform.getToken()).thenAnswer((_) async => 'token-123');
      when(() => apiClient.postJson(any(), body: any(named: 'body'))).thenAnswer((_) async => <String, dynamic>{});

      final result = await service.syncRegistration(participantId: 'participant-1');

      expect(result.authorizationStatus, PushAuthorizationStatus.granted);
      expect(result.token, 'token-123');
      expect(result.registered, isTrue);
      verify(() => platform.requestAuthorization()).called(1);
      verify(() => apiClient.postJson(
            PushNotificationsService.registrationEndpoint,
            body: any(named: 'body'),
          )).called(1);
    });

    test('does not re-register when token and participant match cache', () async {
      when(() => platform.getAuthorizationStatus()).thenAnswer((_) async => PushAuthorizationStatus.granted);
      when(() => platform.getToken()).thenAnswer((_) async => 'token-abc');
      when(() => apiClient.postJson(any(), body: any(named: 'body'))).thenAnswer((_) async => <String, dynamic>{});

      final first = await service.syncRegistration(participantId: 'participant-1');
      expect(first.updatedToken, isTrue);

      final second = await service.syncRegistration(participantId: 'participant-1');
      expect(second.updatedToken, isFalse);

      verify(() => apiClient.postJson(
            PushNotificationsService.registrationEndpoint,
            body: any(named: 'body'),
          )).called(1);
    });

    test('forceRefresh triggers re-registration', () async {
      when(() => platform.getAuthorizationStatus()).thenAnswer((_) async => PushAuthorizationStatus.granted);
      when(() => platform.getToken()).thenAnswer((_) async => 'token-force');
      when(() => apiClient.postJson(any(), body: any(named: 'body'))).thenAnswer((_) async => <String, dynamic>{});

      await service.syncRegistration(participantId: 'participant-1');
      await service.syncRegistration(participantId: 'participant-1', forceRefresh: true);

      verify(() => apiClient.postJson(
            PushNotificationsService.registrationEndpoint,
            body: any(named: 'body'),
          )).called(2);
    });

    test('clears registration cache when token missing', () async {
      when(() => platform.getAuthorizationStatus()).thenAnswer((_) async => PushAuthorizationStatus.granted);
      when(() => platform.getToken()).thenAnswer((_) async => 'token-present');
      when(() => apiClient.postJson(any(), body: any(named: 'body'))).thenAnswer((_) async => <String, dynamic>{});

      await service.syncRegistration(participantId: 'participant-1');
      when(() => platform.getToken()).thenAnswer((_) async => null);

      final result = await service.syncRegistration(participantId: 'participant-1');
      expect(result.registered, isFalse);
      expect(service.getCachedSnapshot().hasToken, isFalse);
    });
  });

  test('unregister notifies backend when token cached', () async {
    when(() => platform.getAuthorizationStatus()).thenAnswer((_) async => PushAuthorizationStatus.granted);
    when(() => platform.getToken()).thenAnswer((_) async => 'token-unregister');
    when(() => apiClient.postJson(any(), body: any(named: 'body'))).thenAnswer((_) async => <String, dynamic>{});

    await service.syncRegistration(participantId: 'participant-1');

    await service.unregister();

    verify(() => apiClient.postJson(
          PushNotificationsService.revokeEndpoint,
          body: any(named: 'body'),
        )).called(1);
    expect(service.getCachedSnapshot().hasToken, isFalse);
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:fixnado_mobile/features/calendar/application/calendar_controller.dart';
import 'package:fixnado_mobile/features/calendar/data/calendar_repository.dart';
import 'package:fixnado_mobile/features/calendar/domain/calendar_models.dart';
import 'package:fixnado_mobile/core/network/api_client.dart';
import 'package:fixnado_mobile/core/storage/local_cache.dart';
import 'package:fixnado_mobile/core/exceptions/api_exception.dart';

class _MockApiClient extends Mock implements FixnadoApiClient {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    registerFallbackValue(<String, dynamic>{});
    registerFallbackValue(<String, String>{});
  });

  late _MockApiClient apiClient;
  late LocalCache cache;
  late CalendarRepository repository;
  late CalendarController controller;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    cache = LocalCache(prefs);
    apiClient = _MockApiClient();
    repository = CalendarRepository(apiClient, cache);
    controller = CalendarController(repository);
  });

  tearDown(() => controller.dispose());

  test('initial load falls back to seeded events when API fails', () async {
    when(() => apiClient.getJson(any())).thenThrow(ApiException(500, 'failure'));

    await controller.loadEvents();

    expect(controller.state.isLoading, isFalse);
    expect(controller.state.events, isNotEmpty);
    expect(controller.state.offline, isTrue);
  });

  test('saving a new event persists to cache and controller state', () async {
    when(() => apiClient.getJson(any())).thenThrow(ApiException(500, 'failure'));
    when(() => apiClient.postJson(any(), body: any(named: 'body')))
        .thenAnswer((_) async => <String, dynamic>{});
    when(() => apiClient.patchJson(any(), body: any(named: 'body')))
        .thenAnswer((_) async => <String, dynamic>{});

    await controller.loadEvents();

    final draft = controller.createDraft();
    final event = draft.copyWith(title: 'Test event');
    await controller.saveEvent(event);

    final stored = controller.state.events.where((e) => e.title == 'Test event');
    expect(stored, isNotEmpty);

    // Verify cache was updated.
    final cached = cache.readJson('calendar:snapshot:v1');
    expect(cached, isNotNull);
  });

  test('deleting an event removes it from controller state', () async {
    when(() => apiClient.getJson(any())).thenThrow(ApiException(500, 'failure'));
    when(() => apiClient.postJson(any(), body: any(named: 'body')))
        .thenAnswer((_) async => <String, dynamic>{});
    when(() => apiClient.patchJson(any(), body: any(named: 'body')))
        .thenAnswer((_) async => <String, dynamic>{});

    await controller.loadEvents();
    final event = controller.state.events.first;
    await controller.deleteEvent(event.id);

    expect(controller.state.events.where((item) => item.id == event.id), isEmpty);
  });
}

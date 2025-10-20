import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:fixnado_mobile/features/calendar/application/calendar_controller.dart';
import 'package:fixnado_mobile/features/calendar/data/calendar_repository.dart';
import 'package:fixnado_mobile/core/storage/local_cache.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late LocalCache cache;
  late CalendarRepository repository;
  late CalendarController controller;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    cache = LocalCache(prefs);
    repository = CalendarRepository(cache);
    controller = CalendarController(repository);
  });

  tearDown(() => controller.dispose());

  test('initial load seeds events when cache is empty', () async {
    await controller.loadEvents();

    expect(controller.state.isLoading, isFalse);
    expect(controller.state.events, isNotEmpty);
    expect(controller.state.offline, isFalse);
  });

  test('saving a new event persists to cache and controller state', () async {
    await controller.loadEvents();

    final draft = controller.createDraft();
    final event = draft.copyWith(title: 'Test event');
    await controller.saveEvent(event);

    final stored = controller.state.events.where((e) => e.title == 'Test event');
    expect(stored, isNotEmpty);

    final cached = cache.readJson('calendar:snapshot:v1');
    expect(cached, isNotNull);
  });

  test('deleting an event removes it from controller state and cache', () async {
    await controller.loadEvents();
    final event = controller.state.events.first;

    await controller.deleteEvent(event.id);

    expect(controller.state.events.where((item) => item.id == event.id), isEmpty);

    final cached = cache.readJson('calendar:snapshot:v1');
    expect(cached, isNotNull);
    final payload = Map<String, dynamic>.from(cached!['value'] as Map);
    final events = payload['events'] as List<dynamic>;
    final exists = events.any((item) => Map<String, dynamic>.from(item as Map)['id'] == event.id);
    expect(exists, isFalse);
  });
}

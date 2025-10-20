import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/calendar_models.dart';

class CalendarRepository {
  CalendarRepository(this._cache);

  final LocalCache _cache;

  static const _cacheKey = 'calendar:snapshot:v1';

  Future<CalendarLoadResult> loadEvents({bool bypassCache = false}) async {
    final cachedSnapshot = _readCachedSnapshot();
    if (!bypassCache && cachedSnapshot != null) {
      return CalendarLoadResult(snapshot: cachedSnapshot, offline: false);
    }

    final snapshot = cachedSnapshot?.copyWith(generatedAt: DateTime.now()) ??
        CalendarSnapshot(events: _seedDefaults(), generatedAt: DateTime.now());
    await _cache.writeJson(_cacheKey, snapshot.toJson());
    return CalendarLoadResult(snapshot: snapshot, offline: false);
  }

  Future<CalendarEvent> upsertEvent(CalendarEvent event) async {
    final currentSnapshot = _readCachedSnapshot() ??
        CalendarSnapshot(events: _seedDefaults(), generatedAt: DateTime.now());
    final events = List<CalendarEvent>.from(currentSnapshot.events);
    final index = events.indexWhere((item) => item.id == event.id);
    final resolved = index >= 0 ? _updateExisting(events, index, event) : _createNew(events, event);

    final nextSnapshot = currentSnapshot
        .copyWith(events: [...events.where((item) => item.id != resolved.id), resolved]..sort(_sortByStart));
    await _cache.writeJson(_cacheKey, nextSnapshot.toJson());
    return resolved;
  }

  Future<void> deleteEvent(String id) async {
    final currentSnapshot = _readCachedSnapshot();
    if (currentSnapshot == null) {
      return;
    }
    final events = List<CalendarEvent>.from(currentSnapshot.events)..removeWhere((event) => event.id == id);
    final nextSnapshot = currentSnapshot.copyWith(events: events);
    await _cache.writeJson(_cacheKey, nextSnapshot.toJson());
  }

  CalendarSnapshot? _readCachedSnapshot() {
    final cached = _cache.readJson(_cacheKey);
    if (cached == null) {
      return null;
    }
    try {
      final payload = Map<String, dynamic>.from(cached['value'] as Map? ?? cached);
      final snapshot = CalendarSnapshot.fromJson(payload);
      final updatedAt = cached['updatedAt'] as String?;
      if (updatedAt == null) {
        return snapshot;
      }
      final generatedAt = DateTime.tryParse(updatedAt);
      return generatedAt != null ? snapshot.copyWith(generatedAt: generatedAt) : snapshot;
    } catch (_) {
      return null;
    }
  }

  List<CalendarEvent> _seedDefaults() {
    final now = DateTime.now();
    final random = Random(now.millisecondsSinceEpoch);

    CalendarEvent makeEvent({
      required int dayOffset,
      required int hour,
      required String title,
      String? description,
      String? location,
      CalendarEventStatus status = CalendarEventStatus.scheduled,
      String? meetingLink,
    }) {
      final start = DateTime(now.year, now.month, now.day + dayOffset, hour);
      final end = start.add(const Duration(hours: 1, minutes: 30));
      return CalendarEvent(
        id: 'seed-${start.millisecondsSinceEpoch}-${random.nextInt(9999)}',
        title: title,
        description: description ?? 'Auto-generated from Fixnado command centre.',
        location: location ?? 'Virtual briefing',
        start: start,
        end: end,
        attendees: const ['ops@fixnado.com', 'provider@fixnado.com'],
        meetingLink: meetingLink,
        status: status,
        notes: 'Seeded for quick-start calendar experience.',
        coverImageUrl:
            'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
      );
    }

    return [
      makeEvent(
        dayOffset: 0,
        hour: 10,
        title: 'Enterprise mobilisation stand-up',
        meetingLink: 'https://meet.fixnado.com/mobilisation',
        status: CalendarEventStatus.confirmed,
      ),
      makeEvent(
        dayOffset: 1,
        hour: 14,
        title: 'On-site survey • Canary Wharf',
        location: 'Citigroup Centre, 25 Canada Square',
      ),
      makeEvent(
        dayOffset: 3,
        hour: 9,
        title: 'H&S evidence review',
        status: CalendarEventStatus.scheduled,
      ),
      makeEvent(
        dayOffset: -1,
        hour: 16,
        title: 'Close-out retrospective',
        status: CalendarEventStatus.completed,
      ),
    ]..sort(_sortByStart);
  }

  CalendarEvent _createNew(List<CalendarEvent> events, CalendarEvent event) {
    final newEvent = event.id.isNotEmpty
        ? event
        : event.copyWith(id: 'evt-${DateTime.now().millisecondsSinceEpoch}-${events.length + 1}');
    events.add(newEvent);
    events.sort(_sortByStart);
    return newEvent;
  }

  CalendarEvent _updateExisting(List<CalendarEvent> events, int index, CalendarEvent event) {
    events[index] = event;
    events.sort(_sortByStart);
    return event;
  }

  int _sortByStart(CalendarEvent a, CalendarEvent b) => a.start.compareTo(b.start);
}

final calendarRepositoryProvider = Provider<CalendarRepository>((ref) {
  final cache = ref.watch(localCacheProvider);
  return CalendarRepository(cache);
});

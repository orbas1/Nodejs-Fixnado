import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/calendar_repository.dart';
import '../domain/calendar_models.dart';

final calendarControllerProvider =
    StateNotifierProvider<CalendarController, CalendarViewState>((ref) {
  final repository = ref.watch(calendarRepositoryProvider);
  return CalendarController(repository)..initialise();
});

class CalendarController extends StateNotifier<CalendarViewState> {
  CalendarController(this._repository)
      : super(CalendarViewState.initial(DateTime.now()));

  final CalendarRepository _repository;
  Timer? _debounce;

  void initialise() {
    unawaited(loadEvents());
  }

  Future<void> loadEvents({bool bypassCache = false}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final result = await _repository.loadEvents(bypassCache: bypassCache);
      final snapshot = result.snapshot;
      final selected = state.selectedDate ?? DateTime.now();
      state = state.copyWith(
        isLoading: false,
        offline: result.offline,
        events: snapshot.events,
        lastRefreshed: snapshot.generatedAt,
        selectedDate: DateTime(selected.year, selected.month, selected.day),
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }

  void selectDate(DateTime date) {
    final normalised = DateTime(date.year, date.month, date.day);
    state = state.copyWith(selectedDate: normalised, focusMonth: DateTime(date.year, date.month));
  }

  void previousMonth() {
    final focus = state.focusMonth;
    final previous = DateTime(focus.year, focus.month - 1);
    state = state.copyWith(focusMonth: previous);
  }

  void nextMonth() {
    final focus = state.focusMonth;
    final next = DateTime(focus.year, focus.month + 1);
    state = state.copyWith(focusMonth: next);
  }

  CalendarEvent createDraft({DateTime? forDate}) {
    final reference = forDate ?? state.selectedDate ?? DateTime.now();
    final start = DateTime(reference.year, reference.month, reference.day, 10, 0);
    final end = start.add(const Duration(hours: 1));
    final format = DateFormat('EEE d MMM, HH:mm');
    return CalendarEvent(
      id: '',
      title: 'Field visit – ${format.format(start)}',
      description: 'Outline the scope, confirm access logistics, and capture compliance artefacts.',
      location: 'To be confirmed',
      start: start,
      end: end,
      attendees: const ['provider@fixnado.com'],
      notes: 'Draft created from mobile calendar.',
    );
  }

  Future<void> saveEvent(CalendarEvent event) async {
    state = state.copyWith(isSaving: true, errorMessage: null);
    try {
      final saved = await _repository.upsertEvent(event);
      final events = List<CalendarEvent>.from(state.events);
      final index = events.indexWhere((item) => item.id == saved.id);
      if (index >= 0) {
        events[index] = saved;
      } else {
        events.add(saved);
      }
      events.sort((a, b) => a.start.compareTo(b.start));
      state = state.copyWith(isSaving: false, events: events, offline: false);
    } on Exception catch (error) {
      state = state.copyWith(isSaving: false, errorMessage: error.toString());
    }
  }

  Future<void> deleteEvent(String id) async {
    state = state.copyWith(isSaving: true, errorMessage: null);
    try {
      await _repository.deleteEvent(id);
      final events = List<CalendarEvent>.from(state.events)
        ..removeWhere((event) => event.id == id);
      state = state.copyWith(isSaving: false, events: events);
    } on Exception catch (error) {
      state = state.copyWith(isSaving: false, errorMessage: error.toString());
    }
  }

  void scheduleAutoSave(CalendarEvent event) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 650), () => saveEvent(event));
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}

class CalendarViewState {
  CalendarViewState({
    required this.events,
    required this.focusMonth,
    required this.selectedDate,
    required this.isLoading,
    required this.isSaving,
    required this.offline,
    required this.errorMessage,
    required this.lastRefreshed,
  });

  final List<CalendarEvent> events;
  final DateTime focusMonth;
  final DateTime? selectedDate;
  final bool isLoading;
  final bool isSaving;
  final bool offline;
  final String? errorMessage;
  final DateTime? lastRefreshed;

  List<CalendarEvent> eventsForSelectedDate() {
    if (selectedDate == null) {
      return const [];
    }
    return events
        .where((event) => event.start.year == selectedDate!.year &&
            event.start.month == selectedDate!.month &&
            event.start.day == selectedDate!.day)
        .toList()
      ..sort((a, b) => a.start.compareTo(b.start));
  }

  CalendarViewState copyWith({
    List<CalendarEvent>? events,
    DateTime? focusMonth,
    DateTime? selectedDate,
    bool? isLoading,
    bool? isSaving,
    bool? offline,
    String? errorMessage,
    DateTime? lastRefreshed,
  }) {
    return CalendarViewState(
      events: events ?? List<CalendarEvent>.from(this.events),
      focusMonth: focusMonth ?? this.focusMonth,
      selectedDate: selectedDate ?? this.selectedDate,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      offline: offline ?? this.offline,
      errorMessage: errorMessage,
      lastRefreshed: lastRefreshed ?? this.lastRefreshed,
    );
  }

  factory CalendarViewState.initial(DateTime now) {
    final focus = DateTime(now.year, now.month);
    final selected = DateTime(now.year, now.month, now.day);
    return CalendarViewState(
      events: const [],
      focusMonth: focus,
      selectedDate: selected,
      isLoading: true,
      isSaving: false,
      offline: false,
      errorMessage: null,
      lastRefreshed: null,
    );
  }
}

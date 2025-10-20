import 'package:collection/collection.dart';

class CalendarEvent {
  CalendarEvent({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.start,
    required this.end,
    required this.attendees,
    this.meetingLink,
    this.coverImageUrl,
    this.status = CalendarEventStatus.scheduled,
    this.notes,
  });

  final String id;
  final String title;
  final String description;
  final String location;
  final DateTime start;
  final DateTime end;
  final List<String> attendees;
  final String? meetingLink;
  final String? coverImageUrl;
  final CalendarEventStatus status;
  final String? notes;

  Duration get duration => end.difference(start);

  CalendarEvent copyWith({
    String? id,
    String? title,
    String? description,
    String? location,
    DateTime? start,
    DateTime? end,
    List<String>? attendees,
    String? meetingLink,
    String? coverImageUrl,
    CalendarEventStatus? status,
    String? notes,
  }) {
    return CalendarEvent(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      location: location ?? this.location,
      start: start ?? this.start,
      end: end ?? this.end,
      attendees: attendees ?? List<String>.from(this.attendees),
      meetingLink: meetingLink ?? this.meetingLink,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      status: status ?? this.status,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'location': location,
      'start': start.toIso8601String(),
      'end': end.toIso8601String(),
      'attendees': attendees,
      'meetingLink': meetingLink,
      'coverImageUrl': coverImageUrl,
      'status': status.name,
      'notes': notes,
    };
  }

  factory CalendarEvent.fromJson(Map<String, dynamic> json) {
    return CalendarEvent(
      id: json['id'] as String? ?? 'event-${DateTime.now().millisecondsSinceEpoch}',
      title: json['title'] as String? ?? 'Untitled engagement',
      description: json['description'] as String? ?? '',
      location: json['location'] as String? ?? 'TBC',
      start: DateTime.tryParse(json['start'] as String? ?? '') ?? DateTime.now(),
      end: DateTime.tryParse(json['end'] as String? ?? '') ??
          DateTime.now().add(const Duration(hours: 1)),
      attendees: (json['attendees'] as List<dynamic>? ?? const [])
          .map((value) => value.toString())
          .toList(),
      meetingLink: json['meetingLink'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      status: CalendarEventStatus.values.firstWhere(
        (value) => value.name == json['status'],
        orElse: () => CalendarEventStatus.scheduled,
      ),
      notes: json['notes'] as String?,
    );
  }
}

enum CalendarEventStatus { scheduled, confirmed, completed, cancelled }

extension CalendarEventStatusLabels on CalendarEventStatus {
  String get label {
    switch (this) {
      case CalendarEventStatus.scheduled:
        return 'Scheduled';
      case CalendarEventStatus.confirmed:
        return 'Confirmed';
      case CalendarEventStatus.completed:
        return 'Completed';
      case CalendarEventStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class CalendarSnapshot {
  CalendarSnapshot({required this.events, required this.generatedAt});

  final List<CalendarEvent> events;
  final DateTime generatedAt;

  CalendarSnapshot copyWith({List<CalendarEvent>? events, DateTime? generatedAt}) {
    return CalendarSnapshot(
      events: events ?? List<CalendarEvent>.from(this.events),
      generatedAt: generatedAt ?? this.generatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'generatedAt': generatedAt.toIso8601String(),
      'events': events.map((event) => event.toJson()).toList(),
    };
  }

  factory CalendarSnapshot.fromJson(Map<String, dynamic> json) {
    final events = (json['events'] as List<dynamic>? ?? const [])
        .map((item) => CalendarEvent.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final generatedAt = DateTime.tryParse(json['generatedAt'] as String? ?? '');
    return CalendarSnapshot(
      events: events,
      generatedAt: generatedAt ?? DateTime.now(),
    );
  }
}

class CalendarDraft {
  CalendarDraft({required this.events});

  final List<CalendarEvent> events;

  bool matchesSnapshot(CalendarSnapshot snapshot) {
    final comparator = const DeepCollectionEquality().equals;
    return comparator(snapshot.events.map((event) => event.toJson()).toList(),
        events.map((event) => event.toJson()).toList());
  }
}

class CalendarLoadResult {
  CalendarLoadResult({required this.snapshot, required this.offline});

  final CalendarSnapshot snapshot;
  final bool offline;
}

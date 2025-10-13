import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

class TimeZoneResolver {
  const TimeZoneResolver();

  Future<String> resolve() async {
    final name = DateTime.now().timeZoneName.trim();
    if (name.isEmpty) {
      return _defaultZone;
    }

    final normalised = name.toUpperCase();
    if (_namedZones.containsKey(normalised)) {
      return _namedZones[normalised]!;
    }

    // Attempt to use environment TZ variable if supplied (helpful for tests)
    final env = Platform.environment['TZ'];
    if (env != null && env.isNotEmpty) {
      return env;
    }

    return _defaultZone;
  }

  static const _defaultZone = 'UTC';

  static const Map<String, String> _namedZones = {
    'UTC': 'UTC',
    'GMT': 'Europe/London',
    'BST': 'Europe/London',
    'IST': 'Europe/Dublin',
    'WET': 'Europe/Lisbon',
    'CET': 'Europe/Paris',
    'CEST': 'Europe/Paris',
    'EET': 'Europe/Athens',
    'EEST': 'Europe/Athens',
    'MSK': 'Europe/Moscow',
    'AST': 'America/Halifax',
    'ADT': 'America/Halifax',
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'CST': 'America/Chicago',
    'CDT': 'America/Chicago',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
  };
}

final timeZoneResolverProvider = Provider<TimeZoneResolver>((ref) => const TimeZoneResolver());

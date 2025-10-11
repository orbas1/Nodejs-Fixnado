import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class LocalCache {
  LocalCache(this._prefs);

  final SharedPreferences _prefs;

  Future<void> writeJson(String key, Object value) async {
    final payload = jsonEncode({
      'updatedAt': DateTime.now().toIso8601String(),
      'value': value,
    });
    await _prefs.setString(key, payload);
  }

  Map<String, dynamic>? readJson(String key) {
    final stored = _prefs.getString(key);
    if (stored == null) {
      return null;
    }
    try {
      final decoded = jsonDecode(stored);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> remove(String key) => _prefs.remove(key);
}

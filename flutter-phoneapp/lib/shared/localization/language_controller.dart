import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/bootstrap.dart';
import '../../core/storage/local_cache.dart';
import 'language_options.dart';

const _storageKey = 'fixnado.mobile.locale';

final languageControllerProvider =
    StateNotifierProvider<LanguageController, Locale>((ref) {
  final cache = ref.watch(localCacheProvider);
  return LanguageController(cache);
}, name: 'languageController');

class LanguageController extends StateNotifier<Locale> {
  LanguageController(this._cache) : super(_initialLocale(_cache));

  final LocalCache _cache;

  static Locale _initialLocale(LocalCache cache) {
    final stored = cache.readString(_storageKey);
    final resolved = _matchLocale(stored);
    return resolved ?? const Locale('en', 'GB');
  }

  Future<void> setLocale(Locale locale) async {
    if (!isSupported(locale)) {
      return;
    }
    state = locale;
    final code = _formatLocale(locale);
    await _cache.writeString(_storageKey, code);
  }

  static bool isSupported(Locale locale) {
    return languageOptions.any((option) => _isSameLocale(option.locale, locale));
  }

  static String _formatLocale(Locale locale) {
    final languageCode = locale.languageCode.toLowerCase();
    final countryCode = locale.countryCode?.toUpperCase();
    return countryCode == null ? languageCode : '$languageCode-$countryCode';
  }

  static Locale? _matchLocale(String? candidate) {
    if (candidate == null || candidate.isEmpty) {
      return null;
    }
    final normalised = candidate.replaceAll('_', '-').toLowerCase();
    final match = languageOptions.firstWhereOrNull((option) {
      final optionCode = _formatLocale(option.locale).toLowerCase();
      if (optionCode == normalised) {
        return true;
      }
      final base = option.locale.languageCode.toLowerCase();
      return normalised == base;
    });
    return match?.locale;
  }

  static bool _isSameLocale(Locale a, Locale b) {
    final sameLanguage = a.languageCode.toLowerCase() == b.languageCode.toLowerCase();
    if (!sameLanguage) {
      return false;
    }
    final aCountry = a.countryCode?.toLowerCase();
    final bCountry = b.countryCode?.toLowerCase();
    return aCountry == bCountry;
  }
}

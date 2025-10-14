import 'package:flutter/material.dart';

class LanguageOption {
  const LanguageOption({
    required this.locale,
    required this.label,
    this.flag,
  });

  final Locale locale;
  final String label;
  final String? flag;
}

const languageOptions = <LanguageOption>[
  LanguageOption(locale: Locale('ar', 'SA'), label: 'العربية (السعودية)', flag: '🇸🇦'),
  LanguageOption(locale: Locale('de', 'DE'), label: 'Deutsch (Deutschland)', flag: '🇩🇪'),
  LanguageOption(locale: Locale('en', 'GB'), label: 'English (United Kingdom)', flag: '🇬🇧'),
  LanguageOption(locale: Locale('es', 'ES'), label: 'Español (España)', flag: '🇪🇸'),
  LanguageOption(locale: Locale('fr', 'FR'), label: 'Français (France)', flag: '🇫🇷'),
  LanguageOption(locale: Locale('hi', 'IN'), label: 'हिन्दी (भारत)', flag: '🇮🇳'),
  LanguageOption(locale: Locale('it', 'IT'), label: 'Italiano (Italia)', flag: '🇮🇹'),
  LanguageOption(locale: Locale('pl', 'PL'), label: 'Polski (Polska)', flag: '🇵🇱'),
  LanguageOption(locale: Locale('pt', 'BR'), label: 'Português (Brasil)', flag: '🇧🇷'),
  LanguageOption(locale: Locale('ru', 'RU'), label: 'Русский (Россия)', flag: '🇷🇺'),
];

List<Locale> supportedLocales() =>
    languageOptions.map((option) => option.locale).toList(growable: false);

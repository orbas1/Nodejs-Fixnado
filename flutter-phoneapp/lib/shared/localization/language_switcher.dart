import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'language_controller.dart';
import 'language_options.dart';

class LanguageSwitcher extends ConsumerWidget {
  const LanguageSwitcher({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(languageControllerProvider);
    final controller = ref.read(languageControllerProvider.notifier);
    final selected = languageOptions.firstWhere(
      (option) {
        final sameLanguage =
            option.locale.languageCode.toLowerCase() == locale.languageCode.toLowerCase();
        final optionCountry = option.locale.countryCode?.toLowerCase();
        final selectedCountry = locale.countryCode?.toLowerCase();
        return sameLanguage && optionCountry == selectedCountry;
      },
      orElse: () => languageOptions.first,
    );

    final baseStyle = compact
        ? GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)
        : GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600);

    return Semantics(
      container: true,
      label: 'Change language',
      child: DropdownButtonHideUnderline(
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.blueGrey.shade100),
            boxShadow: compact
                ? null
                : [
                    BoxShadow(
                      color: Colors.blueGrey.withOpacity(0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
          ),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: compact ? 12 : 16,
              vertical: compact ? 6 : 10,
            ),
            child: DropdownButton<Locale>(
              value: selected.locale,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
              style: baseStyle.copyWith(color: Colors.blueGrey.shade700),
              onChanged: (value) {
                if (value != null) {
                  controller.setLocale(value);
                }
              },
              items: languageOptions
                  .map(
                    (option) => DropdownMenuItem<Locale>(
                      value: option.locale,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (option.flag != null) ...[
                            Text(option.flag!, style: const TextStyle(fontSize: 16)),
                            const SizedBox(width: 6),
                          ],
                          Flexible(
                            child: Text(
                              option.label,
                              style: baseStyle.copyWith(color: Colors.blueGrey.shade800),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
      ),
    );
  }
}

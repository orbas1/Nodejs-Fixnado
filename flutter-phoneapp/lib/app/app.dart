import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../features/auth/presentation/auth_gate.dart';
import 'app_shell.dart';

class FixnadoApp extends ConsumerWidget {
  const FixnadoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final baseTheme = ThemeData(
      useMaterial3: true,
      colorSchemeSeed: const Color(0xFF0E1C36),
      scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      textTheme: GoogleFonts.interTextTheme(),
    );

    final theme = baseTheme.copyWith(
      chipTheme: baseTheme.chipTheme.copyWith(
        labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: baseTheme.colorScheme.onSurface,
        elevation: 0,
        titleTextStyle: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: baseTheme.colorScheme.onSurface),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: GoogleFonts.inter(fontSize: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
        filled: true,
        fillColor: Colors.white,
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        margin: EdgeInsets.zero,
      ),
    );

    return MaterialApp(
      title: 'Fixnado Mobile',
      debugShowCheckedModeBanner: false,
      theme: theme,
      home: const AuthGate(),
    );
  }
}

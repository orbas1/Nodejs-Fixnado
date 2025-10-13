import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../features/analytics/presentation/analytics_dashboard_screen.dart';
import '../features/auth/presentation/role_selector.dart';
import '../features/bookings/presentation/booking_screen.dart';
import '../features/feed/presentation/live_feed_screen.dart';
import '../features/explorer/presentation/explorer_screen.dart';
import '../features/rentals/presentation/rental_screen.dart';

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
      home: const AppShell(),
    );
  }
}

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final destinations = _NavigationDestination.values;
    final selected = destinations[_index];

    return Scaffold(
      appBar: AppBar(
        title: Text(selected.title, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        actions: const [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: RoleSelector(),
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          ExplorerScreen(),
          LiveFeedScreen(),
          BookingScreen(),
          RentalScreen(),
          AnalyticsDashboardScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: destinations
            .map(
              (destination) => NavigationDestination(
                icon: Icon(destination.icon),
                label: destination.title,
              ),
            )
            .toList(),
        onDestinationSelected: (index) => setState(() => _index = index),
      ),
    );
  }
}

enum _NavigationDestination {
  explorer('Explorer', Icons.map_outlined),
  feed('Feed', Icons.dynamic_feed_outlined),
  bookings('Bookings', Icons.event_available_outlined),
  rentals('Rentals', Icons.inventory_2_outlined),
  operations('Ops Pulse', Icons.analytics_outlined);

  const _NavigationDestination(this.title, this.icon);

  final String title;
  final IconData icon;
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../features/auth/application/auth_controller.dart';
import '../features/auth/presentation/role_selector.dart';
import '../features/explorer/presentation/explorer_screen.dart';
import '../features/bookings/presentation/booking_screen.dart';
import '../features/rentals/presentation/rental_screen.dart';
import '../features/analytics/presentation/analytics_dashboard_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/tools/presentation/tools_screen.dart';
import '../features/learning/presentation/learning_hub_screen.dart';
import '../features/home/presentation/workspaces_screen.dart';

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
        actions: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: RoleSelector(),
          ),
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          HomeScreen(),
          ExplorerScreen(),
          WorkspacesScreen(),
          ToolsScreen(),
          LearningHubScreen(),
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
  home('Home', Icons.home_outlined),
  explorer('Explorer', Icons.map_outlined),
  workspaces('Workspaces', Icons.dashboard_customize_outlined),
  tools('Tools', Icons.handyman_outlined),
  learning('Learning', Icons.school_outlined),
  bookings('Bookings', Icons.event_available_outlined),
  rentals('Rentals', Icons.inventory_2_outlined),
  operations('Ops Pulse', Icons.analytics_outlined);

  const _NavigationDestination(this.title, this.icon);

  final String title;
  final IconData icon;
}

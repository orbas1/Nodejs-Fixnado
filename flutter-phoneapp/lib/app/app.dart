import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:meta/meta.dart';

import '../features/auth/presentation/auth_gate.dart';
import 'app_shell.dart';
import '../features/analytics/presentation/analytics_dashboard_screen.dart';
import '../features/auth/presentation/role_selector.dart';
import '../features/auth/domain/role_scope.dart';
import '../features/auth/domain/user_role.dart';
import '../features/bookings/presentation/booking_screen.dart';
import '../features/communications/presentation/communications_screen.dart';
import '../features/feed/presentation/live_feed_screen.dart';
import '../features/explorer/presentation/explorer_screen.dart';
import '../features/profile/presentation/profile_management_screen.dart';
import '../features/rentals/presentation/rental_screen.dart';
import '../features/services/presentation/service_management_screen.dart';
import '../features/creation/presentation/creation_studio_screen.dart';
import '../features/materials/presentation/materials_screen.dart';
import '../features/enterprise/presentation/enterprise_dashboard_screen.dart';
import '../features/finance/presentation/finance_dashboard_screen.dart';
import '../shared/localization/language_controller.dart';
import '../shared/localization/language_options.dart';
import '../shared/localization/language_switcher.dart';
import '../features/legal/presentation/consent_overlay.dart';
import '../features/home/presentation/workspaces_screen.dart';

class FixnadoApp extends ConsumerWidget {
  const FixnadoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(languageControllerProvider);
    final locales = supportedLocales();
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
      locale: locale,
      supportedLocales: locales,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const AuthGate(),
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
    final role = ref.watch(currentRoleProvider);
    final destinations = _visibleDestinationsForRole(role);
    final currentIndex = _index.clamp(0, destinations.length - 1);
    final selected = destinations[currentIndex];
    final operationsLabel = operationsLabelForRole(role);
    final selectedTitle =
        selected == _NavigationDestination.operations ? operationsLabel : selected.title;

    final scaffold = Scaffold(
      appBar: AppBar(
        title: Text(selectedTitle, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        actions: const [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: RoleSelector(),
          ),
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: LanguageSwitcher(compact: true),
          ),
        ],
      ),
      body: IndexedStack(
        index: currentIndex,
        children: destinations
            .map((destination) => _buildScreenForDestination(destination, role))
            .toList(growable: false),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: destinations
            .map(
              (destination) => NavigationDestination(
                icon: Icon(destination.icon),
                label: destination == _NavigationDestination.operations
                    ? operationsLabelForRole(role)
                    : destination.title,
              ),
            )
            .toList(),
        onDestinationSelected: (index) => setState(() => _index = index),
      ),
    );

    return Stack(
      children: [
        scaffold,
        const ConsentOverlay(),
      ],
    );
  }

  static const Set<UserRole> _communicationsAllowedRoles = {
    UserRole.provider,
    UserRole.enterprise,
    UserRole.support,
    UserRole.operations,
    UserRole.admin,
  };

  static const Set<UserRole> _financeAllowedRoles = {
    UserRole.provider,
    UserRole.enterprise,
    UserRole.operations,
    UserRole.admin,
  };

  static const Set<UserRole> _operationsAllowedRoles = {
    UserRole.provider,
    UserRole.enterprise,
    UserRole.operations,
    UserRole.admin,
  };

  static const Set<UserRole> _creationAllowedRoles = {
    UserRole.provider,
    UserRole.enterprise,
    UserRole.admin,
  };

  List<_NavigationDestination> _visibleDestinationsForRole(UserRole role) {
    final items = <_NavigationDestination>[
      _NavigationDestination.explorer,
      _NavigationDestination.feed,
      _NavigationDestination.bookings,
      _NavigationDestination.rentals,
      _NavigationDestination.materials,
      _NavigationDestination.workspaces,
    ];
    if (_financeAllowedRoles.contains(role)) {
      items.add(_NavigationDestination.finance);
    }
    if (_creationAllowedRoles.contains(role)) {
      items.add(_NavigationDestination.creation);
    }
    if (_communicationsAllowedRoles.contains(role)) {
      items.add(_NavigationDestination.inbox);
    }
    items.add(_NavigationDestination.profile);
    if (_operationsAllowedRoles.contains(role)) {
      items.add(_NavigationDestination.operations);
    }
    return items;
  }

  Widget _buildScreenForDestination(_NavigationDestination destination, UserRole role) {
    switch (destination) {
      case _NavigationDestination.explorer:
        return const ExplorerScreen();
      case _NavigationDestination.feed:
        return const LiveFeedScreen();
      case _NavigationDestination.bookings:
        return const BookingScreen();
      case _NavigationDestination.rentals:
        return const RentalScreen();
      case _NavigationDestination.materials:
        return const MaterialsScreen();
      case _NavigationDestination.workspaces:
        return const WorkspacesScreen();
      case _NavigationDestination.inbox:
        return const CommunicationsScreen();
      case _NavigationDestination.profile:
        return const ProfileManagementScreen();
      case _NavigationDestination.finance:
        return const FinanceDashboardScreen();
      case _NavigationDestination.operations:
        if (role == UserRole.provider) {
          return const ServiceManagementScreen();
        }
        if (role == UserRole.enterprise) {
          return const EnterpriseDashboardScreen();
        }
        return const AnalyticsDashboardScreen();
      case _NavigationDestination.creation:
        return const CreationStudioScreen();
    }
  }
}

@visibleForTesting
String operationsLabelForRole(UserRole role) {
  switch (role) {
    case UserRole.provider:
      return 'Service Ops';
    case UserRole.enterprise:
      return 'Enterprise analytics';
    default:
      return _NavigationDestination.operations.title;
  }
}

enum _NavigationDestination {
  explorer('Explorer', Icons.map_outlined),
  feed('Feed', Icons.dynamic_feed_outlined),
  bookings('Bookings', Icons.event_available_outlined),
  rentals('Rentals', Icons.inventory_2_outlined),
  materials('Materials', Icons.precision_manufacturing_outlined),
  workspaces('Workspaces', Icons.dashboard_customize_outlined),
  inbox('Inbox', Icons.inbox_outlined),
  profile('Profile', Icons.person_outline),
  finance('Finance', Icons.payments_outlined),
  creation('Create', Icons.auto_fix_high_outlined),
  operations('Ops Pulse', Icons.analytics_outlined);

  const _NavigationDestination(this.title, this.icon);

  final String title;
  final IconData icon;
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'profile_management_screen.dart';
import 'profile_view_screen.dart';

class ProfileHubScreen extends ConsumerStatefulWidget {
  const ProfileHubScreen({super.key});

  @override
  ConsumerState<ProfileHubScreen> createState() => _ProfileHubScreenState();
}

class _ProfileHubScreenState extends ConsumerState<ProfileHubScreen> with SingleTickerProviderStateMixin {
  late TabController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Container(
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: TabBar(
            controller: _controller,
            isScrollable: true,
            indicator: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: theme.colorScheme.primary,
            ),
            labelPadding: const EdgeInsets.symmetric(horizontal: 16),
            labelColor: theme.colorScheme.onPrimary,
            unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
            labelStyle: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700),
            unselectedLabelStyle: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600),
            tabs: const [
              Tab(text: 'Experience'),
              Tab(text: 'Manage'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _controller,
            children: const [
              ProfileViewScreen(),
              ProfileManagementScreen(),
            ],
          ),
        ),
      ],
    );
  }
}

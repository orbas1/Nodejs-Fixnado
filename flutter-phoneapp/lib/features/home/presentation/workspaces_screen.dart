import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import '../../auth/domain/auth_models.dart';
import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';

const Map<UserRole, String> _workspaceHeadlines = {
  UserRole.customer: 'Coordinate bookings, track crews, and manage consent receipts.',
  UserRole.serviceman: 'Review assigned jobs, travel buffers, and completion quality.',
  UserRole.provider: 'Monitor revenue, crew utilisation, and storefront readiness.',
  UserRole.enterprise: 'Observe portfolio spend, SLA performance, and escalations.',
  UserRole.support: 'Respond to escalations, verify compliance, and assist customers.',
  UserRole.operations: 'Command live feed, geo-matching, and regional dispatch orchestration.',
  UserRole.admin: 'Administer platform controls, finance ledgers, and security telemetry.'
};

const Map<UserRole, IconData> _workspaceIcons = {
  UserRole.customer: Icons.home_work_outlined,
  UserRole.serviceman: Icons.construction_outlined,
  UserRole.provider: Icons.storefront_outlined,
  UserRole.enterprise: Icons.business_outlined,
  UserRole.support: Icons.support_agent_outlined,
  UserRole.operations: Icons.analytics_outlined,
  UserRole.admin: Icons.security_outlined,
};

class WorkspacesScreen extends ConsumerWidget {
  const WorkspacesScreen({super.key});

  void _switchRole(WidgetRef ref, UserRole target) {
    final authState = ref.read(authControllerProvider);
    ref.read(currentRoleProvider.notifier).state = target;
    if (authState.stage == AuthStage.authenticated) {
      ref.read(authControllerProvider.notifier).setActiveRole(target);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final roles = ref.watch(availableRolesProvider);
    final current = ref.watch(currentRoleProvider);

    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Workspaces', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text(
                  'Switch between dashboards tailored to your role. Metrics, alerts, and automations adjust instantly.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 1,
              childAspectRatio: 1.6,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final role = roles[index];
                final icon = _workspaceIcons[role] ?? Icons.dashboard_customize_outlined;
                final description = _workspaceHeadlines[role] ?? 'Workspace overview unavailable.';
                final isActive = role == current;

                return InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () => _switchRole(ref, role),
                  child: Ink(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: isActive
                            ? theme.colorScheme.primary.withOpacity(0.4)
                            : theme.colorScheme.outlineVariant,
                      ),
                      color: isActive
                          ? theme.colorScheme.primary.withOpacity(0.08)
                          : theme.colorScheme.surface,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 24,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                              child: Icon(icon, color: theme.colorScheme.primary),
                            ),
                            Chip(
                              backgroundColor: isActive
                                  ? theme.colorScheme.primary
                                  : theme.colorScheme.surfaceVariant,
                              label: Text(
                                isActive ? 'Active' : 'Switch',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: isActive ? theme.colorScheme.onPrimary : theme.colorScheme.onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          role.displayName,
                          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          description,
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                        const Spacer(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Tap to enter workspace',
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const Icon(Icons.arrow_forward_rounded, size: 20),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
              childCount: roles.length,
            ),
          ),
        ),
      ],
    );
  }
}

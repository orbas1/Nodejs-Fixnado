import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/auth_controller.dart';
import '../domain/role_scope.dart';
import '../domain/user_role.dart';

class RoleSelector extends ConsumerWidget {
  const RoleSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(currentRoleProvider);
    final roles = ref.watch(availableRolesProvider);
    final effectiveRole = roles.contains(role) && roles.isNotEmpty ? role : roles.first;

    return DropdownButton<UserRole>(
      value: effectiveRole,
      underline: const SizedBox.shrink(),
      items: roles
          .map(
            (value) => DropdownMenuItem<UserRole>(
              value: value,
              child: Text(value.displayName),
            ),
          )
          .toList(),
      onChanged: (value) {
        if (value != null) {
          ref.read(currentRoleProvider.notifier).state = value;
          ref.read(authControllerProvider.notifier).setActiveRole(value);
        }
      },
    );
  }
}

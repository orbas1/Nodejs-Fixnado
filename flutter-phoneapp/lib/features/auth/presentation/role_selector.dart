import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/role_scope.dart';
import '../domain/user_role.dart';

class RoleSelector extends ConsumerWidget {
  const RoleSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(currentRoleProvider);
    return DropdownButton<UserRole>(
      value: role,
      underline: const SizedBox.shrink(),
      items: UserRole.values
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
        }
      },
    );
  }
}

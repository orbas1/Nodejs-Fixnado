import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'user_role.dart';

final currentRoleProvider = StateProvider<UserRole>((ref) => UserRole.customer, name: 'currentRoleProvider');

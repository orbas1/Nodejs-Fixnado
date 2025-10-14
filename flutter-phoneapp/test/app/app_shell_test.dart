import 'package:flutter_test/flutter_test.dart';

import 'package:fixnado_mobile/app/app.dart';
import 'package:fixnado_mobile/features/auth/domain/user_role.dart';

void main() {
  group('operationsLabelForRole', () {
    test('returns Service Ops for provider role', () {
      expect(operationsLabelForRole(UserRole.provider), 'Service Ops');
    });

    test('returns Enterprise analytics for enterprise role', () {
      expect(operationsLabelForRole(UserRole.enterprise), 'Enterprise analytics');
    });

    test('defaults to Ops Pulse for other roles', () {
      expect(operationsLabelForRole(UserRole.operations), 'Ops Pulse');
      expect(operationsLabelForRole(UserRole.customer), 'Ops Pulse');
    });
  });
}

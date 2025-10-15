import 'package:flutter_test/flutter_test.dart';

import 'package:fixnado_mobile/features/compliance/domain/data_subject_request.dart';

void main() {
  test('fromJson merges snake_case payloads and identifies overdue records', () {
    final request = DataSubjectRequest.fromJson({
      'id': 'req-100',
      'subject_email': 'privacy.contact@example.com',
      'request_type': 'erasure',
      'status': 'in_progress',
      'requested_at': '2020-02-10T08:00:00Z',
      'due_at': '2020-02-15T08:00:00Z',
      'audit_log': [
        {'actor': 'ops', 'action': 'created'}
      ]
    });

    expect(request.id, 'req-100');
    expect(request.requestType, 'erasure');
    expect(request.dueAt, isNotNull);
    expect(request.auditTrail, isNotEmpty);
    expect(request.isOverdue, isTrue);
  });

  test('copyWith preserves metadata and toJson emits ISO8601 due date', () {
    final base = DataSubjectRequest(
      id: 'req-200',
      subjectEmail: 'subject@example.com',
      requestType: 'access',
      status: 'received',
      requestedAt: DateTime.parse('2025-03-01T09:00:00Z'),
      dueAt: DateTime.parse('2025-03-31T09:00:00Z'),
      auditTrail: const [],
    );

    final updated = base.copyWith(status: 'completed', processedAt: DateTime.parse('2025-03-05T09:00:00Z'));
    final json = updated.toJson();

    expect(updated.status, 'completed');
    expect(json['status'], 'completed');
    expect(json['dueAt'], '2025-03-31T09:00:00.000Z');
    expect(json['processedAt'], '2025-03-05T09:00:00.000Z');
  });
}

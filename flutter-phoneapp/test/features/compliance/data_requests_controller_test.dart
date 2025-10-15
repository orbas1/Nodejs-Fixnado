import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:fixnado_mobile/features/compliance/data/data_governance_repository.dart';
import 'package:fixnado_mobile/features/compliance/domain/data_subject_request.dart';
import 'package:fixnado_mobile/features/compliance/presentation/data_requests_controller.dart';

class _MockDataGovernanceRepository extends Mock implements DataGovernanceRepository {}

void main() {
  final request = DataSubjectRequest(
    id: 'req-500',
    subjectEmail: 'operator@example.com',
    requestType: 'rectification',
    status: 'received',
    requestedAt: DateTime.parse('2025-03-01T08:00:00Z'),
    dueAt: DateTime.parse('2025-03-20T08:00:00Z'),
    auditTrail: const [],
  );

  setUpAll(() {
    registerFallbackValue('');
  });

  test('load fetches requests and metrics with provided filters', () async {
    final repository = _MockDataGovernanceRepository();
    when(
      () => repository.fetchRequests(
        status: 'received',
        requestType: any(named: 'requestType'),
        regionCode: 'GB',
        subjectEmail: any(named: 'subjectEmail'),
        submittedAfter: any(named: 'submittedAfter'),
        submittedBefore: any(named: 'submittedBefore'),
      ),
    ).thenAnswer((_) async => [request]);
    when(
      () => repository.fetchMetrics(
        status: 'received',
        requestType: any(named: 'requestType'),
        regionCode: 'GB',
        subjectEmail: any(named: 'subjectEmail'),
        submittedAfter: any(named: 'submittedAfter'),
        submittedBefore: any(named: 'submittedBefore'),
      ),
    ).thenAnswer((_) async => {
          'totalRequests': 12,
          'dueSoonCount': 4,
          'dueSoonWindowDays': 5,
          'statusBreakdown': {'completed': 6, 'received': 6}
        });

    final controller = DataRequestsController(repository);

    await controller.load(status: 'received', regionCode: 'GB');
    final state = controller.state;

    expect(state.requests, hasLength(1));
    expect(state.metrics?['totalRequests'], 12);
    expect(state.metrics?['dueSoonCount'], 4);
    expect(state.metricsLoading, isFalse);
    expect(state.loading, isFalse);

    verify(
      () => repository.fetchRequests(
        status: 'received',
        requestType: any(named: 'requestType'),
        regionCode: 'GB',
        subjectEmail: any(named: 'subjectEmail'),
        submittedAfter: any(named: 'submittedAfter'),
        submittedBefore: any(named: 'submittedBefore'),
      ),
    ).called(1);
    verify(
      () => repository.fetchMetrics(
        status: 'received',
        requestType: any(named: 'requestType'),
        regionCode: 'GB',
        subjectEmail: any(named: 'subjectEmail'),
        submittedAfter: any(named: 'submittedAfter'),
        submittedBefore: any(named: 'submittedBefore'),
      ),
    ).called(1);
  });

  test('load surfaces metrics failure without discarding fetched requests', () async {
    final repository = _MockDataGovernanceRepository();
    when(
      () => repository.fetchRequests(
        status: any(named: 'status'),
        requestType: any(named: 'requestType'),
        regionCode: any(named: 'regionCode'),
        subjectEmail: any(named: 'subjectEmail'),
        submittedAfter: any(named: 'submittedAfter'),
        submittedBefore: any(named: 'submittedBefore'),
      ),
    ).thenAnswer((_) async => [request]);
    when(
      () => repository.fetchMetrics(
        status: any(named: 'status'),
        requestType: any(named: 'requestType'),
        regionCode: any(named: 'regionCode'),
        subjectEmail: any(named: 'subjectEmail'),
        submittedAfter: any(named: 'submittedAfter'),
        submittedBefore: any(named: 'submittedBefore'),
      ),
    ).thenThrow(Exception('metrics unavailable'));

    final controller = DataRequestsController(repository);
    await controller.load(status: 'in_progress');

    final state = controller.state;
    expect(state.requests, hasLength(1));
    expect(state.metrics, isNull);
    expect(state.metricsError, contains('metrics unavailable'));
    expect(state.metricsLoading, isFalse);
  });
}

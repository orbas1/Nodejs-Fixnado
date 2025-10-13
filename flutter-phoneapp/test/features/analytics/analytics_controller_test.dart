import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod/riverpod.dart';

import 'package:fixnado_mobile/app/bootstrap.dart';
import 'package:fixnado_mobile/features/analytics/data/analytics_repository.dart';
import 'package:fixnado_mobile/features/analytics/domain/analytics_models.dart';
import 'package:fixnado_mobile/features/analytics/presentation/analytics_controller.dart';
import 'package:fixnado_mobile/features/auth/domain/role_scope.dart';
import 'package:fixnado_mobile/features/auth/domain/user_role.dart';

class _MockAnalyticsRepository extends Mock implements AnalyticsRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(UserRole.provider);
  });

  AnalyticsDashboardSnapshot _snapshot() {
    final overviewSection = AnalyticsOverviewSection(
      id: 'overview',
      label: 'Overview',
      description: 'Bookings and revenue summary.',
      analytics: const AnalyticsOverview(
        metrics: [
          AnalyticsMetric(label: 'Assignments Received', value: '24', change: '+4', trend: 'up'),
          AnalyticsMetric(label: 'Acceptance Rate', value: '82%', change: '-3%', trend: 'down'),
        ],
        charts: [],
        upcoming: [],
        insights: ['High response time on scheduled jobs'],
      ),
    );
    final dashboard = AnalyticsDashboard(
      persona: 'provider',
      name: 'Provider Operations Studio',
      headline: 'Monitor revenue and crew utilisation.',
      window: const AnalyticsWindow(label: 'Last 28 days', timezone: 'Europe/London'),
      navigation: [overviewSection],
      metadata: const {},
      exports: const AnalyticsExports(
        csv: AnalyticsExportLink(href: '/api/analytics/dashboards/provider/export'),
      ),
    );
    return AnalyticsDashboardSnapshot(dashboard: dashboard, generatedAt: DateTime.parse('2025-01-01T12:00:00Z'));
  }

  ProviderContainer _containerWith(_MockAnalyticsRepository repository) {
    final container = ProviderContainer(
      overrides: [
        analyticsRepositoryProvider.overrideWithValue(repository),
        currentRoleProvider.overrideWith((ref) => StateController(UserRole.provider)),
        appConfigProvider.overrideWithValue(
          const AppConfig(
            apiBaseUrl: Uri.parse('http://localhost:3000/api'),
            requestTimeout: Duration(milliseconds: 5000),
            enableNetworkLogging: false,
            enableProviderLogging: false,
            defaultHeaders: {},
          ),
        ),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  test('refresh loads analytics dashboard snapshot', () async {
    final repository = _MockAnalyticsRepository();
    when(() => repository.fetchDashboard(any(), bypassCache: any(named: 'bypassCache')))
        .thenAnswer((_) async => AnalyticsDashboardFetchResult(snapshot: _snapshot(), offline: false));
    when(() => repository.latestExport(any())).thenReturn(null);

    final container = _containerWith(repository);
    final controller = container.read(analyticsControllerProvider.notifier);

    await controller.refresh();
    final state = container.read(analyticsControllerProvider);

    expect(state.snapshot, isNotNull);
    expect(state.offline, isFalse);
    verify(() => repository.fetchDashboard(UserRole.provider, bypassCache: false)).called(1);
  });

  test('refresh flags offline when repository returns cached snapshot', () async {
    final repository = _MockAnalyticsRepository();
    when(() => repository.fetchDashboard(any(), bypassCache: any(named: 'bypassCache')))
        .thenAnswer((_) async => AnalyticsDashboardFetchResult(snapshot: _snapshot(), offline: true));
    when(() => repository.latestExport(any())).thenReturn(null);

    final container = _containerWith(repository);
    final controller = container.read(analyticsControllerProvider.notifier);

    await controller.refresh();
    final state = container.read(analyticsControllerProvider);

    expect(state.offline, isTrue);
    expect(state.snapshot, isNotNull);
  });

  test('export delegates to repository and updates export record', () async {
    final repository = _MockAnalyticsRepository();
    final snapshot = _snapshot();
    when(() => repository.fetchDashboard(any(), bypassCache: any(named: 'bypassCache')))
        .thenAnswer((_) async => AnalyticsDashboardFetchResult(snapshot: snapshot, offline: false));
    when(() => repository.latestExport(any())).thenReturn(null);

    final exportRecord = AnalyticsExportRecord(
      persona: 'provider',
      generatedAt: DateTime.now(),
      preview: 'Persona,provider',
      byteLength: 2048,
    );

    when(() => repository.exportDashboard(any(), any())).thenAnswer((_) async => exportRecord);

    final container = _containerWith(repository);
    final controller = container.read(analyticsControllerProvider.notifier);

    await controller.refresh();
    final result = await controller.export();

    expect(result.byteLength, equals(2048));
    final state = container.read(analyticsControllerProvider);
    expect(state.exportRecord, isNotNull);
    verify(() => repository.exportDashboard(UserRole.provider, snapshot.dashboard)).called(1);
  });
}

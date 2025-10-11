import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod/riverpod.dart';

import 'package:fixnado_mobile/app/bootstrap.dart';
import 'package:fixnado_mobile/features/auth/domain/role_scope.dart';
import 'package:fixnado_mobile/features/auth/domain/user_role.dart';
import 'package:fixnado_mobile/features/explorer/data/explorer_repository.dart';
import 'package:fixnado_mobile/features/explorer/domain/models.dart';
import 'package:fixnado_mobile/features/explorer/presentation/explorer_controller.dart';

class _MockExplorerRepository extends Mock implements ExplorerRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(UserRole.customer);
    registerFallbackValue(ExplorerFilters());
  });

  ExplorerSnapshot _snapshot({bool offline = false}) => ExplorerSnapshot(
        services: [
          ExplorerService(
            id: 'svc-1',
            title: 'Pipe repair',
            description: 'Emergency leak handling',
            category: 'Plumbing',
            price: 120,
            currency: 'GBP',
            companyName: 'Fixnado Ltd',
            providerName: 'Alex Stone',
          )
        ],
        items: [
          ExplorerMarketplaceItem(
            id: 'itm-1',
            title: 'Industrial dehumidifier',
            description: 'High output',
            availability: 'rent',
            location: 'London',
            pricePerDay: 45,
            purchasePrice: 3200,
            status: 'approved',
            insuredOnly: true,
          )
        ],
        zones: [
          ZoneSummary(
            id: 'zone-1',
            name: 'East London',
            demandLevel: 'high',
            metadata: const {},
            centroid: const {},
            boundingBox: const {},
            analytics: ZoneAnalyticsSummary(
              zoneId: 'zone-1',
              capturedAt: DateTime.parse('2025-01-01T12:00:00Z'),
              bookingTotals: const {'awaiting_assignment': 2, 'completed': 5},
              slaBreaches: 1,
              averageAcceptanceMinutes: 14,
              metadata: const {},
            ),
          )
        ],
        filters: ExplorerFilters(),
        generatedAt: DateTime.now(),
        offline: offline,
      );

  test('refresh updates state with live snapshot', () async {
    final repository = _MockExplorerRepository();
    when(() => repository.loadExplorer(any(), any(), bypassCache: any(named: 'bypassCache'))).thenAnswer(
      (_) async => _snapshot(),
    );

    final container = ProviderContainer(overrides: [
      explorerRepositoryProvider.overrideWithValue(repository),
      currentRoleProvider.overrideWith((ref) => StateController(UserRole.customer)),
    ]);
    addTearDown(container.dispose);

    final controller = container.read(explorerControllerProvider.notifier);
    await controller.refresh();
    final state = container.read(explorerControllerProvider);

    expect(state.snapshot, isNotNull);
    expect(state.offline, isFalse);
    expect(state.services, hasLength(1));
    expect(state.marketplaceItems, hasLength(1));
  });

  test('refresh flags offline when repository falls back to cache', () async {
    final repository = _MockExplorerRepository();
    when(() => repository.loadExplorer(any(), any(), bypassCache: any(named: 'bypassCache'))).thenAnswer(
      (_) async => _snapshot(offline: true),
    );

    final container = ProviderContainer(overrides: [
      explorerRepositoryProvider.overrideWithValue(repository),
      currentRoleProvider.overrideWith((ref) => StateController(UserRole.customer)),
    ]);
    addTearDown(container.dispose);

    final controller = container.read(explorerControllerProvider.notifier);
    await controller.refresh();
    final state = container.read(explorerControllerProvider);

    expect(state.offline, isTrue);
  });
}

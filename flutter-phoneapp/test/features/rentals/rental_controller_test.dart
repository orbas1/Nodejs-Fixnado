import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod/riverpod.dart';

import 'package:fixnado_mobile/app/bootstrap.dart';
import 'package:fixnado_mobile/features/auth/domain/role_scope.dart';
import 'package:fixnado_mobile/features/auth/domain/user_role.dart';
import 'package:fixnado_mobile/features/rentals/data/rental_repository.dart';
import 'package:fixnado_mobile/features/rentals/domain/rental_models.dart';
import 'package:fixnado_mobile/features/rentals/presentation/rental_controller.dart';

class _MockRentalRepository extends Mock implements RentalRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(UserRole.customer);
  });

  RentalAgreementModel _rental({
    String id = 'rent-1',
    String status = 'requested',
    String renterId = 'renter-1',
    String companyId = 'company-1',
    DateTime? lastTransition,
  }) {
    final checkpointTime = DateTime.parse('2025-01-01T12:00:00Z');
    return RentalAgreementModel(
      id: id,
      rentalNumber: 'RENT-001',
      itemId: 'item-1',
      companyId: companyId,
      renterId: renterId,
      status: status,
      depositStatus: 'pending',
      quantity: 1,
      meta: const {},
      conditionOut: const {},
      conditionIn: const {},
      timeline: [
        RentalCheckpointModel(
          id: 'chk-$id',
          rentalAgreementId: id,
          type: status,
          description: 'Status updated to $status',
          recordedBy: renterId,
          recordedByRole: 'customer',
          occurredAt: checkpointTime,
          payload: const {},
        ),
      ],
      marketplaceItemId: null,
      bookingId: null,
      rentalStartAt: null,
      rentalEndAt: null,
      pickupAt: null,
      returnDueAt: null,
      returnedAt: null,
      depositAmount: 150,
      depositCurrency: 'GBP',
      dailyRate: 55,
      rateCurrency: 'GBP',
      cancellationReason: null,
      lastStatusTransitionAt: lastTransition ?? checkpointTime,
    );
  }

  RentalFetchResult _result({bool offline = false, List<RentalAgreementModel>? rentals}) {
    return RentalFetchResult(
      rentals: rentals ?? [_rental()],
      offline: offline,
    );
  }

  ProviderContainer _containerWith(_MockRentalRepository repository, {UserRole role = UserRole.customer}) {
    final container = ProviderContainer(
      overrides: [
        rentalRepositoryProvider.overrideWithValue(repository),
        currentRoleProvider.overrideWith((ref) => StateController(role)),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  test('refresh populates rentals and clears offline flag when live data is available', () async {
    final repository = _MockRentalRepository();
    when(
      () => repository.fetchRentals(
        any(),
        status: any(named: 'status'),
        companyId: any(named: 'companyId'),
        renterId: any(named: 'renterId'),
      ),
    ).thenAnswer((_) async => _result());

    final container = _containerWith(repository);
    final controller = container.read(rentalControllerProvider.notifier);

    await controller.refresh();
    final state = container.read(rentalControllerProvider);

    expect(state.rentals, hasLength(1));
    expect(state.offline, isFalse);
    expect(state.lastUpdated, isNotNull);
    verify(() => repository.fetchRentals(UserRole.customer, status: null, companyId: null, renterId: null)).called(1);
  });

  test('refresh sets offline flag when cache is returned', () async {
    final repository = _MockRentalRepository();
    when(
      () => repository.fetchRentals(
        any(),
        status: any(named: 'status'),
        companyId: any(named: 'companyId'),
        renterId: any(named: 'renterId'),
      ),
    ).thenAnswer((_) async => _result(offline: true));

    final container = _containerWith(repository, role: UserRole.provider);
    final controller = container.read(rentalControllerProvider.notifier);

    await controller.refresh();
    final state = container.read(rentalControllerProvider);

    expect(state.offline, isTrue);
    verify(() => repository.fetchRentals(UserRole.provider, status: null, companyId: null, renterId: null)).called(1);
  });

  test('requestRental inserts the new agreement at the top of the state list', () async {
    final repository = _MockRentalRepository();
    when(
      () => repository.fetchRentals(
        any(),
        status: any(named: 'status'),
        companyId: any(named: 'companyId'),
        renterId: any(named: 'renterId'),
      ),
    ).thenAnswer((_) async => _result(rentals: [_rental()]));

    final container = _containerWith(repository);
    final controller = container.read(rentalControllerProvider.notifier);
    await controller.refresh();

    final start = DateTime.parse('2025-01-10T09:00:00Z');
    final end = DateTime.parse('2025-01-15T17:00:00Z');
    final created = _rental(id: 'rent-2', status: 'approved');

    when(
      () => repository.requestRental(
        itemId: 'item-99',
        renterId: 'renter-2',
        bookingId: null,
        marketplaceItemId: null,
        quantity: 2,
        rentalStart: start,
        rentalEnd: end,
        notes: null,
        actorId: null,
        actorRole: 'customer',
      ),
    ).thenAnswer((_) async => created);

    final result = await controller.requestRental(
      itemId: 'item-99',
      renterId: 'renter-2',
      quantity: 2,
      rentalStart: start,
      rentalEnd: end,
    );

    final state = container.read(rentalControllerProvider);
    expect(result.id, equals('rent-2'));
    expect(state.rentals.first.id, equals('rent-2'));
    expect(state.rentals, hasLength(2));
    verify(
      () => repository.requestRental(
        itemId: 'item-99',
        renterId: 'renter-2',
        bookingId: null,
        marketplaceItemId: null,
        quantity: 2,
        rentalStart: start,
        rentalEnd: end,
        notes: null,
        actorId: null,
        actorRole: 'customer',
      ),
    ).called(1);
  });

  test('completeInspection updates the cached rental with the returned status', () async {
    final repository = _MockRentalRepository();
    final initial = _rental(status: 'inspection_pending');
    when(
      () => repository.fetchRentals(
        any(),
        status: any(named: 'status'),
        companyId: any(named: 'companyId'),
        renterId: any(named: 'renterId'),
      ),
    ).thenAnswer((_) async => _result(rentals: [initial]));

    final container = _containerWith(repository, role: UserRole.provider);
    final controller = container.read(rentalControllerProvider.notifier);
    await controller.refresh();

    final completed = _rental(id: initial.id, status: 'settled', companyId: 'company-1', renterId: 'renter-1');
    when(
      () => repository.completeInspection(
        initial.id,
        actorId: any(named: 'actorId'),
        outcome: any(named: 'outcome'),
        charges: any(named: 'charges'),
        notes: any(named: 'notes'),
      ),
    ).thenAnswer((_) async => completed);

    final result = await controller.completeInspection(initial.id, actorId: 'company-1', outcome: 'clear');
    final state = container.read(rentalControllerProvider);

    expect(result.status, equals('settled'));
    expect(state.rentals.single.status, equals('settled'));
    verify(
      () => repository.completeInspection(
        initial.id,
        actorId: 'company-1',
        outcome: 'clear',
        charges: const [],
        notes: null,
      ),
    ).called(1);
  });
}

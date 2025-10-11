import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod/riverpod.dart';

import 'package:fixnado_mobile/app/bootstrap.dart';
import 'package:fixnado_mobile/features/auth/domain/role_scope.dart';
import 'package:fixnado_mobile/features/auth/domain/user_role.dart';
import 'package:fixnado_mobile/features/bookings/data/booking_repository.dart';
import 'package:fixnado_mobile/features/bookings/domain/booking_models.dart';
import 'package:fixnado_mobile/features/bookings/presentation/booking_controller.dart';

class _MockBookingRepository extends Mock implements BookingRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(UserRole.customer);
    registerFallbackValue(
      CreateBookingRequest(
        customerId: 'cust',
        companyId: 'comp',
        zoneId: 'zone',
        type: 'emergency',
        currency: 'GBP',
        baseAmount: 120,
      ),
    );
  });

  BookingModel _booking({String id = 'book-1', String status = 'requested', double amount = 180}) {
    return BookingModel(
      id: id,
      customerId: 'customer-1',
      companyId: 'company-1',
      zoneId: 'zone-1',
      status: status,
      type: 'on_demand',
      createdAt: DateTime.parse('2025-01-01T12:00:00Z'),
      slaExpiresAt: DateTime.parse('2025-01-01T13:00:00Z'),
      totalAmount: amount,
      currency: 'GBP',
      meta: const {},
      scheduledStart: null,
      scheduledEnd: null,
      assignments: const [],
      bids: const [],
    );
  }

  BookingFetchResult _result({bool offline = false, List<BookingModel>? bookings}) {
    return BookingFetchResult(
      bookings: bookings ?? [_booking()],
      offline: offline,
    );
  }

  ProviderContainer _containerWith(_MockBookingRepository repository, {UserRole role = UserRole.customer}) {
    final container = ProviderContainer(
      overrides: [
        bookingRepositoryProvider.overrideWithValue(repository),
        currentRoleProvider.overrideWith((ref) => StateController(role)),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  test('refresh loads bookings and clears offline flag on success', () async {
    final repository = _MockBookingRepository();
    when(
      () => repository.fetchBookings(
        any(),
        status: any(named: 'status'),
        zoneId: any(named: 'zoneId'),
      ),
    ).thenAnswer((_) async => _result());

    final container = _containerWith(repository);
    final controller = container.read(bookingControllerProvider.notifier);

    await controller.refresh();
    final state = container.read(bookingControllerProvider);

    expect(state.bookings, hasLength(1));
    expect(state.offline, isFalse);
    expect(state.lastUpdated, isNotNull);
    verify(() => repository.fetchBookings(UserRole.customer, status: null, zoneId: null)).called(1);
  });

  test('refresh surfaces offline flag when repository returns cached payload', () async {
    final repository = _MockBookingRepository();
    when(
      () => repository.fetchBookings(
        any(),
        status: any(named: 'status'),
        zoneId: any(named: 'zoneId'),
      ),
    ).thenAnswer((_) async => _result(offline: true));

    final container = _containerWith(repository, role: UserRole.provider);
    final controller = container.read(bookingControllerProvider.notifier);

    await controller.refresh();
    final state = container.read(bookingControllerProvider);

    expect(state.offline, isTrue);
    verify(() => repository.fetchBookings(UserRole.provider, status: null, zoneId: null)).called(1);
  });

  test('createBooking prepends booking and returns persisted entity', () async {
    final repository = _MockBookingRepository();
    when(
      () => repository.fetchBookings(
        any(),
        status: any(named: 'status'),
        zoneId: any(named: 'zoneId'),
      ),
    ).thenAnswer((_) async => _result(bookings: [_booking()]));

    final container = _containerWith(repository);
    final controller = container.read(bookingControllerProvider.notifier);
    await controller.refresh();

    final request = CreateBookingRequest(
      customerId: 'customer-1',
      companyId: 'company-1',
      zoneId: 'zone-1',
      type: 'scheduled',
      currency: 'GBP',
      baseAmount: 220,
    );
    final created = _booking(id: 'book-2', status: 'awaiting_assignment');

    when(() => repository.createBooking(any())).thenAnswer((_) async => created);

    final result = await controller.createBooking(request);
    final state = container.read(bookingControllerProvider);

    expect(result.id, equals('book-2'));
    expect(state.bookings.first.id, equals('book-2'));
    expect(state.bookings, hasLength(2));
    verify(() => repository.createBooking(request)).called(1);
  });

  test('advanceStatus replaces booking within current state', () async {
    final repository = _MockBookingRepository();
    final initial = _booking();
    when(
      () => repository.fetchBookings(
        any(),
        status: any(named: 'status'),
        zoneId: any(named: 'zoneId'),
      ),
    ).thenAnswer((_) async => _result(bookings: [initial]));

    final container = _containerWith(repository);
    final controller = container.read(bookingControllerProvider.notifier);
    await controller.refresh();

    final progressed = _booking(id: initial.id, status: 'approved');
    when(
      () => repository.updateStatus(
        initial.id,
        'approved',
        actorId: any(named: 'actorId'),
        reason: any(named: 'reason'),
      ),
    ).thenAnswer((_) async => progressed);

    final updated = await controller.advanceStatus(initial.id, 'approved', actorId: 'ops-1');
    final state = container.read(bookingControllerProvider);

    expect(updated.status, equals('approved'));
    expect(state.bookings.single.status, equals('approved'));
    verify(
      () => repository.updateStatus(
        initial.id,
        'approved',
        actorId: 'ops-1',
        reason: null,
      ),
    ).called(1);
  });
}

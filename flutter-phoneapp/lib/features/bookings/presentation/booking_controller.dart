import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/booking_repository.dart';
import '../domain/booking_models.dart';

final bookingControllerProvider = StateNotifierProvider<BookingController, BookingViewState>((ref) {
  final repository = ref.watch(bookingRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return BookingController(ref, repository, role)..refresh();
});

class BookingController extends StateNotifier<BookingViewState> {
  BookingController(this._ref, this._repository, this._role)
      : super(BookingViewState.initial(_role)) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = BookingViewState.initial(next);
      refresh();
    });
  }

  final Ref _ref;
  final BookingRepository _repository;
  UserRole _role;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.fetchBookings(_role, status: state.statusFilterValue, zoneId: state.zoneId);
      state = state.copyWith(
        bookings: result.bookings,
        isLoading: false,
        offline: result.offline,
        lastUpdated: DateTime.now(),
        clearError: true,
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }

  void updateStatusFilter(String? status) {
    state = state.copyWith(statusFilter: status);
  }

  void updateZoneFilter(String? zoneId) {
    state = state.copyWith(zoneId: zoneId);
  }

  Future<BookingModel> createBooking(CreateBookingRequest request) async {
    final booking = await _repository.createBooking(request);
    state = state.copyWith(bookings: [booking, ...state.bookings], lastUpdated: DateTime.now());
    return booking;
  }

  Future<BookingModel> advanceStatus(String bookingId, String status, {String? actorId, String? reason}) async {
    final booking = await _repository.updateStatus(bookingId, status, actorId: actorId, reason: reason);
    final bookings = state.bookings.map((item) => item.id == bookingId ? booking : item).toList();
    state = state.copyWith(bookings: bookings);
    return booking;
  }

  @override
  void dispose() {
    _roleSubscription.close();
    super.dispose();
  }
}

class BookingViewState {
  BookingViewState({
    required this.role,
    required this.bookings,
    required this.statusFilter,
    required this.zoneId,
    required this.isLoading,
    required this.offline,
    required this.errorMessage,
    required this.lastUpdated,
  });

  factory BookingViewState.initial(UserRole role) => BookingViewState(
        role: role,
        bookings: const [],
        statusFilter: 'all',
        zoneId: null,
        isLoading: false,
        offline: false,
        errorMessage: null,
        lastUpdated: null,
      );

  final UserRole role;
  final List<BookingModel> bookings;
  final String? statusFilter;
  final String? zoneId;
  final bool isLoading;
  final bool offline;
  final String? errorMessage;
  final DateTime? lastUpdated;

  List<BookingModel> get filteredBookings {
    return bookings.where((booking) {
      final statusMatches = statusFilter == null || statusFilter == 'all' || booking.status == statusFilter;
      final zoneMatches = zoneId == null || booking.zoneId == zoneId;
      return statusMatches && zoneMatches;
    }).toList();
  }

  String? get statusFilterValue => statusFilter == null || statusFilter == 'all' ? null : statusFilter;

  BookingViewState copyWith({
    UserRole? role,
    List<BookingModel>? bookings,
    String? statusFilter,
    String? zoneId,
    bool? isLoading,
    bool? offline,
    String? errorMessage,
    DateTime? lastUpdated,
    bool clearError = false,
  }) {
    return BookingViewState(
      role: role ?? this.role,
      bookings: bookings ?? this.bookings,
      statusFilter: statusFilter ?? this.statusFilter,
      zoneId: zoneId ?? this.zoneId,
      isLoading: isLoading ?? this.isLoading,
      offline: offline ?? this.offline,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

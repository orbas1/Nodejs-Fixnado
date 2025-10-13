import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/rental_repository.dart';
import '../domain/rental_models.dart';

final rentalControllerProvider = StateNotifierProvider<RentalController, RentalViewState>((ref) {
  final repository = ref.watch(rentalRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return RentalController(ref, repository, role)..refresh();
});

class RentalController extends StateNotifier<RentalViewState> {
  RentalController(this._ref, this._repository, this._role)
      : super(RentalViewState.initial(_role)) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = RentalViewState.initial(next);
      refresh();
    });
  }

  final Ref _ref;
  final RentalRepository _repository;
  UserRole _role;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.fetchRentals(_role, status: state.statusFilterValue, companyId: state.companyId, renterId: state.renterId);
      state = state.copyWith(
        rentals: result.rentals,
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

  void updateCompany(String? companyId) {
    state = state.copyWith(companyId: companyId);
  }

  void updateRenter(String? renterId) {
    state = state.copyWith(renterId: renterId);
  }

  Future<RentalAgreementModel> requestRental({
    required String itemId,
    required String renterId,
    String? bookingId,
    String? marketplaceItemId,
    int quantity = 1,
    DateTime? rentalStart,
    DateTime? rentalEnd,
    String? notes,
    String? actorId,
  }) async {
    final rental = await _repository.requestRental(
      itemId: itemId,
      renterId: renterId,
      bookingId: bookingId,
      marketplaceItemId: marketplaceItemId,
      quantity: quantity,
      rentalStart: rentalStart,
      rentalEnd: rentalEnd,
      notes: notes,
      actorId: actorId,
      actorRole: state.role == UserRole.provider ? 'provider' : 'customer',
    );
    _upsertRental(rental);
    return rental;
  }

  Future<RentalAgreementModel> approve(String rentalId, {String? actorId, String? notes}) async {
    final rental = await _repository.approveRental(rentalId, actorId: actorId, notes: notes);
    _upsertRental(rental);
    return rental;
  }

  Future<RentalAgreementModel> schedulePickup(String rentalId, {required DateTime pickupAt, required DateTime returnDueAt, String? actorId, String? notes}) async {
    final rental = await _repository.schedulePickup(rentalId, pickupAt: pickupAt, returnDueAt: returnDueAt, actorId: actorId, notes: notes);
    _upsertRental(rental);
    return rental;
  }

  Future<RentalAgreementModel> checkout(String rentalId, {String? actorId, Map<String, dynamic>? conditionOut, DateTime? startAt, String? notes}) async {
    final rental = await _repository.recordCheckout(rentalId, actorId: actorId, conditionOut: conditionOut, rentalStartAt: startAt, notes: notes);
    _upsertRental(rental);
    return rental;
  }

  Future<RentalAgreementModel> markReturned(String rentalId, {String? actorId, Map<String, dynamic>? conditionIn, DateTime? returnedAt, String? notes}) async {
    final rental = await _repository.markReturned(rentalId, actorId: actorId, conditionIn: conditionIn, returnedAt: returnedAt, notes: notes);
    _upsertRental(rental);
    return rental;
  }

  Future<RentalAgreementModel> completeInspection(String rentalId, {String? actorId, String outcome = 'clear', List<Map<String, dynamic>> charges = const [], String? notes}) async {
    final rental = await _repository.completeInspection(rentalId, actorId: actorId, outcome: outcome, charges: charges, notes: notes);
    _upsertRental(rental);
    return rental;
  }

  Future<RentalAgreementModel> cancel(String rentalId, {String? actorId, String? reason}) async {
    final rental = await _repository.cancelRental(rentalId, actorId: actorId, reason: reason);
    _upsertRental(rental);
    return rental;
  }

  void _upsertRental(RentalAgreementModel rental) {
    final rentals = state.rentals;
    final index = rentals.indexWhere((item) => item.id == rental.id);
    final updated = [...rentals];
    if (index >= 0) {
      updated[index] = rental;
    } else {
      updated.insert(0, rental);
    }
    state = state.copyWith(rentals: updated, lastUpdated: DateTime.now());
  }

  @override
  void dispose() {
    _roleSubscription.close();
    super.dispose();
  }
}

class RentalViewState {
  RentalViewState({
    required this.role,
    required this.rentals,
    required this.statusFilter,
    required this.companyId,
    required this.renterId,
    required this.isLoading,
    required this.offline,
    required this.errorMessage,
    required this.lastUpdated,
  });

  factory RentalViewState.initial(UserRole role) => RentalViewState(
        role: role,
        rentals: const [],
        statusFilter: 'all',
        companyId: null,
        renterId: null,
        isLoading: false,
        offline: false,
        errorMessage: null,
        lastUpdated: null,
      );

  final UserRole role;
  final List<RentalAgreementModel> rentals;
  final String? statusFilter;
  final String? companyId;
  final String? renterId;
  final bool isLoading;
  final bool offline;
  final String? errorMessage;
  final DateTime? lastUpdated;

  List<RentalAgreementModel> get filteredRentals {
    return rentals.where((rental) {
      final statusMatches = statusFilter == null || statusFilter == 'all' || rental.status == statusFilter;
      final companyMatches = companyId == null || rental.companyId == companyId;
      final renterMatches = renterId == null || rental.renterId == renterId;
      return statusMatches && companyMatches && renterMatches;
    }).toList();
  }

  String? get statusFilterValue => statusFilter == null || statusFilter == 'all' ? null : statusFilter;

  RentalViewState copyWith({
    UserRole? role,
    List<RentalAgreementModel>? rentals,
    String? statusFilter,
    String? companyId,
    String? renterId,
    bool? isLoading,
    bool? offline,
    String? errorMessage,
    DateTime? lastUpdated,
    bool clearError = false,
  }) {
    return RentalViewState(
      role: role ?? this.role,
      rentals: rentals ?? this.rentals,
      statusFilter: statusFilter ?? this.statusFilter,
      companyId: companyId ?? this.companyId,
      renterId: renterId ?? this.renterId,
      isLoading: isLoading ?? this.isLoading,
      offline: offline ?? this.offline,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

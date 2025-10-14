import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../../../core/exceptions/api_exception.dart';
import '../data/storefront_repository.dart';
import '../domain/storefront_models.dart';

class StorefrontState {
  const StorefrontState({
    required this.role,
    required this.isLoading,
    required this.snapshot,
    required this.offline,
    required this.errorMessage,
    required this.accessGranted,
  });

  factory StorefrontState.initial(UserRole role) => StorefrontState(
        role: role,
        isLoading: true,
        snapshot: null,
        offline: false,
        errorMessage: null,
        accessGranted: role == UserRole.provider || role == UserRole.admin,
      );

  final UserRole role;
  final bool isLoading;
  final StorefrontSnapshot? snapshot;
  final bool offline;
  final String? errorMessage;
  final bool accessGranted;

  StorefrontState copyWith({
    UserRole? role,
    bool? isLoading,
    StorefrontSnapshot? snapshot,
    bool? offline,
    String? errorMessage,
    bool? accessGranted,
    bool clearError = false,
  }) {
    return StorefrontState(
      role: role ?? this.role,
      isLoading: isLoading ?? this.isLoading,
      snapshot: snapshot ?? this.snapshot,
      offline: offline ?? this.offline,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      accessGranted: accessGranted ?? this.accessGranted,
    );
  }
}

class StorefrontController extends StateNotifier<StorefrontState> {
  StorefrontController(this._ref, this._repository, this._role)
      : super(StorefrontState.initial(_role)) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = StorefrontState.initial(next);
      _load();
    });
    _load();
  }

  final Ref _ref;
  final StorefrontRepository _repository;
  UserRole _role;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> _load({bool force = false}) async {
    if (!state.accessGranted) {
      state = state.copyWith(isLoading: false, clearError: true);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.fetchStorefront(_role, bypassCache: force);
      state = state.copyWith(
        isLoading: false,
        snapshot: result.snapshot,
        offline: result.offline,
        clearError: true,
      );
    } on StorefrontAccessDenied catch (error) {
      state = state.copyWith(
        isLoading: false,
        accessGranted: false,
        errorMessage: error.message,
      );
    } on ApiException catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.message);
    } on TimeoutException catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }

  Future<void> refresh() async {
    await _load(force: true);
  }

  @override
  void dispose() {
    _roleSubscription.close();
    super.dispose();
  }
}

final storefrontControllerProvider = StateNotifierProvider<StorefrontController, StorefrontState>((ref) {
  final repository = ref.watch(storefrontRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return StorefrontController(ref, repository, role);
});

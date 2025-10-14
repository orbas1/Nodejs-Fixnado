import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/exceptions/api_exception.dart';
import '../data/enterprise_dashboard_repository.dart';
import '../domain/enterprise_dashboard_models.dart';

class EnterpriseDashboardState {
  const EnterpriseDashboardState({
    required this.snapshot,
    required this.isLoading,
    required this.errorMessage,
  });

  factory EnterpriseDashboardState.initial() =>
      const EnterpriseDashboardState(snapshot: null, isLoading: false, errorMessage: null);

  final EnterpriseDashboardSnapshot? snapshot;
  final bool isLoading;
  final String? errorMessage;

  bool get offline => snapshot?.offline ?? false;
  bool get fallback => snapshot?.fallback ?? false;

  EnterpriseDashboardState copyWith({
    EnterpriseDashboardSnapshot? snapshot,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return EnterpriseDashboardState(
      snapshot: snapshot ?? this.snapshot,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class EnterpriseDashboardController extends StateNotifier<EnterpriseDashboardState> {
  EnterpriseDashboardController(this._repository)
      : super(EnterpriseDashboardState.initial());

  final EnterpriseDashboardRepository _repository;

  Future<void> refresh({bool bypassCache = false, String? timezone}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final snapshot = await _repository.load(bypassCache: bypassCache, timezone: timezone);
      state = state.copyWith(snapshot: snapshot, isLoading: false, clearError: true);
    } on ApiException catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.message);
    } on TimeoutException {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'The enterprise dashboard took too long to respond. Please retry shortly.',
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }
}

final enterpriseDashboardControllerProvider =
    StateNotifierProvider<EnterpriseDashboardController, EnterpriseDashboardState>((ref) {
  final repository = ref.watch(enterpriseDashboardRepositoryProvider);
  final controller = EnterpriseDashboardController(repository);
  unawaited(controller.refresh());
  return controller;
});

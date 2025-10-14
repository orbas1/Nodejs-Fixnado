import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/storefront_repository.dart';
import '../domain/storefront_models.dart';

class StorefrontState {
  const StorefrontState({
    required this.isLoading,
    required this.snapshot,
    required this.offline,
    required this.errorMessage,
  });

  factory StorefrontState.initial() => const StorefrontState(
        isLoading: true,
        snapshot: null,
        offline: false,
        errorMessage: null,
      );

  final bool isLoading;
  final StorefrontSnapshot? snapshot;
  final bool offline;
  final String? errorMessage;

  StorefrontState copyWith({
    bool? isLoading,
    StorefrontSnapshot? snapshot,
    bool? offline,
    String? errorMessage,
  }) {
    return StorefrontState(
      isLoading: isLoading ?? this.isLoading,
      snapshot: snapshot ?? this.snapshot,
      offline: offline ?? this.offline,
      errorMessage: errorMessage,
    );
  }
}

class StorefrontController extends StateNotifier<StorefrontState> {
  StorefrontController(this._repository) : super(StorefrontState.initial()) {
    _load();
  }

  final StorefrontRepository _repository;

  Future<void> _load({bool force = false}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final result = await _repository.fetchStorefront(bypassCache: force);
      state = StorefrontState(
        isLoading: false,
        snapshot: result.snapshot,
        offline: result.offline,
        errorMessage: null,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.toString(),
      );
    }
  }

  Future<void> refresh() async {
    await _load(force: true);
  }
}

final storefrontControllerProvider = StateNotifierProvider<StorefrontController, StorefrontState>((ref) {
  final repository = ref.watch(storefrontRepositoryProvider);
  return StorefrontController(repository);
});

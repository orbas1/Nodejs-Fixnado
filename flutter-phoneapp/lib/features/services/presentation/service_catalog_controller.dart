import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/service_catalog_repository.dart';
import '../domain/service_catalog_models.dart';

final serviceCatalogControllerProvider =
    StateNotifierProvider<ServiceCatalogController, ServiceCatalogState>((ref) {
  final repository = ref.watch(serviceCatalogRepositoryProvider);
  return ServiceCatalogController(repository)..refresh();
});

class ServiceCatalogController extends StateNotifier<ServiceCatalogState> {
  ServiceCatalogController(this._repository) : super(ServiceCatalogState.initial());

  final ServiceCatalogRepository _repository;

  Future<void> refresh({bool bypassCache = false}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final snapshot = await _repository.loadBusinessFront(bypassCache: bypassCache);
      state = state.copyWith(
        snapshot: snapshot,
        isLoading: false,
        clearError: true,
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }
}

class ServiceCatalogState {
  ServiceCatalogState({
    required this.snapshot,
    required this.isLoading,
    required this.errorMessage,
  });

  factory ServiceCatalogState.initial() =>
      ServiceCatalogState(snapshot: null, isLoading: false, errorMessage: null);

  final ServiceCatalogSnapshot? snapshot;
  final bool isLoading;
  final String? errorMessage;

  bool get offline => snapshot?.offline ?? false;

  ServiceCatalogState copyWith({
    ServiceCatalogSnapshot? snapshot,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return ServiceCatalogState(
      snapshot: snapshot ?? this.snapshot,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

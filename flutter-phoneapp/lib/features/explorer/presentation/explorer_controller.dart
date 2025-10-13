import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/exceptions/api_exception.dart';
import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/explorer_repository.dart';
import '../domain/models.dart';

final explorerControllerProvider = StateNotifierProvider<ExplorerController, ExplorerViewState>((ref) {
  final repository = ref.watch(explorerRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return ExplorerController(ref, repository, role)..refresh();
});

class ExplorerController extends StateNotifier<ExplorerViewState> {
  ExplorerController(this._ref, this._repository, this._role)
      : super(ExplorerViewState.initial(_role)) {
    _listener = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = ExplorerViewState.initial(next);
      refresh();
    });
  }

  final Ref _ref;
  final ExplorerRepository _repository;
  UserRole _role;
  late final ProviderSubscription<UserRole> _listener;

  Future<void> refresh({bool bypassCache = false}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final filters = state.filters;
    try {
      final snapshot = await _repository.loadExplorer(_role, filters, bypassCache: bypassCache);
      state = state.copyWith(
        snapshot: snapshot,
        isLoading: false,
        offline: snapshot.offline,
        clearError: true,
      );
    } on ApiException catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(isLoading: false, errorMessage: 'Unable to load explorer data');
    }
  }

  void updateTerm(String value) {
    state = state.copyWith(filters: state.filters.copyWith(term: value));
  }

  Future<void> submitSearch(String? term) async {
    state = state.copyWith(filters: state.filters.copyWith(term: term));
    await refresh(bypassCache: true);
  }

  void updateResultType(ExplorerResultType type) {
    state = state.copyWith(filters: state.filters.copyWith(type: type));
  }

  void selectZone(String? zoneId) {
    state = state.copyWith(filters: state.filters.copyWith(zoneId: zoneId));
  }

  @override
  void dispose() {
    _listener.close();
    super.dispose();
  }
}

class ExplorerViewState {
  ExplorerViewState({
    required this.role,
    required this.filters,
    required this.snapshot,
    required this.isLoading,
    required this.offline,
    required this.errorMessage,
  });

  factory ExplorerViewState.initial(UserRole role) => ExplorerViewState(
        role: role,
        filters: ExplorerFilters(),
        snapshot: null,
        isLoading: false,
        offline: false,
        errorMessage: null,
      );

  final UserRole role;
  final ExplorerFilters filters;
  final ExplorerSnapshot? snapshot;
  final bool isLoading;
  final bool offline;
  final String? errorMessage;

  List<ExplorerService> get services {
    if (snapshot == null) return const [];
    final data = snapshot!.services;
    switch (filters.type) {
      case ExplorerResultType.services:
      case ExplorerResultType.all:
        return data;
      case ExplorerResultType.marketplace:
      case ExplorerResultType.storefronts:
      case ExplorerResultType.businessFronts:
        return const [];
    }
  }

  List<ExplorerMarketplaceItem> get marketplaceItems {
    if (snapshot == null) return const [];
    final data = snapshot!.items;
    switch (filters.type) {
      case ExplorerResultType.marketplace:
      case ExplorerResultType.all:
        return data;
      case ExplorerResultType.services:
      case ExplorerResultType.storefronts:
      case ExplorerResultType.businessFronts:
        return const [];
    }
  }

  List<ExplorerStorefront> get storefronts {
    if (snapshot == null) return const [];
    final data = snapshot!.storefronts;
    switch (filters.type) {
      case ExplorerResultType.storefronts:
      case ExplorerResultType.all:
        return data;
      case ExplorerResultType.services:
      case ExplorerResultType.marketplace:
      case ExplorerResultType.businessFronts:
        return const [];
    }
  }

  List<ExplorerBusinessFront> get businessFronts {
    if (snapshot == null) return const [];
    final data = snapshot!.businessFronts;
    switch (filters.type) {
      case ExplorerResultType.businessFronts:
      case ExplorerResultType.all:
        return data;
      case ExplorerResultType.services:
      case ExplorerResultType.marketplace:
      case ExplorerResultType.storefronts:
        return const [];
    }
  }

  List<ZoneSummary> get zones {
    if (snapshot == null) return const [];
    if (filters.zoneId == null) {
      return snapshot!.zones;
    }
    return snapshot!.zones.where((zone) => zone.id == filters.zoneId).toList();
  }

  DateTime? get lastUpdated => snapshot?.generatedAt;

  ExplorerViewState copyWith({
    UserRole? role,
    ExplorerFilters? filters,
    ExplorerSnapshot? snapshot,
    bool? isLoading,
    bool? offline,
    String? errorMessage,
    bool clearError = false,
  }) {
    return ExplorerViewState(
      role: role ?? this.role,
      filters: filters ?? this.filters,
      snapshot: snapshot ?? this.snapshot,
      isLoading: isLoading ?? this.isLoading,
      offline: offline ?? this.offline,
      errorMessage: clearError
          ? null
          : (errorMessage ?? this.errorMessage),
    );
  }
}

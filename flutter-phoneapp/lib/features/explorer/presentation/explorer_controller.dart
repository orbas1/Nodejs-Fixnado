import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/exceptions/api_exception.dart';
import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/explorer_repository.dart';
import '../domain/explorer_ranking.dart';
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

  void selectServiceType(String? serviceType) {
    state = state.copyWith(
      filters: state.filters.copyWith(
        serviceType: serviceType,
        category: serviceType == null ? state.filters.category : null,
      ),
    );
  }

  void selectCategory(String? category) {
    state = state.copyWith(filters: state.filters.copyWith(category: category));
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
    if (_excludesServices(filters.type)) {
      return const [];
    }

    Iterable<ExplorerService> data = snapshot!.services;

    final zoneCompanyId = _selectedZoneCompanyId;
    if (zoneCompanyId != null) {
      data = data.where((service) => service.companyId == zoneCompanyId);
    }

    if (filters.serviceType != null && filters.serviceType!.isNotEmpty) {
      data = data.where((service) => service.type == filters.serviceType);
    }

    if (filters.category != null && filters.category!.isNotEmpty) {
      data = data.where((service) {
        return service.categorySlug == filters.category || service.category == filters.category;
      });
    }

    return rankExplorerServices(
      data,
      selectedZone: _selectedZone,
      filters: filters,
    );
  }

  List<ExplorerMarketplaceItem> get marketplaceItems {
    if (snapshot == null) return const [];
    if (_excludesMarketplace(filters.type)) {
      return const [];
    }

    Iterable<ExplorerMarketplaceItem> data = snapshot!.items;

    final zoneCompanyId = _selectedZoneCompanyId;
    if (zoneCompanyId != null) {
      data = data.where((item) => item.companyId == zoneCompanyId);
    }

    final availability = filters.availability;
    if (availability != null && availability.isNotEmpty && availability != 'any') {
      final match = availability.toLowerCase();
      data = data.where((item) {
        final label = item.availability.toLowerCase();
        return label.contains(match) || (match == 'rent' && item.supportsRental);
      });
    }

    if (filters.type == ExplorerResultType.tools) {
      data = data.where((item) => item.supportsRental);
    }

    return rankExplorerMarketplaceItems(
      data,
      selectedZone: _selectedZone,
      filters: filters,
    );
  }

  List<ExplorerStorefront> get storefronts {
    if (snapshot == null) return const [];
    if (filters.type == ExplorerResultType.storefronts || filters.type == ExplorerResultType.all) {
      return snapshot!.storefronts;
    }
    return const [];
  }

  List<ExplorerBusinessFront> get businessFronts {
    if (snapshot == null || !role.canAccessBusinessFronts) {
      return const [];
    }

    if (filters.type == ExplorerResultType.businessFronts || filters.type == ExplorerResultType.all) {
      return snapshot!.businessFronts;
    }

    return const [];
  }

  List<ZoneSummary> get zones {
    if (snapshot == null) return const [];
    if (filters.zoneId == null || filters.zoneId!.isEmpty) {
      return snapshot!.zones;
    }
    return snapshot!.zones.where((zone) => zone.id == filters.zoneId).toList();
  }

  DateTime? get lastUpdated => snapshot?.generatedAt;

  bool get canAccessBusinessFronts => role.canAccessBusinessFronts;

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

  ZoneSummary? get _selectedZone {
    if (snapshot == null) {
      return null;
    }
    if (filters.zoneId == null || filters.zoneId!.isEmpty) {
      return null;
    }
    for (final zone in snapshot!.zones) {
      if (zone.id == filters.zoneId) {
        return zone;
      }
    }
    return null;
  }

  String? get _selectedZoneCompanyId => _selectedZone?.companyId;

  bool _excludesServices(ExplorerResultType type) {
    switch (type) {
      case ExplorerResultType.services:
      case ExplorerResultType.all:
        return false;
      case ExplorerResultType.marketplace:
      case ExplorerResultType.tools:
      case ExplorerResultType.storefronts:
      case ExplorerResultType.businessFronts:
        return true;
    }
  }

  bool _excludesMarketplace(ExplorerResultType type) {
    switch (type) {
      case ExplorerResultType.marketplace:
      case ExplorerResultType.tools:
      case ExplorerResultType.all:
        return false;
      case ExplorerResultType.services:
      case ExplorerResultType.storefronts:
      case ExplorerResultType.businessFronts:
        return true;
    }
  }
}

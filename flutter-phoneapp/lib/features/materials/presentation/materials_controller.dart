import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../../../core/exceptions/api_exception.dart';
import '../data/materials_repository.dart';
import '../domain/materials_models.dart';

final materialsControllerProvider = StateNotifierProvider<MaterialsController, MaterialsViewState>((ref) {
  final repository = ref.watch(materialsRepositoryProvider);
  return MaterialsController(ref, repository);
});

class MaterialsViewState {
  const MaterialsViewState({
    required this.isLoading,
    required this.offline,
    required this.errorMessage,
    required this.snapshot,
    required this.role,
    required this.searchTerm,
    required this.selectedCategory,
    required this.selectedSupplier,
    required this.alertsOnly,
    required this.allowed,
  });

  factory MaterialsViewState.initial([UserRole role = UserRole.customer]) => MaterialsViewState(
        isLoading: true,
        offline: false,
        errorMessage: null,
        snapshot: null,
        role: role,
        searchTerm: '',
        selectedCategory: 'all',
        selectedSupplier: 'all',
        alertsOnly: false,
        allowed: _isRoleAllowed(role),
      );

  final bool isLoading;
  final bool offline;
  final String? errorMessage;
  final MaterialsShowcaseSnapshot? snapshot;
  final UserRole role;
  final String searchTerm;
  final String selectedCategory;
  final String selectedSupplier;
  final bool alertsOnly;
  final bool allowed;

  MaterialsViewState copyWith({
    bool? isLoading,
    bool? offline,
    String? errorMessage,
    MaterialsShowcaseSnapshot? snapshot,
    UserRole? role,
    String? searchTerm,
    String? selectedCategory,
    String? selectedSupplier,
    bool? alertsOnly,
    bool? allowed,
  }) {
    return MaterialsViewState(
      isLoading: isLoading ?? this.isLoading,
      offline: offline ?? this.offline,
      errorMessage: errorMessage,
      snapshot: snapshot ?? this.snapshot,
      role: role ?? this.role,
      searchTerm: searchTerm ?? this.searchTerm,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedSupplier: selectedSupplier ?? this.selectedSupplier,
      alertsOnly: alertsOnly ?? this.alertsOnly,
      allowed: allowed ?? this.allowed,
    );
  }

  List<MaterialInventoryItem> filteredInventory() {
    final source = snapshot?.inventory ?? const [];
    return source.where((item) {
      final matchesSearch = searchTerm.isEmpty
          ? true
          : item.name.toLowerCase().contains(searchTerm.toLowerCase()) ||
              (item.sku ?? '').toLowerCase().contains(searchTerm.toLowerCase());
      final matchesCategory = selectedCategory == 'all'
          ? true
          : item.category.toLowerCase() == selectedCategory.toLowerCase();
      final matchesSupplier = selectedSupplier == 'all'
          ? true
          : (item.supplier ?? '').toLowerCase() == selectedSupplier.toLowerCase();
      final matchesAlerts = !alertsOnly || item.alerts.isNotEmpty;
      return matchesSearch && matchesCategory && matchesSupplier && matchesAlerts;
    }).toList();
  }

  List<MaterialCategoryShare> get categories => snapshot?.categories ?? const [];
  List<MaterialSupplier> get suppliers => snapshot?.suppliers ?? const [];
  List<MaterialCollection> get collections => snapshot?.collections ?? const [];
  List<MaterialLogisticsStep> get logistics => snapshot?.logistics ?? const [];
  MaterialInsights? get insights => snapshot?.insights;
  MaterialStats? get stats => snapshot?.stats;
  MaterialHeroModel? get hero => snapshot?.hero;

  static bool _isRoleAllowed(UserRole role) {
    return role == UserRole.provider || role == UserRole.serviceman;
  }
}

class MaterialsController extends StateNotifier<MaterialsViewState> {
  MaterialsController(this._ref, this._repository)
      : super(MaterialsViewState.initial(_ref.read(currentRoleProvider))) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      _handleRoleChange(next);
    });
    _handleRoleChange(_ref.read(currentRoleProvider));
  }

  final Ref _ref;
  final MaterialsRepository _repository;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> refresh() => _load(forceRefresh: true);

  Future<void> _load({bool forceRefresh = false}) async {
    if (!state.allowed) {
      state = state.copyWith(isLoading: false, errorMessage: null);
      return;
    }

    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final snapshot = await _repository.fetchShowcase(bypassCache: forceRefresh);
      state = state.copyWith(
        isLoading: false,
        offline: snapshot.offline,
        snapshot: snapshot,
        errorMessage: null,
      );
    } on ApiException catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.message);
    } on TimeoutException catch (_) {
      state = state.copyWith(isLoading: false, errorMessage: 'Connection timeout. Pull to retry.');
    }
  }

  void updateSearch(String term) {
    state = state.copyWith(searchTerm: term);
  }

  void updateCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void updateSupplier(String supplier) {
    state = state.copyWith(selectedSupplier: supplier);
  }

  void toggleAlertsOnly() {
    state = state.copyWith(alertsOnly: !state.alertsOnly);
  }

  void _handleRoleChange(UserRole role) {
    final allowed = MaterialsViewState._isRoleAllowed(role);
    state = state.copyWith(role: role, allowed: allowed);
    if (!allowed) {
      state = state.copyWith(isLoading: false, errorMessage: null);
      return;
    }
    _load().ignore();
  }

  @override
  void dispose() {
    _roleSubscription.close();
    super.dispose();
  }
}

extension on Future<void> {
  void ignore() {
    // ignore: discarded_futures
    catchError((_) {});
  }
}

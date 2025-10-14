import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/tool_repository.dart';
import '../domain/tool_models.dart';

final toolsControllerProvider = StateNotifierProvider<ToolsController, ToolsViewState>((ref) {
  final repository = ref.watch(toolRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return ToolsController(ref, repository, role)..refresh();
});

class ToolsController extends StateNotifier<ToolsViewState> {
  ToolsController(this._ref, this._repository, this._role)
      : super(ToolsViewState.initial(_role)) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = ToolsViewState.initial(next);
      refresh();
    });
  }

  final Ref _ref;
  final ToolRepository _repository;
  UserRole _role;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> refresh({bool force = false}) async {
    if (!state.accessGranted) {
      state = state.copyWith(isLoading: false);
      return;
    }
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final snapshot = await _repository.fetchInventory(_role, forceRefresh: force);
      state = state.copyWith(
        items: snapshot.items,
        generatedAt: snapshot.generatedAt,
        isLoading: false,
        offline: snapshot.offline,
        uptime: snapshot.uptime,
        readyCount: snapshot.readyCount,
        totalCount: snapshot.totalCount,
        clearError: true,
      );
    } on ToolAccessDenied catch (error) {
      state = state.copyWith(
        isLoading: false,
        accessGranted: false,
        errorMessage: error.message,
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }

  void setCategory(String? category) {
    state = state.copyWith(activeCategory: category);
  }

  void toggleCategory(String? category) {
    if (state.activeCategory == category) {
      setCategory(null);
    } else {
      setCategory(category);
    }
  }

  @override
  void dispose() {
    _roleSubscription.close();
    super.dispose();
  }
}

class ToolsViewState {
  ToolsViewState({
    required this.role,
    required this.items,
    required this.generatedAt,
    required this.isLoading,
    required this.offline,
    required this.errorMessage,
    required this.activeCategory,
    required this.uptime,
    required this.readyCount,
    required this.totalCount,
    required this.accessGranted,
  });

  factory ToolsViewState.initial(UserRole role) {
    final accessGranted = role == UserRole.provider || role == UserRole.serviceman;
    return ToolsViewState(
      role: role,
      items: const [],
      generatedAt: null,
      isLoading: false,
      offline: false,
      errorMessage: null,
      activeCategory: null,
      uptime: 0,
      readyCount: 0,
      totalCount: 0,
      accessGranted: accessGranted,
    );
  }

  final UserRole role;
  final List<ToolInventoryItem> items;
  final DateTime? generatedAt;
  final bool isLoading;
  final bool offline;
  final String? errorMessage;
  final String? activeCategory;
  final double uptime;
  final int readyCount;
  final int totalCount;
  final bool accessGranted;

  List<ToolInventoryItem> get filteredItems {
    if (activeCategory == null || activeCategory!.isEmpty) {
      return items;
    }
    return items.where((item) => item.category == activeCategory).toList();
  }

  double get utilisationAverage {
    if (items.isEmpty) return 0;
    final total = items.fold<double>(0, (value, item) => value + item.utilisation);
    return total / items.length;
  }

  ToolsViewState copyWith({
    UserRole? role,
    List<ToolInventoryItem>? items,
    DateTime? generatedAt,
    bool? isLoading,
    bool? offline,
    String? errorMessage,
    String? activeCategory,
    double? uptime,
    int? readyCount,
    int? totalCount,
    bool? accessGranted,
    bool clearError = false,
  }) {
    return ToolsViewState(
      role: role ?? this.role,
      items: items ?? this.items,
      generatedAt: generatedAt ?? this.generatedAt,
      isLoading: isLoading ?? this.isLoading,
      offline: offline ?? this.offline,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      activeCategory: activeCategory ?? this.activeCategory,
      uptime: uptime ?? this.uptime,
      readyCount: readyCount ?? this.readyCount,
      totalCount: totalCount ?? this.totalCount,
      accessGranted: accessGranted ?? this.accessGranted,
    );
  }
}

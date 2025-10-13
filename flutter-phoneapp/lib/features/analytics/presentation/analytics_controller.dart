import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/analytics_repository.dart';
import '../domain/analytics_models.dart';

final analyticsControllerProvider = StateNotifierProvider<AnalyticsController, AnalyticsViewState>((ref) {
  final repository = ref.watch(analyticsRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return AnalyticsController(ref, repository, role)..refresh();
});

class AnalyticsController extends StateNotifier<AnalyticsViewState> {
  AnalyticsController(this._ref, this._repository, this._role)
      : super(AnalyticsViewState.initial(_role)) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = AnalyticsViewState.initial(next);
      refresh();
    });
  }

  final Ref _ref;
  final AnalyticsRepository _repository;
  UserRole _role;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> refresh({bool bypassCache = false}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.fetchDashboard(_role, bypassCache: bypassCache);
      final latestExport = _repository.latestExport(_role);
      state = state.copyWith(
        isLoading: false,
        offline: result.offline,
        snapshot: result.snapshot,
        lastUpdated: DateTime.now(),
        exportRecord: latestExport,
        clearError: true,
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }

  Future<AnalyticsExportRecord> export() async {
    final snapshot = state.snapshot;
    if (snapshot == null) {
      throw StateError('Dashboard not loaded');
    }
    final record = await _repository.exportDashboard(_role, snapshot.dashboard);
    state = state.copyWith(exportRecord: record);
    return record;
  }

  @override
  void dispose() {
    _roleSubscription.close();
    super.dispose();
  }
}

class AnalyticsViewState {
  AnalyticsViewState({
    required this.role,
    required this.snapshot,
    required this.isLoading,
    required this.offline,
    required this.errorMessage,
    required this.lastUpdated,
    required this.exportRecord,
  });

  factory AnalyticsViewState.initial(UserRole role) => AnalyticsViewState(
        role: role,
        snapshot: null,
        isLoading: false,
        offline: false,
        errorMessage: null,
        lastUpdated: null,
        exportRecord: null,
      );

  final UserRole role;
  final AnalyticsDashboardSnapshot? snapshot;
  final bool isLoading;
  final bool offline;
  final String? errorMessage;
  final DateTime? lastUpdated;
  final AnalyticsExportRecord? exportRecord;

  AnalyticsDashboard? get dashboard => snapshot?.dashboard;

  AnalyticsViewState copyWith({
    UserRole? role,
    AnalyticsDashboardSnapshot? snapshot,
    bool? isLoading,
    bool? offline,
    String? errorMessage,
    DateTime? lastUpdated,
    AnalyticsExportRecord? exportRecord,
    bool clearError = false,
  }) {
    return AnalyticsViewState(
      role: role ?? this.role,
      snapshot: snapshot ?? this.snapshot,
      isLoading: isLoading ?? this.isLoading,
      offline: offline ?? this.offline,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastUpdated: lastUpdated ?? this.lastUpdated,
      exportRecord: exportRecord ?? this.exportRecord,
    );
  }
}

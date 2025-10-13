import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/live_feed_repository.dart';
import '../domain/live_feed_models.dart';

final liveFeedControllerProvider =
    StateNotifierProvider<LiveFeedController, LiveFeedViewState>((ref) {
  final repository = ref.watch(liveFeedRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return LiveFeedController(ref, repository, role)..refresh();
});

class LiveFeedController extends StateNotifier<LiveFeedViewState> {
  LiveFeedController(this._ref, this._repository, this._role)
      : super(LiveFeedViewState.initial(_role)) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = LiveFeedViewState.initial(next);
      refresh();
    });
  }

  final Ref _ref;
  final LiveFeedRepository _repository;
  UserRole _role;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.fetchLiveFeed(
        zoneId: state.zoneId,
        includeOutOfZone: state.includeOutOfZone,
        outOfZoneOnly: state.outOfZoneOnly,
      );
      state = state.copyWith(
        posts: result.posts,
        isLoading: false,
        offline: result.offline,
        lastUpdated: DateTime.now(),
        clearError: true,
      );
    } on Exception catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error is StateError ? error.message : 'Unable to load live feed',
      );
    }
  }

  void selectZone(String? zoneId) {
    state = state.copyWith(zoneId: zoneId);
    refresh();
  }

  void toggleIncludeOutOfZone(bool value) {
    final outOfZoneOnly = value ? state.outOfZoneOnly : false;
    state = state.copyWith(includeOutOfZone: value, outOfZoneOnly: outOfZoneOnly);
    refresh();
  }

  void toggleOutOfZoneOnly(bool value) {
    state = state.copyWith(
      outOfZoneOnly: value,
      includeOutOfZone: value ? true : state.includeOutOfZone,
    );
    refresh();
  }

  @override
  void dispose() {
    _roleSubscription.close();
    super.dispose();
  }
}

class LiveFeedViewState {
  LiveFeedViewState({
    required this.role,
    required this.posts,
    required this.zoneId,
    required this.includeOutOfZone,
    required this.outOfZoneOnly,
    required this.isLoading,
    required this.offline,
    required this.errorMessage,
    required this.lastUpdated,
  });

  factory LiveFeedViewState.initial(UserRole role) => LiveFeedViewState(
        role: role,
        posts: const [],
        zoneId: null,
        includeOutOfZone: false,
        outOfZoneOnly: false,
        isLoading: false,
        offline: false,
        errorMessage: null,
        lastUpdated: null,
      );

  final UserRole role;
  final List<LiveFeedPost> posts;
  final String? zoneId;
  final bool includeOutOfZone;
  final bool outOfZoneOnly;
  final bool isLoading;
  final bool offline;
  final String? errorMessage;
  final DateTime? lastUpdated;

  LiveFeedViewState copyWith({
    UserRole? role,
    List<LiveFeedPost>? posts,
    String? zoneId,
    bool? includeOutOfZone,
    bool? outOfZoneOnly,
    bool? isLoading,
    bool? offline,
    String? errorMessage,
    DateTime? lastUpdated,
    bool clearError = false,
  }) {
    return LiveFeedViewState(
      role: role ?? this.role,
      posts: posts ?? this.posts,
      zoneId: zoneId ?? this.zoneId,
      includeOutOfZone: includeOutOfZone ?? this.includeOutOfZone,
      outOfZoneOnly: outOfZoneOnly ?? this.outOfZoneOnly,
      isLoading: isLoading ?? this.isLoading,
      offline: offline ?? this.offline,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

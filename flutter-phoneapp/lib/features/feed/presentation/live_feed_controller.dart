import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/live_feed_repository.dart';
import '../domain/live_feed_models.dart';
import '../../../core/exceptions/api_exception.dart';

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
      final statuses = Map<String, LiveFeedMessageStatus>.from(state.messageStatuses);
      statuses.removeWhere((key, _) {
        final parts = key.split(':');
        if (parts.length != 2) return true;
        final postId = parts.first;
        final bidId = parts.last;
        final exists = result.posts.any(
          (post) => post.id == postId && post.bids.any((bid) => bid.id == bidId),
        );
        return !exists;
      });
      state = state.copyWith(
        posts: result.posts,
        isLoading: false,
        offline: result.offline,
        lastUpdated: DateTime.now(),
        clearError: true,
        clearActionMessage: true,
        messageStatuses: statuses,
      );
    } on Exception catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error is StateError ? error.message : 'Unable to load live feed',
      );
    }
  }

  Future<bool> publishJob(LiveFeedJobDraft draft) async {
    state = state.copyWith(publishingJob: true, clearPublishError: true, clearActionMessage: true);
    try {
      final post = await _repository.publishJob(draft);
      state = state.copyWith(
        posts: [post, ...state.posts],
        publishingJob: false,
        actionMessage: 'Job published to live feed',
        lastUpdated: DateTime.now(),
        clearPublishError: true,
      );
      return true;
    } on ApiException catch (error) {
      state = state.copyWith(
        publishingJob: false,
        publishError: error.message,
      );
      return false;
    } on Exception {
      state = state.copyWith(
        publishingJob: false,
        publishError: 'Unable to publish job',
      );
      return false;
    }
  }

  Future<bool> submitBid(String postId, LiveFeedBidRequest request) async {
    final statuses = Map<String, LiveFeedBidStatus>.from(state.bidStatuses);
    final previous = statuses[postId] ?? const LiveFeedBidStatus();
    statuses[postId] = previous.copyWith(loading: true, clearError: true, success: false);
    state = state.copyWith(bidStatuses: statuses, clearActionMessage: true);

    try {
      final bid = await _repository.submitBid(postId, request);
      final posts = state.posts
          .map((post) => post.id == postId ? post.copyWith(bids: [bid, ...post.bids]) : post)
          .toList();
      statuses[postId] = const LiveFeedBidStatus(success: true);
      state = state.copyWith(
        posts: posts,
        bidStatuses: statuses,
        actionMessage: 'Bid submitted to buyer',
        lastUpdated: DateTime.now(),
      );
      return true;
    } on ApiException catch (error) {
      statuses[postId] = previous.copyWith(loading: false, error: error.message, success: false);
      state = state.copyWith(bidStatuses: statuses);
      return false;
    } on Exception {
      statuses[postId] = previous.copyWith(loading: false, error: 'Unable to submit bid', success: false);
      state = state.copyWith(bidStatuses: statuses);
      return false;
    }
  }

  Future<bool> sendBidMessage(
    String postId,
    String bidId,
    LiveFeedMessageRequest request,
  ) async {
    final key = '$postId:$bidId';
    final statuses = Map<String, LiveFeedMessageStatus>.from(state.messageStatuses);
    final previous = statuses[key] ?? const LiveFeedMessageStatus();
    statuses[key] = previous.copyWith(loading: true, clearError: true, success: false);
    state = state.copyWith(messageStatuses: statuses, clearActionMessage: true);

    try {
      final message = await _repository.sendBidMessage(postId, bidId, request);
      final posts = state.posts
          .map((post) {
            if (post.id != postId) return post;
            final bids = post.bids
                .map((bid) {
                  if (bid.id != bidId) return bid;
                  final updatedMessages = [...bid.messages, message]
                    ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
                  return bid.copyWith(messages: updatedMessages);
                })
                .toList();
            return post.copyWith(bids: bids);
          })
          .toList();
      statuses[key] = const LiveFeedMessageStatus(success: true);
      state = state.copyWith(
        posts: posts,
        messageStatuses: statuses,
        actionMessage: 'Message sent to bidder',
        lastUpdated: DateTime.now(),
      );
      return true;
    } on ApiException catch (error) {
      statuses[key] = previous.copyWith(loading: false, error: error.message, success: false);
      state = state.copyWith(messageStatuses: statuses);
      return false;
    } on Exception {
      statuses[key] = previous.copyWith(loading: false, error: 'Unable to send message', success: false);
      state = state.copyWith(messageStatuses: statuses);
      return false;
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

  void clearActionMessage() {
    state = state.copyWith(clearActionMessage: true);
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
    required this.publishingJob,
    required this.publishError,
    required this.actionMessage,
    required this.bidStatuses,
    required this.messageStatuses,
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
        publishingJob: false,
        publishError: null,
        actionMessage: null,
        bidStatuses: const <String, LiveFeedBidStatus>{},
        messageStatuses: const <String, LiveFeedMessageStatus>{},
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
  final bool publishingJob;
  final String? publishError;
  final String? actionMessage;
  final Map<String, LiveFeedBidStatus> bidStatuses;
  final Map<String, LiveFeedMessageStatus> messageStatuses;

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
    bool? publishingJob,
    String? publishError,
    bool clearPublishError = false,
    String? actionMessage,
    bool clearActionMessage = false,
    Map<String, LiveFeedBidStatus>? bidStatuses,
    Map<String, LiveFeedMessageStatus>? messageStatuses,
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
      publishingJob: publishingJob ?? this.publishingJob,
      publishError: clearPublishError ? null : (publishError ?? this.publishError),
      actionMessage: clearActionMessage ? null : (actionMessage ?? this.actionMessage),
      bidStatuses: bidStatuses ?? this.bidStatuses,
      messageStatuses: messageStatuses ?? this.messageStatuses,
    );
  }
}

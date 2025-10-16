import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logging/logging.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../data/live_feed_repository.dart';
import '../domain/live_feed_models.dart';
import '../../../core/exceptions/api_exception.dart';

final liveFeedControllerProvider =
    StateNotifierProvider<LiveFeedController, LiveFeedViewState>((ref) {
  final repository = ref.watch(liveFeedRepositoryProvider);
  final role = ref.watch(currentRoleProvider);
  return LiveFeedController(ref, repository, role)..init();
});

class LiveFeedController extends StateNotifier<LiveFeedViewState> {
  LiveFeedController(this._ref, this._repository, this._role)
      : super(LiveFeedViewState.initial(_role)) {
    _roleSubscription =
        _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous == next) return;
      _role = next;
      state = LiveFeedViewState.initial(next);
      init();
    });
  }

  static const _initialReconnectDelay = Duration(seconds: 2);
  static const _maxReconnectDelay = Duration(minutes: 1);
  static const int _streamLimit = 20;

  final Ref _ref;
  final LiveFeedRepository _repository;
  final Logger _logger = Logger('LiveFeedController');
  UserRole _role;
  late final ProviderSubscription<UserRole> _roleSubscription;
  StreamSubscription<LiveFeedServerEvent>? _streamSubscription;
  Timer? _reconnectTimer;
  Duration _nextReconnectDelay = _initialReconnectDelay;
  bool _disposed = false;

  void init() {
    unawaited(refresh(restartStream: true));
  }

  Future<void> refresh({bool restartStream = false}) async {
    if (_disposed) return;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.fetchLiveFeed(
        zoneId: state.zoneId,
        includeOutOfZone: state.includeOutOfZone,
        outOfZoneOnly: state.outOfZoneOnly,
        limit: _streamLimit,
      );
      if (_disposed) return;
      final messageStatuses =
          _pruneMessageStatuses(result.posts, state.messageStatuses);
      final bidStatuses = _pruneBidStatuses(result.posts, state.bidStatuses);
      state = state.copyWith(
        posts: result.posts,
        isLoading: false,
        offline: result.offline,
        lastUpdated: DateTime.now(),
        clearError: true,
        clearActionMessage: true,
        messageStatuses: messageStatuses,
        bidStatuses: bidStatuses,
      );
    } on ApiException catch (error) {
      if (_disposed) return;
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.message,
      );
    } on Exception catch (error) {
      if (_disposed) return;
      final message =
          error is StateError ? error.message : 'Unable to load live feed';
      state = state.copyWith(
        isLoading: false,
        errorMessage: message,
      );
    } finally {
      if (_disposed) return;
      if (restartStream) {
        _startStream(resetBackoff: true);
      } else if (_streamSubscription == null) {
        _startStream(resetBackoff: true);
      }
    }
  }

  Future<bool> publishJob(LiveFeedJobDraft draft) async {
    state = state.copyWith(
      publishingJob: true,
      clearPublishError: true,
      clearActionMessage: true,
    );
    try {
      final post = await _repository.publishJob(draft);
      if (_disposed) {
        return true;
      }
      final posts = _upsertPost(state.posts, post);
      state = state.copyWith(
        posts: posts,
        publishingJob: false,
        actionMessage: 'Job published to live feed',
        lastUpdated: DateTime.now(),
        clearPublishError: true,
        offline: false,
      );
      return true;
    } on ApiException catch (error) {
      if (_disposed) return false;
      state = state.copyWith(
        publishingJob: false,
        publishError: error.message,
      );
      return false;
    } on Exception {
      if (_disposed) return false;
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
    statuses[postId] =
        previous.copyWith(loading: true, clearError: true, success: false);
    state = state.copyWith(bidStatuses: statuses, clearActionMessage: true);

    try {
      final bid = await _repository.submitBid(postId, request);
      if (_disposed) return true;
      final posts = _applyBidCreated(state.posts, postId, bid);
      statuses[postId] = const LiveFeedBidStatus(success: true);
      state = state.copyWith(
        posts: posts,
        bidStatuses: statuses,
        actionMessage: 'Bid submitted to buyer',
        lastUpdated: DateTime.now(),
      );
      return true;
    } on ApiException catch (error) {
      statuses[postId] =
          previous.copyWith(loading: false, error: error.message, success: false);
      if (!_disposed) {
        state = state.copyWith(bidStatuses: statuses);
      }
      return false;
    } on Exception {
      statuses[postId] = previous.copyWith(
        loading: false,
        error: 'Unable to submit bid',
        success: false,
      );
      if (!_disposed) {
        state = state.copyWith(bidStatuses: statuses);
      }
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
    statuses[key] =
        previous.copyWith(loading: true, clearError: true, success: false);
    state = state.copyWith(messageStatuses: statuses, clearActionMessage: true);

    try {
      final message = await _repository.sendBidMessage(postId, bidId, request);
      if (_disposed) return true;
      final posts = _applyBidMessage(state.posts, postId, bidId, message);
      statuses[key] = const LiveFeedMessageStatus(success: true);
      state = state.copyWith(
        posts: posts,
        messageStatuses: statuses,
        actionMessage: 'Message sent to bidder',
        lastUpdated: DateTime.now(),
      );
      return true;
    } on ApiException catch (error) {
      statuses[key] =
          previous.copyWith(loading: false, error: error.message, success: false);
      if (!_disposed) {
        state = state.copyWith(messageStatuses: statuses);
      }
      return false;
    } on Exception {
      statuses[key] = previous.copyWith(
        loading: false,
        error: 'Unable to send message',
        success: false,
      );
      if (!_disposed) {
        state = state.copyWith(messageStatuses: statuses);
      }
      return false;
    }
  }

  void selectZone(String? zoneId) {
    state = state.copyWith(zoneId: zoneId);
    unawaited(refresh(restartStream: true));
  }

  void toggleIncludeOutOfZone(bool value) {
    final outOfZoneOnly = value ? state.outOfZoneOnly : false;
    state = state.copyWith(
      includeOutOfZone: value,
      outOfZoneOnly: outOfZoneOnly,
    );
    unawaited(refresh(restartStream: true));
  }

  void toggleOutOfZoneOnly(bool value) {
    state = state.copyWith(
      outOfZoneOnly: value,
      includeOutOfZone: value ? true : state.includeOutOfZone,
    );
    unawaited(refresh(restartStream: true));
  }

  void clearActionMessage() {
    state = state.copyWith(clearActionMessage: true);
  }

  void _startStream({bool resetBackoff = false}) {
    if (_disposed) return;
    _clearReconnectTimer();
    if (resetBackoff) {
      _nextReconnectDelay = _initialReconnectDelay;
    }
    _cancelStream();
    state = state.copyWith(
      streamConnected: false,
      streamReconnecting: true,
      clearStreamError: true,
    );

    try {
      final stream = _repository.watchLiveFeed(
        zoneId: state.zoneId,
        includeOutOfZone: state.includeOutOfZone,
        outOfZoneOnly: state.outOfZoneOnly,
        limit: _streamLimit,
      );

      _streamSubscription = stream.listen(
        _handleStreamEvent,
        onError: (error, stackTrace) {
          _logger.warning('Live feed stream error', error, stackTrace);
          _onStreamDisconnected(error);
        },
        onDone: () {
          _onStreamDisconnected(null, fromDone: true);
        },
        cancelOnError: false,
      );
    } catch (error, stackTrace) {
      _logger.severe('Unable to start live feed stream', error, stackTrace);
      _onStreamDisconnected(error);
    }
  }

  void _onStreamDisconnected(Object? error, {bool fromDone = false}) {
    if (_disposed) return;
    _streamSubscription = null;
    String? message;
    if (error is ApiException) {
      message = error.message;
    } else if (error is TimeoutException) {
      message = 'Live updates timed out. Attempting to reconnect…';
    } else if (error != null) {
      message = 'Live updates interrupted. Attempting to reconnect…';
    } else if (fromDone) {
      message = 'Live feed connection closed. Reconnecting…';
    }

    state = state.copyWith(
      streamConnected: false,
      streamReconnecting: true,
      streamError: message ?? state.streamError,
    );

    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    _clearReconnectTimer();
    final delay = _nextReconnectDelay;
    _reconnectTimer = Timer(delay, () {
      if (_disposed) return;
      _startStream();
    });

    final nextMilliseconds = (_nextReconnectDelay.inMilliseconds * 2).clamp(
      _initialReconnectDelay.inMilliseconds,
      _maxReconnectDelay.inMilliseconds,
    );
    _nextReconnectDelay = Duration(milliseconds: nextMilliseconds);
  }

  void _clearReconnectTimer() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  void _cancelStream() {
    final subscription = _streamSubscription;
    _streamSubscription = null;
    if (subscription != null) {
      unawaited(subscription.cancel());
    }
  }

  void _handleStreamEvent(LiveFeedServerEvent event) {
    if (_disposed) return;
    switch (event.type) {
      case 'connected':
        _nextReconnectDelay = _initialReconnectDelay;
        state = state.copyWith(
          streamConnected: true,
          streamReconnecting: false,
          offline: false,
          clearStreamError: true,
          lastUpdated: DateTime.now(),
        );
        break;
      case 'heartbeat':
        state = state.copyWith(lastUpdated: DateTime.now());
        break;
      case 'snapshot':
        final posts = _deserializePosts(event.data['posts']);
        final generatedAt = _parseTimestamp(event.data['generatedAt']);
        final messageStatuses = _pruneMessageStatuses(posts, state.messageStatuses);
        final bidStatuses = _pruneBidStatuses(posts, state.bidStatuses);
        state = state.copyWith(
          posts: posts,
          isLoading: false,
          offline: false,
          lastUpdated: generatedAt ?? DateTime.now(),
          streamConnected: true,
          streamReconnecting: false,
          clearStreamError: true,
          messageStatuses: messageStatuses,
          bidStatuses: bidStatuses,
        );
        break;
      case 'post.created':
        final post = _deserializePost(event.data['post']);
        if (post != null) {
          final posts = _upsertPost(state.posts, post);
          state = state.copyWith(
            posts: posts,
            lastUpdated: DateTime.now(),
            offline: false,
          );
        }
        break;
      case 'bid.created':
        final postId = event.data['postId'] as String?;
        final bid = _deserializeBid(event.data['bid']);
        if (postId != null && bid != null) {
          final posts = _applyBidCreated(state.posts, postId, bid);
          state = state.copyWith(
            posts: posts,
            lastUpdated: DateTime.now(),
          );
        }
        break;
      case 'bid.message':
        final postId = event.data['postId'] as String?;
        final bidId = event.data['bidId'] as String?;
        final message = _deserializeMessage(event.data['message']);
        if (postId != null && bidId != null && message != null) {
          final posts = _applyBidMessage(state.posts, postId, bidId, message);
          state = state.copyWith(
            posts: posts,
            lastUpdated: DateTime.now(),
          );
        }
        break;
      case 'error':
        final message =
            event.data['message'] as String? ?? 'Live updates interrupted';
        state = state.copyWith(streamError: message);
        break;
      default:
        break;
    }
  }

  List<LiveFeedPost> _deserializePosts(Object? raw) {
    if (raw is List) {
      final posts = raw
          .map((item) => _deserializePost(item))
          .whereType<LiveFeedPost>()
          .toList();
      if (posts.length > _streamLimit) {
        return posts.sublist(0, _streamLimit);
      }
      return posts;
    }
    return const [];
  }

  LiveFeedPost? _deserializePost(Object? raw) {
    if (raw is LiveFeedPost) {
      return raw;
    }
    if (raw is Map<String, dynamic>) {
      return LiveFeedPost.fromJson(raw);
    }
    if (raw is Map) {
      return LiveFeedPost.fromJson(Map<String, dynamic>.from(raw));
    }
    return null;
  }

  LiveFeedBid? _deserializeBid(Object? raw) {
    if (raw is LiveFeedBid) {
      return raw;
    }
    if (raw is Map<String, dynamic>) {
      return LiveFeedBid.fromJson(raw);
    }
    if (raw is Map) {
      return LiveFeedBid.fromJson(Map<String, dynamic>.from(raw));
    }
    return null;
  }

  LiveFeedBidMessage? _deserializeMessage(Object? raw) {
    if (raw is LiveFeedBidMessage) {
      return raw;
    }
    if (raw is Map<String, dynamic>) {
      return LiveFeedBidMessage.fromJson(raw);
    }
    if (raw is Map) {
      return LiveFeedBidMessage.fromJson(Map<String, dynamic>.from(raw));
    }
    return null;
  }

  DateTime? _parseTimestamp(Object? raw) {
    if (raw is DateTime) {
      return raw;
    }
    if (raw is String) {
      return DateTime.tryParse(raw);
    }
    return null;
  }

  List<LiveFeedPost> _upsertPost(
    List<LiveFeedPost> posts,
    LiveFeedPost incoming,
  ) {
    final existing = posts.where((post) => post.id != incoming.id).toList();
    existing.insert(0, incoming);
    if (existing.length > _streamLimit) {
      return existing.sublist(0, _streamLimit);
    }
    return existing;
  }

  List<LiveFeedPost> _applyBidCreated(
    List<LiveFeedPost> posts,
    String postId,
    LiveFeedBid bid,
  ) {
    return posts
        .map((post) {
          if (post.id != postId) {
            return post;
          }
          final bids = [bid, ...post.bids.where((entry) => entry.id != bid.id)];
          return post.copyWith(bids: bids);
        })
        .toList();
  }

  List<LiveFeedPost> _applyBidMessage(
    List<LiveFeedPost> posts,
    String postId,
    String bidId,
    LiveFeedBidMessage message,
  ) {
    return posts
        .map((post) {
          if (post.id != postId) {
            return post;
          }
          final bids = post.bids.map((bid) {
            if (bid.id != bidId) {
              return bid;
            }
            final messages = [...bid.messages];
            final index = messages.indexWhere((entry) => entry.id == message.id);
            if (index >= 0) {
              messages[index] = message;
            } else {
              messages.add(message);
            }
            messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
            return bid.copyWith(messages: messages);
          }).toList();
          return post.copyWith(bids: bids);
        })
        .toList();
  }

  Map<String, LiveFeedMessageStatus> _pruneMessageStatuses(
    List<LiveFeedPost> posts,
    Map<String, LiveFeedMessageStatus> statuses,
  ) {
    if (statuses.isEmpty) {
      return statuses;
    }
    final valid = <String>{};
    for (final post in posts) {
      for (final bid in post.bids) {
        valid.add('${post.id}:${bid.id}');
      }
    }
    return Map<String, LiveFeedMessageStatus>.fromEntries(
      statuses.entries.where((entry) => valid.contains(entry.key)),
    );
  }

  Map<String, LiveFeedBidStatus> _pruneBidStatuses(
    List<LiveFeedPost> posts,
    Map<String, LiveFeedBidStatus> statuses,
  ) {
    if (statuses.isEmpty) {
      return statuses;
    }
    final validIds = posts.map((post) => post.id).toSet();
    return Map<String, LiveFeedBidStatus>.fromEntries(
      statuses.entries.where((entry) => validIds.contains(entry.key)),
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _roleSubscription.close();
    _clearReconnectTimer();
    _cancelStream();
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
    required this.publishingJob,
    required this.publishError,
    required this.actionMessage,
    required this.bidStatuses,
    required this.messageStatuses,
    required this.streamConnected,
    required this.streamReconnecting,
    required this.streamError,
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
        streamConnected: false,
        streamReconnecting: false,
        streamError: null,
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
  final bool streamConnected;
  final bool streamReconnecting;
  final String? streamError;

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
    bool? streamConnected,
    bool? streamReconnecting,
    String? streamError,
    bool clearStreamError = false,
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
      streamConnected: streamConnected ?? this.streamConnected,
      streamReconnecting: streamReconnecting ?? this.streamReconnecting,
      streamError: clearStreamError ? null : (streamError ?? this.streamError),
    );
  }
}

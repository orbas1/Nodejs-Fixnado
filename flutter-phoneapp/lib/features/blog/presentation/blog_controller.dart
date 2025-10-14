import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../../../core/exceptions/api_exception.dart';
import '../data/blog_repository.dart';
import '../domain/blog_models.dart';

final blogControllerProvider = StateNotifierProvider<BlogController, BlogViewState>((ref) {
  final repository = ref.watch(blogRepositoryProvider);
  return BlogController(ref, repository);
});

class BlogViewState {
  const BlogViewState({
    required this.isLoading,
    required this.errorMessage,
    required this.offline,
    required this.snapshot,
    required this.selectedCategory,
    required this.selectedTag,
  });

  factory BlogViewState.initial() => const BlogViewState(
        isLoading: true,
        errorMessage: null,
        offline: false,
        snapshot: null,
        selectedCategory: 'all',
        selectedTag: 'all',
      );

  final bool isLoading;
  final String? errorMessage;
  final bool offline;
  final BlogFeedSnapshot? snapshot;
  final String selectedCategory;
  final String selectedTag;

  BlogViewState copyWith({
    bool? isLoading,
    String? errorMessage,
    bool? offline,
    BlogFeedSnapshot? snapshot,
    String? selectedCategory,
    String? selectedTag,
  }) {
    return BlogViewState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      offline: offline ?? this.offline,
      snapshot: snapshot ?? this.snapshot,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedTag: selectedTag ?? this.selectedTag,
    );
  }

  List<BlogPostModel> get posts => snapshot?.posts ?? const [];
  List<BlogCategoryModel> get categories => snapshot?.categories ?? const [];
  List<BlogTagModel> get tags => snapshot?.tags ?? const [];
  BlogPaginationInfo get pagination => snapshot?.pagination ?? const BlogPaginationInfo(page: 1, pageSize: 12, total: 0);

  bool get hasFilters => selectedCategory != 'all' || selectedTag != 'all';
}

class BlogController extends StateNotifier<BlogViewState> {
  BlogController(this._ref, this._repository) : super(BlogViewState.initial()) {
    _roleSubscription = _ref.listen<UserRole>(currentRoleProvider, (previous, next) {
      if (previous != next) {
        _load();
      }
    });
    _load().ignore();
  }

  final Ref _ref;
  final BlogRepository _repository;
  late final ProviderSubscription<UserRole> _roleSubscription;

  Future<void> refresh() => _load(forceRefresh: true);

  Future<void> _load({bool forceRefresh = false, int page = 1}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final snapshot = await _repository.fetchFeed(
        page: page,
        category: state.selectedCategory == 'all' ? null : state.selectedCategory,
        tag: state.selectedTag == 'all' ? null : state.selectedTag,
        bypassCache: forceRefresh,
      );
      state = state.copyWith(
        isLoading: false,
        snapshot: snapshot,
        offline: snapshot.offline,
        errorMessage: null,
      );
    } on ApiException catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.message);
    } on TimeoutException catch (_) {
      state = state.copyWith(isLoading: false, errorMessage: 'Connection timed out');
    }
  }

  void updateCategory(String category) {
    state = state.copyWith(selectedCategory: category);
    _load(page: 1).ignore();
  }

  void updateTag(String tag) {
    state = state.copyWith(selectedTag: tag);
    _load(page: 1).ignore();
  }

  void goToPage(int page) {
    final pagination = state.pagination;
    final clamped = page.clamp(1, pagination.totalPages);
    _load(page: clamped).ignore();
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

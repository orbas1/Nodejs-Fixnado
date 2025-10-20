import 'dart:async';
import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/learning_repository.dart';
import '../domain/learning_models.dart';

final learningRepositoryProvider = Provider<LearningRepository>((ref) {
  final repository = InMemoryLearningRepository();
  ref.onDispose(repository.dispose);
  return repository;
});

final learningControllerProvider =
    StateNotifierProvider<LearningController, LearningDashboardState>((ref) {
  final repository = ref.watch(learningRepositoryProvider);
  final controller = LearningController(repository);
  controller.initialize();
  ref.onDispose(controller.dispose);
  return controller;
});

class LearningController extends StateNotifier<LearningDashboardState> {
  LearningController(this._repository) : super(LearningDashboardState.initial());

  final LearningRepository _repository;
  final _random = Random();
  StreamSubscription<LearningSnapshot>? _subscription;

  Future<void> initialize() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final snapshot = await _repository.fetchSnapshot();
      _applySnapshot(snapshot);
      _subscription ??= _repository.watchSnapshot().listen(_applySnapshot,
          onError: (Object error, StackTrace stackTrace) {
        state = state.copyWith(isLoading: false, errorMessage: 'Failed to sync learning hub');
      });
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Unable to load learning hub data. Please retry.',
      );
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isRefreshing: true, clearError: true);
    try {
      await _repository.refresh();
    } catch (error) {
      state = state.copyWith(errorMessage: 'Refresh failed. Check your connection.');
    } finally {
      state = state.copyWith(isRefreshing: false);
    }
  }

  Future<void> upsertCommunity(CommunitySpace draft) async {
    await _mutate(() => _repository.upsertCommunity(draft));
  }

  Future<void> deleteCommunity(String id) async {
    await _mutate(() => _repository.deleteCommunity(id));
  }

  Future<void> upsertCourse(CourseModule draft) async {
    await _mutate(() => _repository.upsertCourse(draft));
  }

  Future<void> deleteCourse(String id) async {
    await _mutate(() => _repository.deleteCourse(id));
  }

  Future<void> upsertEbook(EbookResource draft) async {
    await _mutate(() => _repository.upsertEbook(draft));
  }

  Future<void> deleteEbook(String id) async {
    await _mutate(() => _repository.deleteEbook(id));
  }

  Future<void> upsertTutor(TutorProfile draft) async {
    await _mutate(() => _repository.upsertTutor(draft));
  }

  Future<void> deleteTutor(String id) async {
    await _mutate(() => _repository.deleteTutor(id));
  }

  CommunitySpace createCommunityDraft({String? id}) {
    return CommunitySpace(
      id: id ?? _generateId('community'),
      name: '',
      mission: '',
      members: 10 + _random.nextInt(40),
      isPrivate: true,
    );
  }

  CourseModule createCourseDraft({String? id}) {
    return CourseModule(
      id: id ?? _generateId('course'),
      title: '',
      category: 'Operations',
      durationMinutes: 90,
      isPublished: true,
    );
  }

  EbookResource createEbookDraft({String? id}) {
    return EbookResource(
      id: id ?? _generateId('ebook'),
      title: '',
      author: '',
      topic: 'Enablement',
    );
  }

  TutorProfile createTutorDraft({String? id}) {
    return TutorProfile(
      id: id ?? _generateId('tutor'),
      name: '',
      speciality: 'Mentorship',
      rating: 4.5,
      languages: const ['English'],
    );
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  Future<void> _mutate(Future<void> Function() mutation) async {
    state = state.copyWith(isMutating: true, clearError: true);
    try {
      await mutation();
    } catch (error) {
      state = state.copyWith(errorMessage: 'Unable to persist change. Try again.');
    } finally {
      state = state.copyWith(isMutating: false);
    }
  }

  void _applySnapshot(LearningSnapshot snapshot) {
    state = state.copyWith(
      communities: snapshot.communities,
      courses: snapshot.courses,
      ebooks: snapshot.ebooks,
      tutors: snapshot.tutors,
      isLoading: false,
      lastSynced: snapshot.generatedAt,
      clearError: true,
    );
  }

  String _generateId(String prefix) {
    final salt = _random.nextInt(1 << 20).toRadixString(36);
    return '$prefix-${DateTime.now().millisecondsSinceEpoch}-$salt';
  }
}

class LearningDashboardState {
  const LearningDashboardState({
    required this.communities,
    required this.courses,
    required this.ebooks,
    required this.tutors,
    required this.isLoading,
    required this.isRefreshing,
    required this.isMutating,
    required this.lastSynced,
    required this.errorMessage,
  });

  factory LearningDashboardState.initial() {
    return const LearningDashboardState(
      communities: [],
      courses: [],
      ebooks: [],
      tutors: [],
      isLoading: true,
      isRefreshing: false,
      isMutating: false,
      lastSynced: null,
      errorMessage: null,
    );
  }

  final List<CommunitySpace> communities;
  final List<CourseModule> courses;
  final List<EbookResource> ebooks;
  final List<TutorProfile> tutors;
  final bool isLoading;
  final bool isRefreshing;
  final bool isMutating;
  final DateTime? lastSynced;
  final String? errorMessage;

  int get totalCommunities => communities.length;
  int get totalCourses => courses.length;
  int get totalEbooks => ebooks.length;
  int get totalTutors => tutors.length;
  int get publishedCourses => courses.where((course) => course.isPublished).length;
  int get privateCommunities => communities.where((community) => community.isPrivate).length;
  int get totalCommunityMembers =>
      communities.fold<int>(0, (previousValue, element) => previousValue + element.members);
  double get averageTutorRating =>
      tutors.isEmpty ? 0 : tutors.map((tutor) => tutor.rating).reduce((value, element) => value + element) / tutors.length;

  LearningDashboardState copyWith({
    List<CommunitySpace>? communities,
    List<CourseModule>? courses,
    List<EbookResource>? ebooks,
    List<TutorProfile>? tutors,
    bool? isLoading,
    bool? isRefreshing,
    bool? isMutating,
    DateTime? lastSynced,
    String? errorMessage,
    bool clearError = false,
  }) {
    return LearningDashboardState(
      communities: communities ?? this.communities,
      courses: courses ?? this.courses,
      ebooks: ebooks ?? this.ebooks,
      tutors: tutors ?? this.tutors,
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isMutating: isMutating ?? this.isMutating,
      lastSynced: lastSynced ?? this.lastSynced,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

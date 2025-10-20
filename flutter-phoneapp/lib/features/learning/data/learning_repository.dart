import 'dart:async';
import 'dart:math';

import '../domain/learning_models.dart';

class LearningSnapshot {
  const LearningSnapshot({
    required this.communities,
    required this.courses,
    required this.ebooks,
    required this.tutors,
    required this.generatedAt,
  });

  final List<CommunitySpace> communities;
  final List<CourseModule> courses;
  final List<EbookResource> ebooks;
  final List<TutorProfile> tutors;
  final DateTime generatedAt;
}

abstract class LearningRepository {
  Future<LearningSnapshot> fetchSnapshot();
  Stream<LearningSnapshot> watchSnapshot();
  Future<void> refresh();
  Future<void> upsertCommunity(CommunitySpace community);
  Future<void> deleteCommunity(String id);
  Future<void> upsertCourse(CourseModule course);
  Future<void> deleteCourse(String id);
  Future<void> upsertEbook(EbookResource ebook);
  Future<void> deleteEbook(String id);
  Future<void> upsertTutor(TutorProfile tutor);
  Future<void> deleteTutor(String id);
  void dispose();
}

class InMemoryLearningRepository implements LearningRepository {
  InMemoryLearningRepository() {
    _communities = [
      const CommunitySpace(
        id: 'community-pulse',
        name: 'Ops Community Council',
        mission: 'Align regional champions with real-time service health.',
        members: 140,
        isPrivate: true,
      ),
      const CommunitySpace(
        id: 'community-campus',
        name: 'Campus Ambassadors',
        mission: 'Peer-to-peer masterminds for junior technicians onboarding.',
        members: 88,
        isPrivate: false,
      ),
    ];

    _courses = [
      const CourseModule(
        id: 'course-field',
        title: 'Field Excellence Bootcamp',
        category: 'Operations',
        durationMinutes: 480,
        isPublished: true,
      ),
      const CourseModule(
        id: 'course-lead',
        title: 'Crew Leadership Lab',
        category: 'Leadership',
        durationMinutes: 360,
        isPublished: false,
      ),
    ];

    _ebooks = [
      const EbookResource(
        id: 'ebook-playbook',
        title: 'Dispatch Playbook',
        author: 'Fixnado Research',
        topic: 'Logistics',
      ),
      const EbookResource(
        id: 'ebook-analytics',
        title: 'Analytics Jumpstart',
        author: 'Dana Wright',
        topic: 'Data',
      ),
    ];

    _tutors = [
      const TutorProfile(
        id: 'tutor-lennox',
        name: 'Lennox Rivers',
        speciality: 'Electrical diagnostics',
        rating: 4.9,
        languages: ['English', 'French'],
      ),
      const TutorProfile(
        id: 'tutor-sana',
        name: 'Sana Ortiz',
        speciality: 'HVAC commissioning',
        rating: 4.7,
        languages: ['English', 'Spanish'],
      ),
    ];
  }

  late List<CommunitySpace> _communities;
  late List<CourseModule> _courses;
  late List<EbookResource> _ebooks;
  late List<TutorProfile> _tutors;

  final _controller = StreamController<LearningSnapshot>.broadcast();
  final _random = Random();

  @override
  Future<LearningSnapshot> fetchSnapshot() async {
    await Future<void>.delayed(const Duration(milliseconds: 240));
    return _snapshot();
  }

  @override
  Stream<LearningSnapshot> watchSnapshot() => _controller.stream;

  @override
  Future<void> refresh() async {
    await Future<void>.delayed(Duration(milliseconds: 320 + _random.nextInt(220)));
    _emitSnapshot();
  }

  @override
  Future<void> upsertCommunity(CommunitySpace community) async {
    await Future<void>.delayed(Duration(milliseconds: 260 + _random.nextInt(200)));
    final index = _communities.indexWhere((item) => item.id == community.id);
    if (index >= 0) {
      _communities[index] = community;
    } else {
      _communities = [community, ..._communities];
    }
    _emitSnapshot();
  }

  @override
  Future<void> deleteCommunity(String id) async {
    await Future<void>.delayed(Duration(milliseconds: 220 + _random.nextInt(160)));
    _communities = _communities.where((item) => item.id != id).toList(growable: false);
    _emitSnapshot();
  }

  @override
  Future<void> upsertCourse(CourseModule course) async {
    await Future<void>.delayed(Duration(milliseconds: 260 + _random.nextInt(220)));
    final index = _courses.indexWhere((item) => item.id == course.id);
    if (index >= 0) {
      _courses[index] = course;
    } else {
      _courses = [..._courses, course];
    }
    _emitSnapshot();
  }

  @override
  Future<void> deleteCourse(String id) async {
    await Future<void>.delayed(Duration(milliseconds: 220 + _random.nextInt(160)));
    _courses = _courses.where((item) => item.id != id).toList(growable: false);
    _emitSnapshot();
  }

  @override
  Future<void> upsertEbook(EbookResource ebook) async {
    await Future<void>.delayed(Duration(milliseconds: 240 + _random.nextInt(160)));
    final index = _ebooks.indexWhere((item) => item.id == ebook.id);
    if (index >= 0) {
      _ebooks[index] = ebook;
    } else {
      _ebooks = [..._ebooks, ebook];
    }
    _emitSnapshot();
  }

  @override
  Future<void> deleteEbook(String id) async {
    await Future<void>.delayed(Duration(milliseconds: 220 + _random.nextInt(160)));
    _ebooks = _ebooks.where((item) => item.id != id).toList(growable: false);
    _emitSnapshot();
  }

  @override
  Future<void> upsertTutor(TutorProfile tutor) async {
    await Future<void>.delayed(Duration(milliseconds: 260 + _random.nextInt(200)));
    final index = _tutors.indexWhere((item) => item.id == tutor.id);
    if (index >= 0) {
      _tutors[index] = tutor;
    } else {
      _tutors = [tutor, ..._tutors];
    }
    _emitSnapshot();
  }

  @override
  Future<void> deleteTutor(String id) async {
    await Future<void>.delayed(Duration(milliseconds: 220 + _random.nextInt(180)));
    _tutors = _tutors.where((item) => item.id != id).toList(growable: false);
    _emitSnapshot();
  }

  @override
  void dispose() {
    _controller.close();
  }

  LearningSnapshot _snapshot() {
    return LearningSnapshot(
      communities: List<CommunitySpace>.unmodifiable(_communities),
      courses: List<CourseModule>.unmodifiable(_courses),
      ebooks: List<EbookResource>.unmodifiable(_ebooks),
      tutors: List<TutorProfile>.unmodifiable(_tutors),
      generatedAt: DateTime.now(),
    );
  }

  void _emitSnapshot() {
    if (_controller.isClosed) return;
    _controller.add(_snapshot());
  }
}

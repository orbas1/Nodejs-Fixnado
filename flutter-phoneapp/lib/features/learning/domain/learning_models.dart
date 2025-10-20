import 'package:equatable/equatable.dart';

class CommunitySpace extends Equatable {
  const CommunitySpace({
    required this.id,
    required this.name,
    required this.mission,
    required this.members,
    required this.isPrivate,
  });

  final String id;
  final String name;
  final String mission;
  final int members;
  final bool isPrivate;

  CommunitySpace copyWith({
    String? id,
    String? name,
    String? mission,
    int? members,
    bool? isPrivate,
  }) {
    return CommunitySpace(
      id: id ?? this.id,
      name: name ?? this.name,
      mission: mission ?? this.mission,
      members: members ?? this.members,
      isPrivate: isPrivate ?? this.isPrivate,
    );
  }

  @override
  List<Object?> get props => [id, name, mission, members, isPrivate];
}

class CourseModule extends Equatable {
  const CourseModule({
    required this.id,
    required this.title,
    required this.category,
    required this.durationMinutes,
    required this.isPublished,
  });

  final String id;
  final String title;
  final String category;
  final int durationMinutes;
  final bool isPublished;

  CourseModule copyWith({
    String? id,
    String? title,
    String? category,
    int? durationMinutes,
    bool? isPublished,
  }) {
    return CourseModule(
      id: id ?? this.id,
      title: title ?? this.title,
      category: category ?? this.category,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      isPublished: isPublished ?? this.isPublished,
    );
  }

  @override
  List<Object?> get props => [id, title, category, durationMinutes, isPublished];
}

class EbookResource extends Equatable {
  const EbookResource({
    required this.id,
    required this.title,
    required this.author,
    required this.topic,
  });

  final String id;
  final String title;
  final String author;
  final String topic;

  EbookResource copyWith({
    String? id,
    String? title,
    String? author,
    String? topic,
  }) {
    return EbookResource(
      id: id ?? this.id,
      title: title ?? this.title,
      author: author ?? this.author,
      topic: topic ?? this.topic,
    );
  }

  @override
  List<Object?> get props => [id, title, author, topic];
}

class TutorProfile extends Equatable {
  const TutorProfile({
    required this.id,
    required this.name,
    required this.speciality,
    required this.rating,
    required this.languages,
  });

  final String id;
  final String name;
  final String speciality;
  final double rating;
  final List<String> languages;

  TutorProfile copyWith({
    String? id,
    String? name,
    String? speciality,
    double? rating,
    List<String>? languages,
  }) {
    return TutorProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      speciality: speciality ?? this.speciality,
      rating: rating ?? this.rating,
      languages: languages ?? this.languages,
    );
  }

  @override
  List<Object?> get props => [id, name, speciality, rating, languages];
}

class LearningEvent extends Equatable {
  const LearningEvent({
    required this.id,
    required this.title,
    required this.startsAt,
    required this.location,
    required this.category,
  });

  final String id;
  final String title;
  final DateTime startsAt;
  final String location;
  final String category;

  LearningEvent copyWith({
    String? id,
    String? title,
    DateTime? startsAt,
    String? location,
    String? category,
  }) {
    return LearningEvent(
      id: id ?? this.id,
      title: title ?? this.title,
      startsAt: startsAt ?? this.startsAt,
      location: location ?? this.location,
      category: category ?? this.category,
    );
  }

  @override
  List<Object?> get props => [id, title, startsAt, location, category];
}

class LearnerProfile extends Equatable {
  const LearnerProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.progress,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final double progress;

  LearnerProfile copyWith({
    String? id,
    String? name,
    String? email,
    String? role,
    double? progress,
  }) {
    return LearnerProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      progress: progress ?? this.progress,
    );
  }

  @override
  List<Object?> get props => [id, name, email, role, progress];
}

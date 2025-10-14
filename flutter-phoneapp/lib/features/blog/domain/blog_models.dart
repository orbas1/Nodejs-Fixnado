import 'package:collection/collection.dart';

DateTime? _parseDate(dynamic value) {
  if (value is DateTime) return value;
  if (value is String) {
    return DateTime.tryParse(value);
  }
  return null;
}

int? _toInt(dynamic value) {
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

class BlogCategoryModel {
  const BlogCategoryModel({required this.id, required this.name, required this.slug});

  factory BlogCategoryModel.fromJson(Map<String, dynamic> json) => BlogCategoryModel(
        id: json['id']?.toString() ?? json['slug']?.toString() ?? '',
        name: json['name']?.toString() ?? 'Uncategorised',
        slug: json['slug']?.toString() ?? 'uncategorised',
      );

  final String id;
  final String name;
  final String slug;
}

class BlogTagModel {
  const BlogTagModel({required this.id, required this.name, required this.slug});

  factory BlogTagModel.fromJson(Map<String, dynamic> json) => BlogTagModel(
        id: json['id']?.toString() ?? json['slug']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        slug: json['slug']?.toString() ?? '',
      );

  final String id;
  final String name;
  final String slug;
}

class BlogMediaAsset {
  const BlogMediaAsset({required this.id, required this.url, required this.type, required this.altText});

  factory BlogMediaAsset.fromJson(Map<String, dynamic> json) => BlogMediaAsset(
        id: json['id']?.toString() ?? json['url']?.toString() ?? '',
        url: json['url']?.toString() ?? '',
        type: json['type']?.toString() ?? 'image',
        altText: json['altText']?.toString(),
      );

  final String id;
  final String url;
  final String type;
  final String? altText;
}

class BlogAuthorModel {
  const BlogAuthorModel({required this.id, required this.firstName, required this.lastName});

  factory BlogAuthorModel.fromJson(Map<String, dynamic> json) => BlogAuthorModel(
        id: json['id']?.toString() ?? '',
        firstName: json['firstName']?.toString() ?? '',
        lastName: json['lastName']?.toString() ?? '',
      );

  final String id;
  final String firstName;
  final String lastName;

  String get fullName => [firstName, lastName].where((value) => value.isNotEmpty).join(' ');
}

class BlogPostModel {
  const BlogPostModel({
    required this.id,
    required this.title,
    required this.slug,
    required this.excerpt,
    required this.heroImageUrl,
    required this.heroImageAlt,
    required this.content,
    required this.readingTimeMinutes,
    required this.publishedAt,
    required this.categories,
    required this.tags,
    required this.media,
    required this.author,
  });

  factory BlogPostModel.fromJson(Map<String, dynamic> json) {
    final categories = (json['categories'] as List<dynamic>? ?? const [])
        .map((entry) => BlogCategoryModel.fromJson(Map<String, dynamic>.from(entry as Map)))
        .toList();
    final tags = (json['tags'] as List<dynamic>? ?? const [])
        .map((entry) => BlogTagModel.fromJson(Map<String, dynamic>.from(entry as Map)))
        .toList();
    final media = (json['media'] as List<dynamic>? ?? const [])
        .map((entry) => BlogMediaAsset.fromJson(Map<String, dynamic>.from(entry as Map)))
        .toList();
    return BlogPostModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Untitled',
      slug: json['slug']?.toString() ?? '',
      excerpt: json['excerpt']?.toString() ?? '',
      heroImageUrl: json['heroImageUrl']?.toString(),
      heroImageAlt: json['heroImageAlt']?.toString(),
      content: json['content']?.toString() ?? '',
      readingTimeMinutes: _toInt(json['readingTimeMinutes']) ?? 6,
      publishedAt: _parseDate(json['publishedAt']),
      categories: categories,
      tags: tags,
      media: media,
      author: json['author'] is Map<String, dynamic>
          ? BlogAuthorModel.fromJson(Map<String, dynamic>.from(json['author'] as Map))
          : null,
    );
  }

  final String id;
  final String title;
  final String slug;
  final String excerpt;
  final String? heroImageUrl;
  final String? heroImageAlt;
  final String content;
  final int readingTimeMinutes;
  final DateTime? publishedAt;
  final List<BlogCategoryModel> categories;
  final List<BlogTagModel> tags;
  final List<BlogMediaAsset> media;
  final BlogAuthorModel? author;

  String get heroImage => heroImageUrl ?? 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a';
  String get primaryCategory => categories.firstOrNull?.name ?? 'Insight';
}

class BlogPaginationInfo {
  const BlogPaginationInfo({required this.page, required this.pageSize, required this.total});

  factory BlogPaginationInfo.fromJson(Map<String, dynamic> json) => BlogPaginationInfo(
        page: _toInt(json['page']) ?? 1,
        pageSize: _toInt(json['pageSize']) ?? 12,
        total: _toInt(json['total']) ?? 0,
      );

  final int page;
  final int pageSize;
  final int total;

  int get totalPages => total <= 0 ? 1 : ((total - 1) ~/ pageSize) + 1;
}

class BlogFeedSnapshot {
  const BlogFeedSnapshot({
    required this.generatedAt,
    required this.posts,
    required this.categories,
    required this.tags,
    required this.pagination,
    required this.offline,
  });

  factory BlogFeedSnapshot.fromJson(Map<String, dynamic> json, {bool offline = false}) {
    final posts = (json['posts'] as List<dynamic>? ?? const [])
        .map((entry) => BlogPostModel.fromJson(Map<String, dynamic>.from(entry as Map)))
        .toList();
    final categories = (json['categories'] as List<dynamic>? ?? const [])
        .map((entry) => BlogCategoryModel.fromJson(Map<String, dynamic>.from(entry as Map)))
        .toList();
    final tags = (json['tags'] as List<dynamic>? ?? const [])
        .map((entry) => BlogTagModel.fromJson(Map<String, dynamic>.from(entry as Map)))
        .toList();
    final pagination = BlogPaginationInfo.fromJson(Map<String, dynamic>.from(json['pagination'] as Map? ?? {}));
    return BlogFeedSnapshot(
      generatedAt: _parseDate(json['generatedAt']) ?? DateTime.now(),
      posts: posts,
      categories: categories,
      tags: tags,
      pagination: pagination,
      offline: offline,
    );
  }

  final DateTime generatedAt;
  final List<BlogPostModel> posts;
  final List<BlogCategoryModel> categories;
  final List<BlogTagModel> tags;
  final BlogPaginationInfo pagination;
  final bool offline;

  Map<String, dynamic> toCacheJson() {
    return {
      'generatedAt': generatedAt.toIso8601String(),
      'pagination': {
        'page': pagination.page,
        'pageSize': pagination.pageSize,
        'total': pagination.total,
      },
      'posts': posts
          .map(
            (post) => {
              'id': post.id,
              'title': post.title,
              'slug': post.slug,
              'excerpt': post.excerpt,
              'heroImageUrl': post.heroImageUrl,
              'heroImageAlt': post.heroImageAlt,
              'content': post.content,
              'readingTimeMinutes': post.readingTimeMinutes,
              'publishedAt': post.publishedAt?.toIso8601String(),
              'author': post.author == null
                  ? null
                  : {
                      'id': post.author!.id,
                      'firstName': post.author!.firstName,
                      'lastName': post.author!.lastName,
                    },
              'categories': post.categories
                  .map((category) => {'id': category.id, 'name': category.name, 'slug': category.slug})
                  .toList(),
              'tags': post.tags.map((tag) => {'id': tag.id, 'name': tag.name, 'slug': tag.slug}).toList(),
              'media': post.media
                  .map((asset) => {'id': asset.id, 'url': asset.url, 'type': asset.type, 'altText': asset.altText})
                  .toList(),
            },
          )
          .toList(),
      'categories': categories
          .map((category) => {'id': category.id, 'name': category.name, 'slug': category.slug})
          .toList(),
      'tags': tags.map((tag) => {'id': tag.id, 'name': tag.name, 'slug': tag.slug}).toList(),
    };
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../auth/domain/user_role.dart';
import '../../auth/domain/role_scope.dart';
import '../domain/blog_models.dart';
import 'blog_controller.dart';

class BlogScreen extends ConsumerWidget {
  const BlogScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(blogControllerProvider);
    final controller = ref.read(blogControllerProvider.notifier);
    final role = ref.watch(currentRoleProvider);

    if (state.isLoading && state.snapshot == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null && state.snapshot == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text('We couldn\'t load insights', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              Text(
                state.errorMessage!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.blueGrey.shade600),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: controller.refresh,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final posts = state.posts;
    final heroPost = posts.isNotEmpty ? posts.first : null;
    final secondaryPosts = posts.length > 1 ? posts.sublist(1) : const <BlogPostModel>[];
    final categories = state.categories;
    final tags = state.tags;
    final pagination = state.pagination;

    return RefreshIndicator(
      onRefresh: controller.refresh,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Fixnado Insights', style: GoogleFonts.manrope(fontSize: 12, letterSpacing: 1.6, color: Colors.indigo)),
                  const SizedBox(height: 8),
                  Text(
                    'Operational intelligence for ${role == UserRole.provider ? 'field services' : 'marketplaces'}',
                    style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Stay ahead with weekly briefings covering trust & safety, geo-matching science, campaign automation and provider enablement.',
                    style: GoogleFonts.inter(fontSize: 14, color: Colors.blueGrey.shade600),
                  ),
                  if (state.offline) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.offline_bolt_outlined, size: 18, color: Colors.amber.shade800),
                          const SizedBox(width: 8),
                          Text('Offline snapshot', style: GoogleFonts.inter(fontSize: 12, color: Colors.amber.shade800)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (heroPost != null)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              sliver: SliverToBoxAdapter(child: _HeroCard(post: heroPost)),
            ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ChoiceChip(
                        label: const Text('All categories'),
                        selected: state.selectedCategory == 'all',
                        onSelected: (_) => controller.updateCategory('all'),
                      ),
                      ...categories.map(
                        (category) => ChoiceChip(
                          label: Text(category.name),
                          selected: state.selectedCategory == category.slug,
                          onSelected: (_) => controller.updateCategory(category.slug),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('#all'),
                        selected: state.selectedTag == 'all',
                        onSelected: (_) => controller.updateTag('all'),
                      ),
                      ...tags.map(
                        (tag) => FilterChip(
                          label: Text('#${tag.slug}'),
                          selected: state.selectedTag == tag.slug,
                          onSelected: (_) => controller.updateTag(tag.slug),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (secondaryPosts.isEmpty)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              sliver: SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    color: Colors.white,
                    border: Border.all(color: Colors.blueGrey.withOpacity(0.08)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('No posts yet', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Text(
                        'New field intelligence drops every Tuesday. Check back soon for more insights.',
                        style: GoogleFonts.inter(fontSize: 13, color: Colors.blueGrey.shade600),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              sliver: SliverList.separated(
                itemBuilder: (context, index) => _BlogCard(post: secondaryPosts[index]),
                separatorBuilder: (context, _) => const SizedBox(height: 16),
                itemCount: secondaryPosts.length,
              ),
            ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            sliver: SliverToBoxAdapter(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Page ${pagination.page} of ${pagination.totalPages}',
                      style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade600)),
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: pagination.page > 1 ? () => controller.goToPage(pagination.page - 1) : null,
                        child: const Text('Previous'),
                      ),
                      const SizedBox(width: 12),
                      FilledButton(
                        onPressed: pagination.page < pagination.totalPages
                            ? () => controller.goToPage(pagination.page + 1)
                            : null,
                        child: const Text('Next'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (state.isLoading)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.post});

  final BlogPostModel post;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF143358), Color(0xFF1B4CF0)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (post.heroImageUrl != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Image.network(post.heroImage, fit: BoxFit.cover),
              ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(post.primaryCategory.toUpperCase(),
                        style: GoogleFonts.manrope(fontSize: 10, letterSpacing: 1.6, color: Colors.white70)),
                  ),
                  const SizedBox(height: 12),
                  Text(post.title,
                      style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 10),
                  Text(post.excerpt,
                      style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.85))),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 16, color: Colors.white70),
                      const SizedBox(width: 6),
                      Text('${post.readingTimeMinutes} min read',
                          style: GoogleFonts.inter(fontSize: 12, color: Colors.white70)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BlogCard extends StatelessWidget {
  const _BlogCard({required this.post});

  final BlogPostModel post;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: AspectRatio(
                aspectRatio: 3 / 2,
                child: Image.network(post.heroImage, fit: BoxFit.cover),
              ),
            ),
            const SizedBox(height: 16),
            Text(post.primaryCategory.toUpperCase(),
                style: GoogleFonts.manrope(fontSize: 10, letterSpacing: 1.6, color: theme.colorScheme.primary)),
            const SizedBox(height: 6),
            Text(post.title, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(post.excerpt, style: GoogleFonts.inter(fontSize: 13, color: Colors.blueGrey.shade700)),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.schedule, size: 16, color: Colors.blueGrey.shade400),
                const SizedBox(width: 6),
                Text('${post.readingTimeMinutes} min read',
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade500)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../shared/widgets/metric_card.dart';
import '../application/learning_controller.dart';
import '../domain/learning_models.dart';

class LearningHubScreen extends ConsumerStatefulWidget {
  const LearningHubScreen({super.key});

  @override
  ConsumerState<LearningHubScreen> createState() => _LearningHubScreenState();
}

class _LearningHubScreenState extends ConsumerState<LearningHubScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  ProviderSubscription<LearningDashboardState>? _errorSubscription;

  static const _tabs = [
    _LearningTab('Communities', Icons.groups_2_outlined),
    _LearningTab('Courses', Icons.play_lesson_outlined),
    _LearningTab('eBooks', Icons.auto_stories_outlined),
    _LearningTab('Tutors', Icons.support_agent_outlined),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this)
      ..addListener(() => setState(() {}));
    _errorSubscription = ref.listen<LearningDashboardState>(
      learningControllerProvider,
      (previous, next) {
        if (!mounted) return;
        final message = next.errorMessage;
        if (message != null && message != previous?.errorMessage) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(message),
                behavior: SnackBarBehavior.floating,
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
        }
      },
    );
  }

  @override
  void dispose() {
    _errorSubscription?.close();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(learningControllerProvider);
    final controller = ref.read(learningControllerProvider.notifier);
    final theme = Theme.of(context);

    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      floatingActionButton: _buildFab(controller),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(state, controller, theme),
            TabBar(
              controller: _tabController,
              isScrollable: true,
              indicatorColor: theme.colorScheme.primary,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
              tabs: [for (final tab in _tabs) Tab(text: tab.label, icon: Icon(tab.icon))],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _CommunityTab(
                    communities: state.communities,
                    onOpenForm: (existing) => _openCommunityForm(controller, existing: existing),
                    onDelete: (id) => _handleDelete(() => controller.deleteCommunity(id), 'Community removed'),
                    confirmDelete: (subject) => _confirmDelete('Delete community', subject),
                  ),
                  _CourseTab(
                    courses: state.courses,
                    onOpenForm: (existing) => _openCourseForm(controller, existing: existing),
                    onDelete: (id) => _handleDelete(() => controller.deleteCourse(id), 'Course removed'),
                    confirmDelete: (subject) => _confirmDelete('Delete course', subject),
                  ),
                  _EbookTab(
                    ebooks: state.ebooks,
                    onOpenForm: (existing) => _openEbookForm(controller, existing: existing),
                    onDelete: (id) => _handleDelete(() => controller.deleteEbook(id), 'eBook removed'),
                    confirmDelete: (subject) => _confirmDelete('Delete eBook', subject),
                  ),
                  _TutorTab(
                    tutors: state.tutors,
                    onOpenForm: (existing) => _openTutorForm(controller, existing: existing),
                    onDelete: (id) => _handleDelete(() => controller.deleteTutor(id), 'Tutor removed'),
                    confirmDelete: (subject) => _confirmDelete('Remove tutor', subject),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(LearningDashboardState state, LearningController controller, ThemeData theme) {
    final lastSynced = state.lastSynced == null
        ? 'Sync pending'
        : 'Synced ${DateFormat.yMMMd().add_jm().format(state.lastSynced!.toLocal())}';

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Learning operations hub',
            style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            'Coordinate communities, courses, digital libraries, and expert tutors with production-ready controls.',
            style: GoogleFonts.inter(fontSize: 14, height: 1.4, color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 720;
              return Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  SizedBox(
                    width: isWide ? constraints.maxWidth / 4 - 12 : constraints.maxWidth,
                    child: MetricCard(
                      label: 'Communities',
                      value: '${state.totalCommunities}',
                      icon: Icons.groups_3_outlined,
                      change: '${state.privateCommunities} private',
                      trend: 'neutral',
                    ),
                  ),
                  SizedBox(
                    width: isWide ? constraints.maxWidth / 4 - 12 : constraints.maxWidth,
                    child: MetricCard(
                      label: 'Published courses',
                      value: '${state.publishedCourses}/${state.totalCourses}',
                      icon: Icons.play_circle_outline,
                      change: '${state.totalCommunityMembers} learners enrolled',
                      trend: 'up',
                    ),
                  ),
                  SizedBox(
                    width: isWide ? constraints.maxWidth / 4 - 12 : constraints.maxWidth,
                    child: MetricCard(
                      label: 'Digital library',
                      value: '${state.totalEbooks} eBooks',
                      icon: Icons.menu_book_outlined,
                      change: '${state.totalCourses} courses linked',
                      trend: 'neutral',
                    ),
                  ),
                  SizedBox(
                    width: isWide ? constraints.maxWidth / 4 - 12 : constraints.maxWidth,
                    child: MetricCard(
                      label: 'Tutor excellence',
                      value: state.averageTutorRating.toStringAsFixed(1),
                      icon: Icons.workspace_premium_outlined,
                      change: '${state.totalTutors} active mentors',
                      trend: 'up',
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Icon(Icons.access_time, size: 18, color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: 8),
              Text(
                lastSynced,
                style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: state.isRefreshing ? null : () => controller.refresh(),
                icon: state.isRefreshing
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.refresh),
                label: const Text('Sync now'),
              ),
            ],
          ),
          if (state.isMutating)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Row(
                children: [
                  const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  const SizedBox(width: 12),
                  Text(
                    'Saving changes…',
                    style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.primary),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  FloatingActionButton? _buildFab(LearningController controller) {
    switch (_tabController.index) {
      case 0:
        return FloatingActionButton.extended(
          onPressed: () => _openCommunityForm(controller),
          icon: const Icon(Icons.add_comment),
          label: const Text('New community'),
        );
      case 1:
        return FloatingActionButton.extended(
          onPressed: () => _openCourseForm(controller),
          icon: const Icon(Icons.add_chart),
          label: const Text('New course'),
        );
      case 2:
        return FloatingActionButton.extended(
          onPressed: () => _openEbookForm(controller),
          icon: const Icon(Icons.library_add),
          label: const Text('Add eBook'),
        );
      case 3:
        return FloatingActionButton.extended(
          onPressed: () => _openTutorForm(controller),
          icon: const Icon(Icons.person_add_alt),
          label: const Text('Invite tutor'),
        );
    }
    return null;
  }

  Future<void> _handleDelete(Future<void> Function() action, String successMessage) async {
    await action();
    if (!mounted) return;
    _showToast(successMessage);
  }

  Future<bool> _confirmDelete(String title, String subject) async {
    final theme = Theme.of(context);
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title, style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
        content: Text(
          'Are you sure you want to remove "$subject"? This action cannot be undone.',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: theme.colorScheme.error),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _openCommunityForm(LearningController controller, {CommunitySpace? existing}) async {
    final draft = existing == null
        ? controller.createCommunityDraft()
        : controller.createCommunityDraft(id: existing.id).copyWith(
              name: existing.name,
              mission: existing.mission,
              members: existing.members,
              isPrivate: existing.isPrivate,
            );
    final nameController = TextEditingController(text: draft.name);
    final missionController = TextEditingController(text: draft.mission);
    final membersController = TextEditingController(text: draft.members.toString());
    var isPrivate = draft.isPrivate;
    final formKey = GlobalKey<FormState>();

    bool? confirmed;
    try {
      confirmed = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (context) {
          return _EntitySheet(
            title: existing == null ? 'Launch community' : 'Update community',
            formKey: formKey,
            onSubmit: () {
              if (!formKey.currentState!.validate()) return;
              Navigator.of(context).pop(true);
            },
            children: [
              TextFormField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Community name', prefixIcon: Icon(Icons.forum_outlined)),
                validator: _required,
              ),
              TextFormField(
                controller: missionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Mission statement',
                  prefixIcon: Icon(Icons.stars_outlined),
                ),
                validator: _required,
              ),
              TextFormField(
                controller: membersController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Member count',
                  prefixIcon: Icon(Icons.people_alt_outlined),
                ),
                validator: _positiveInt,
              ),
              StatefulBuilder(
                builder: (context, setModalState) => SwitchListTile.adaptive(
                  value: isPrivate,
                  onChanged: (value) => setModalState(() => isPrivate = value),
                  title: const Text('Private community'),
                  subtitle: const Text('Restrict discovery to invited members'),
                ),
              ),
            ],
            primaryActionLabel: existing == null ? 'Create community' : 'Save changes',
          );
        },
      );
    } finally {
      nameController.dispose();
      missionController.dispose();
      membersController.dispose();
    }

    if (confirmed != true || !mounted) return;

    await controller.upsertCommunity(
      draft.copyWith(
        name: nameController.text.trim(),
        mission: missionController.text.trim(),
        members: int.parse(membersController.text.trim()),
        isPrivate: isPrivate,
      ),
    );
    if (!mounted) return;
    _showToast(existing == null ? 'Community created' : 'Community updated');
  }

  Future<void> _openCourseForm(LearningController controller, {CourseModule? existing}) async {
    final draft = existing == null
        ? controller.createCourseDraft()
        : controller.createCourseDraft(id: existing.id).copyWith(
              title: existing.title,
              category: existing.category,
              durationMinutes: existing.durationMinutes,
              isPublished: existing.isPublished,
            );
    final titleController = TextEditingController(text: draft.title);
    final categoryController = TextEditingController(text: draft.category);
    final durationController = TextEditingController(text: draft.durationMinutes.toString());
    var isPublished = draft.isPublished;
    final formKey = GlobalKey<FormState>();

    bool? confirmed;
    try {
      confirmed = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (context) {
          return _EntitySheet(
            title: existing == null ? 'Publish course' : 'Update course',
            formKey: formKey,
            onSubmit: () {
              if (!formKey.currentState!.validate()) return;
              Navigator.of(context).pop(true);
            },
            children: [
              TextFormField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Course title', prefixIcon: Icon(Icons.menu_book_outlined)),
                validator: _required,
              ),
              TextFormField(
                controller: categoryController,
                decoration: const InputDecoration(labelText: 'Category', prefixIcon: Icon(Icons.category_outlined)),
                validator: _required,
              ),
              TextFormField(
                controller: durationController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Duration (minutes)',
                  prefixIcon: Icon(Icons.timer_outlined),
                ),
                validator: _positiveInt,
              ),
              StatefulBuilder(
                builder: (context, setModalState) => SwitchListTile.adaptive(
                  value: isPublished,
                  onChanged: (value) => setModalState(() => isPublished = value),
                  title: const Text('Published to catalog'),
                  subtitle: const Text('Visible to enrolled learners immediately'),
                ),
              ),
            ],
            primaryActionLabel: existing == null ? 'Create course' : 'Save changes',
          );
        },
      );
    } finally {
      titleController.dispose();
      categoryController.dispose();
      durationController.dispose();
    }

    if (confirmed != true || !mounted) return;

    await controller.upsertCourse(
      draft.copyWith(
        title: titleController.text.trim(),
        category: categoryController.text.trim(),
        durationMinutes: int.parse(durationController.text.trim()),
        isPublished: isPublished,
      ),
    );
    if (!mounted) return;
    _showToast(existing == null ? 'Course created' : 'Course updated');
  }

  Future<void> _openEbookForm(LearningController controller, {EbookResource? existing}) async {
    final draft = existing == null
        ? controller.createEbookDraft()
        : controller.createEbookDraft(id: existing.id).copyWith(
              title: existing.title,
              author: existing.author,
              topic: existing.topic,
            );
    final titleController = TextEditingController(text: draft.title);
    final authorController = TextEditingController(text: draft.author);
    final topicController = TextEditingController(text: draft.topic);
    final formKey = GlobalKey<FormState>();

    bool? confirmed;
    try {
      confirmed = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (context) {
          return _EntitySheet(
            title: existing == null ? 'Add eBook' : 'Update eBook',
            formKey: formKey,
            onSubmit: () {
              if (!formKey.currentState!.validate()) return;
              Navigator.of(context).pop(true);
            },
            children: [
              TextFormField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Title', prefixIcon: Icon(Icons.auto_stories_outlined)),
                validator: _required,
              ),
              TextFormField(
                controller: authorController,
                decoration: const InputDecoration(labelText: 'Author', prefixIcon: Icon(Icons.person_outline)),
                validator: _required,
              ),
              TextFormField(
                controller: topicController,
                decoration: const InputDecoration(labelText: 'Topic', prefixIcon: Icon(Icons.topic_outlined)),
                validator: _required,
              ),
            ],
            primaryActionLabel: existing == null ? 'Add eBook' : 'Save changes',
          );
        },
      );
    } finally {
      titleController.dispose();
      authorController.dispose();
      topicController.dispose();
    }

    if (confirmed != true || !mounted) return;

    await controller.upsertEbook(
      draft.copyWith(
        title: titleController.text.trim(),
        author: authorController.text.trim(),
        topic: topicController.text.trim(),
      ),
    );
    if (!mounted) return;
    _showToast(existing == null ? 'eBook added' : 'eBook updated');
  }

  Future<void> _openTutorForm(LearningController controller, {TutorProfile? existing}) async {
    final draft = existing == null
        ? controller.createTutorDraft()
        : controller.createTutorDraft(id: existing.id).copyWith(
              name: existing.name,
              speciality: existing.speciality,
              rating: existing.rating,
              languages: existing.languages,
            );
    final nameController = TextEditingController(text: draft.name);
    final specialityController = TextEditingController(text: draft.speciality);
    final ratingController = TextEditingController(text: draft.rating.toStringAsFixed(1));
    final languagesController = TextEditingController(text: draft.languages.join(', '));
    final formKey = GlobalKey<FormState>();

    bool? confirmed;
    try {
      confirmed = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (context) {
          return _EntitySheet(
            title: existing == null ? 'Invite tutor' : 'Update tutor',
            formKey: formKey,
            onSubmit: () {
              if (!formKey.currentState!.validate()) return;
              Navigator.of(context).pop(true);
            },
            children: [
              TextFormField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Name', prefixIcon: Icon(Icons.person_outline)),
                validator: _required,
              ),
              TextFormField(
                controller: specialityController,
                decoration: const InputDecoration(labelText: 'Speciality', prefixIcon: Icon(Icons.engineering_outlined)),
                validator: _required,
              ),
              TextFormField(
                controller: ratingController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Rating (0-5)', prefixIcon: Icon(Icons.star_outline)),
                validator: (value) {
                  final parsed = double.tryParse(value?.trim() ?? '');
                  if (parsed == null || parsed < 0 || parsed > 5) {
                    return 'Enter a rating between 0 and 5';
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: languagesController,
                decoration: const InputDecoration(
                  labelText: 'Languages (comma separated)',
                  prefixIcon: Icon(Icons.language_outlined),
                ),
                validator: _required,
              ),
            ],
            primaryActionLabel: existing == null ? 'Invite tutor' : 'Save changes',
          );
        },
      );
    } finally {
      nameController.dispose();
      specialityController.dispose();
      ratingController.dispose();
      languagesController.dispose();
    }

    if (confirmed != true || !mounted) return;

    await controller.upsertTutor(
      draft.copyWith(
        name: nameController.text.trim(),
        speciality: specialityController.text.trim(),
        rating: double.parse(ratingController.text.trim()),
        languages: languagesController.text
            .split(',')
            .map((token) => token.trim())
            .where((token) => token.isNotEmpty)
            .toList(growable: false),
      ),
    );
    if (!mounted) return;
    _showToast(existing == null ? 'Tutor invited' : 'Tutor updated');
  }

  void _showToast(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }
}

class _LearningTab {
  const _LearningTab(this.label, this.icon);

  final String label;
  final IconData icon;
}

class _CommunityTab extends StatefulWidget {
  const _CommunityTab({
    required this.communities,
    required this.onOpenForm,
    required this.onDelete,
    required this.confirmDelete,
  });

  final List<CommunitySpace> communities;
  final Future<void> Function([CommunitySpace? existing]) onOpenForm;
  final Future<void> Function(String id) onDelete;
  final Future<bool> Function(String subject) confirmDelete;

  @override
  State<_CommunityTab> createState() => _CommunityTabState();
}

class _CommunityTabState extends State<_CommunityTab> {
  final TextEditingController _searchController = TextEditingController();
  bool _showPrivateOnly = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final filtered = widget.communities.where((community) {
      final matchesQuery = query.isEmpty ||
          community.name.toLowerCase().contains(query) ||
          community.mission.toLowerCase().contains(query);
      final matchesPrivacy = !_showPrivateOnly || community.isPrivate;
      return matchesQuery && matchesPrivacy;
    }).toList();

    if (widget.communities.isEmpty) {
      return _EmptyState(
        icon: Icons.groups_2_outlined,
        headline: 'Create your first community',
        body: 'Engage customers and technicians in curated collaboration hubs.',
        actionLabel: 'Launch community',
        onAction: () => widget.onOpenForm(),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
      children: [
        _TabSearchBar(
          controller: _searchController,
          hintText: 'Search communities…',
          onChanged: (_) => setState(() {}),
          trailing: FilterChip(
            label: const Text('Private only'),
            selected: _showPrivateOnly,
            onSelected: (value) => setState(() => _showPrivateOnly = value),
          ),
        ),
        if (filtered.isEmpty)
          _EmptyResults(
            headline: 'No communities match',
            description: 'Try adjusting the privacy filter or search keywords.',
            onReset: () {
              setState(() {
                _searchController.clear();
                _showPrivateOnly = false;
              });
            },
          )
        else
          ...filtered.map(
            (community) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                            foregroundColor: Theme.of(context).colorScheme.primary,
                            child: const Icon(Icons.hub),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  community.name,
                                  style:
                                      GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  community.mission,
                                  style: GoogleFonts.inter(fontSize: 13, height: 1.4, color: Colors.blueGrey.shade700),
                                ),
                              ],
                            ),
                          ),
                          PopupMenuButton<String>(
                            onSelected: (value) async {
                              if (value == 'edit') {
                                await widget.onOpenForm(community);
                              } else if (value == 'delete') {
                                final confirmed = await widget.confirmDelete(community.name);
                                if (confirmed) {
                                  await widget.onDelete(community.id);
                                }
                              }
                            },
                            itemBuilder: (_) => const [
                              PopupMenuItem(value: 'edit', child: Text('Edit')),
                              PopupMenuItem(value: 'delete', child: Text('Delete')),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12,
                        runSpacing: 8,
                        children: [
                          _DetailChip(icon: Icons.people_outline, label: '${community.members} members'),
                          _DetailChip(
                            icon: community.isPrivate ? Icons.lock_outline : Icons.public,
                            label: community.isPrivate ? 'Private access' : 'Open access',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _CourseTab extends StatefulWidget {
  const _CourseTab({
    required this.courses,
    required this.onOpenForm,
    required this.onDelete,
    required this.confirmDelete,
  });

  final List<CourseModule> courses;
  final Future<void> Function([CourseModule? existing]) onOpenForm;
  final Future<void> Function(String id) onDelete;
  final Future<bool> Function(String subject) confirmDelete;

  @override
  State<_CourseTab> createState() => _CourseTabState();
}

class _CourseTabState extends State<_CourseTab> {
  final TextEditingController _searchController = TextEditingController();
  CourseFilter _filter = CourseFilter.all;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final filtered = widget.courses.where((course) {
      final matchesQuery = query.isEmpty ||
          course.title.toLowerCase().contains(query) ||
          course.category.toLowerCase().contains(query);
      final matchesFilter = switch (_filter) {
        CourseFilter.all => true,
        CourseFilter.published => course.isPublished,
        CourseFilter.draft => !course.isPublished,
      };
      return matchesQuery && matchesFilter;
    }).toList();

    if (widget.courses.isEmpty) {
      return _EmptyState(
        icon: Icons.play_lesson_outlined,
        headline: 'No courses yet',
        body: 'Launch blended learning programs with media-rich modules.',
        actionLabel: 'Create course',
        onAction: () => widget.onOpenForm(),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
      children: [
        _TabSearchBar(
          controller: _searchController,
          hintText: 'Search courses…',
          onChanged: (_) => setState(() {}),
          trailing: SegmentedButton<CourseFilter>(
            segments: const [
              ButtonSegment(value: CourseFilter.all, label: Text('All')),
              ButtonSegment(value: CourseFilter.published, label: Text('Published')),
              ButtonSegment(value: CourseFilter.draft, label: Text('Drafts')),
            ],
            selected: <CourseFilter>{_filter},
            onSelectionChanged: (selection) => setState(() => _filter = selection.first),
          ),
        ),
        if (filtered.isEmpty)
          _EmptyResults(
            headline: 'No courses match',
            description: 'Update the filters or keywords to discover saved courses.',
            onReset: () {
              setState(() {
                _searchController.clear();
                _filter = CourseFilter.all;
              });
            },
          )
        else
          ...filtered.map(
            (course) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                    foregroundColor: Theme.of(context).colorScheme.secondary,
                    child: const Icon(Icons.menu_book),
                  ),
                  title: Text(course.title, style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${course.durationMinutes} minutes • ${course.category}',
                          style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade600),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 8,
                          children: [
                            Chip(
                              label: Text(course.isPublished ? 'Published' : 'Draft'),
                              avatar: Icon(
                                course.isPublished ? Icons.check_circle : Icons.pending,
                                size: 16,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (value) async {
                      if (value == 'edit') {
                        await widget.onOpenForm(course);
                      } else if (value == 'delete') {
                        final confirmed = await widget.confirmDelete(course.title);
                        if (confirmed) {
                          await widget.onDelete(course.id);
                        }
                      }
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(value: 'edit', child: Text('Edit')),
                      PopupMenuItem(value: 'delete', child: Text('Delete')),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

enum CourseFilter { all, published, draft }

class _EbookTab extends StatefulWidget {
  const _EbookTab({
    required this.ebooks,
    required this.onOpenForm,
    required this.onDelete,
    required this.confirmDelete,
  });

  final List<EbookResource> ebooks;
  final Future<void> Function([EbookResource? existing]) onOpenForm;
  final Future<void> Function(String id) onDelete;
  final Future<bool> Function(String subject) confirmDelete;

  @override
  State<_EbookTab> createState() => _EbookTabState();
}

class _EbookTabState extends State<_EbookTab> {
  final TextEditingController _searchController = TextEditingController();
  String? _topicFilter;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final topics = widget.ebooks.map((ebook) => ebook.topic).toSet().toList()..sort();
    final filtered = widget.ebooks.where((ebook) {
      final matchesQuery = query.isEmpty ||
          ebook.title.toLowerCase().contains(query) ||
          ebook.author.toLowerCase().contains(query) ||
          ebook.topic.toLowerCase().contains(query);
      final matchesTopic = _topicFilter == null || ebook.topic == _topicFilter;
      return matchesQuery && matchesTopic;
    }).toList();

    if (widget.ebooks.isEmpty) {
      return _EmptyState(
        icon: Icons.auto_stories_outlined,
        headline: 'Build your digital library',
        body: 'Upload operational playbooks, product manuals, and onboarding kits.',
        actionLabel: 'Add eBook',
        onAction: () => widget.onOpenForm(),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
      children: [
        _TabSearchBar(
          controller: _searchController,
          hintText: 'Search eBooks…',
          onChanged: (_) => setState(() {}),
          trailing: DropdownButton<String?>(
            value: _topicFilter,
            onChanged: (value) => setState(() => _topicFilter = value),
            hint: const Text('Topic'),
            items: [
              const DropdownMenuItem<String?>(value: null, child: Text('All topics')),
              ...topics.map((topic) => DropdownMenuItem<String?>(value: topic, child: Text(topic))),
            ],
          ),
        ),
        if (filtered.isEmpty)
          _EmptyResults(
            headline: 'No eBooks match',
            description: 'Reset filters or upload a new resource to get started.',
            onReset: () {
              setState(() {
                _topicFilter = null;
                _searchController.clear();
              });
            },
          )
        else
          ...filtered.map(
            (ebook) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).colorScheme.tertiaryContainer,
                    foregroundColor: Theme.of(context).colorScheme.tertiary,
                    child: const Icon(Icons.menu_book_outlined),
                  ),
                  title: Text(ebook.title, style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('by ${ebook.author}',
                            style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade600)),
                        const SizedBox(height: 4),
                        Chip(
                          avatar: const Icon(Icons.category_outlined, size: 16),
                          label: Text(ebook.topic),
                        ),
                      ],
                    ),
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (value) async {
                      if (value == 'edit') {
                        await widget.onOpenForm(ebook);
                      } else if (value == 'delete') {
                        final confirmed = await widget.confirmDelete(ebook.title);
                        if (confirmed) {
                          await widget.onDelete(ebook.id);
                        }
                      }
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(value: 'edit', child: Text('Edit')),
                      PopupMenuItem(value: 'delete', child: Text('Delete')),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _TutorTab extends StatefulWidget {
  const _TutorTab({
    required this.tutors,
    required this.onOpenForm,
    required this.onDelete,
    required this.confirmDelete,
  });

  final List<TutorProfile> tutors;
  final Future<void> Function([TutorProfile? existing]) onOpenForm;
  final Future<void> Function(String id) onDelete;
  final Future<bool> Function(String subject) confirmDelete;

  @override
  State<_TutorTab> createState() => _TutorTabState();
}

class _TutorTabState extends State<_TutorTab> {
  final TextEditingController _searchController = TextEditingController();
  double _minRating = 0;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final filtered = widget.tutors.where((tutor) {
      final matchesQuery = query.isEmpty ||
          tutor.name.toLowerCase().contains(query) ||
          tutor.speciality.toLowerCase().contains(query);
      final matchesRating = tutor.rating >= _minRating;
      return matchesQuery && matchesRating;
    }).toList();

    if (widget.tutors.isEmpty) {
      return _EmptyState(
        icon: Icons.support_agent_outlined,
        headline: 'Recruit your first tutor',
        body: 'Invite subject matter experts to mentor learners on demand.',
        actionLabel: 'Invite tutor',
        onAction: () => widget.onOpenForm(),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
      children: [
        _TabSearchBar(
          controller: _searchController,
          hintText: 'Search tutors…',
          onChanged: (_) => setState(() {}),
          trailing: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Min rating: ${_minRating.toStringAsFixed(1)}'),
              Slider(
                value: _minRating,
                min: 0,
                max: 5,
                divisions: 10,
                label: _minRating.toStringAsFixed(1),
                onChanged: (value) => setState(() => _minRating = value),
              ),
            ],
          ),
        ),
        if (filtered.isEmpty)
          _EmptyResults(
            headline: 'No tutors match',
            description: 'Lower the rating filter or broaden your search keywords.',
            onReset: () {
              setState(() {
                _searchController.clear();
                _minRating = 0;
              });
            },
          )
        else
          ...filtered.map(
            (tutor) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                            foregroundColor: Theme.of(context).colorScheme.secondary,
                            child: Text(tutor.name.substring(0, 1).toUpperCase()),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tutor.name,
                                  style:
                                      GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  tutor.speciality,
                                  style: GoogleFonts.inter(fontSize: 13, color: Colors.blueGrey.shade600),
                                ),
                              ],
                            ),
                          ),
                          PopupMenuButton<String>(
                            onSelected: (value) async {
                              if (value == 'edit') {
                                await widget.onOpenForm(tutor);
                              } else if (value == 'delete') {
                                final confirmed = await widget.confirmDelete(tutor.name);
                                if (confirmed) {
                                  await widget.onDelete(tutor.id);
                                }
                              }
                            },
                            itemBuilder: (_) => const [
                              PopupMenuItem(value: 'edit', child: Text('Edit')),
                              PopupMenuItem(value: 'delete', child: Text('Delete')),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12,
                        runSpacing: 8,
                        children: [
                          Chip(
                            avatar: const Icon(Icons.star, size: 16),
                            label: Text(tutor.rating.toStringAsFixed(1)),
                          ),
                          ...tutor.languages.map(
                            (language) => Chip(
                              avatar: const Icon(Icons.language, size: 16),
                              label: Text(language),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _TabSearchBar extends StatelessWidget {
  const _TabSearchBar({
    required this.controller,
    required this.hintText,
    this.trailing,
    this.onChanged,
  });

  final TextEditingController controller;
  final String hintText;
  final Widget? trailing;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: hintText,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onChanged: onChanged,
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 12),
            Flexible(child: trailing!),
          ],
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.headline,
    required this.body,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String headline;
  final String body;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 24),
            Text(headline, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              body,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.add_circle_outline),
              label: Text(actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults({
    required this.headline,
    required this.description,
    required this.onReset,
  });

  final String headline;
  final String description;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Text(headline, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onReset,
            icon: const Icon(Icons.refresh),
            label: const Text('Reset filters'),
          ),
        ],
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  const _DetailChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
    );
  }
}

class _EntitySheet extends StatelessWidget {
  const _EntitySheet({
    required this.title,
    required this.formKey,
    required this.children,
    required this.primaryActionLabel,
    required this.onSubmit,
  });

  final String title;
  final GlobalKey<FormState> formKey;
  final List<Widget> children;
  final String primaryActionLabel;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).maybePop(false),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...children.map((widget) => Padding(padding: const EdgeInsets.only(bottom: 16), child: widget)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: onSubmit,
                    child: Text(primaryActionLabel),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

String? _required(String? value) {
  if (value == null || value.trim().isEmpty) {
    return 'This field is required';
  }
  return null;
}

String? _positiveInt(String? value) {
  final parsed = int.tryParse(value ?? '');
  if (parsed == null || parsed <= 0) {
    return 'Enter a value greater than 0';
  }
  return null;
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../calendar/application/calendar_controller.dart';
import '../../calendar/domain/calendar_models.dart';
import '../domain/profile_models.dart';
import 'profile_controller.dart';

class ProfileViewScreen extends ConsumerWidget {
  const ProfileViewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(profileControllerProvider);
    final controller = ref.read(profileControllerProvider.notifier);
    final theme = Theme.of(context);

    final profile = state.profile;
    final draft = state.draft;

    if (state.isLoading && profile == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (profile == null || draft == null) {
      return Center(
        child: Text('Profile unavailable', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w600)),
      );
    }

    return RefreshIndicator(
      onRefresh: () => controller.refresh(bypassCache: true),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _ProfileHero(profile: profile),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _ProfileActions(profile: profile, draft: draft),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _ServicePortfolioSection(profile: profile),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _CapabilitySection(profile: profile, draft: draft),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _AvailabilitySection(profile: profile, draft: draft),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
            sliver: SliverToBoxAdapter(
              child: _CalendarCta(profile: profile),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({required this.profile});

  final ProfileSnapshot profile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final headline = profile.identity.headline;
    final tagline = profile.identity.tagline;
    final formatter = NumberFormat.compact();

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [theme.colorScheme.primary, theme.colorScheme.primary.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(36),
          bottomRight: Radius.circular(36),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 48, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: Colors.white.withOpacity(0.15),
                child: Text(
                  profile.identity.displayName.characters.first,
                  style: GoogleFonts.manrope(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.identity.displayName,
                      style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(headline, style: GoogleFonts.inter(fontSize: 14, color: Colors.white70)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: profile.identity.badges
                          .map((badge) => Chip(
                                label: Text(badge, style: GoogleFonts.inter(fontSize: 11, color: Colors.white)),
                                backgroundColor: Colors.white.withOpacity(0.16),
                              ))
                          .toList(),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(tagline, style: GoogleFonts.inter(fontSize: 14, color: Colors.white70, height: 1.6)),
          const SizedBox(height: 18),
          Row(
            children: [
              _HeroMetric(label: 'Regions', value: profile.identity.serviceRegions.length.toString()),
              const SizedBox(width: 16),
              _HeroMetric(label: 'Services', value: profile.services.length.toString()),
              const SizedBox(width: 16),
              _HeroMetric(label: 'Clients', value: formatter.format(128)),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroMetric extends StatelessWidget {
  const _HeroMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
        const SizedBox(height: 4),
        Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, color: Colors.white70)),
      ],
    );
  }
}

class _ProfileActions extends ConsumerWidget {
  const _ProfileActions({required this.profile, required this.draft});

  final ProfileSnapshot profile;
  final ProfileDraft draft;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final calendarController = ref.read(calendarControllerProvider.notifier);
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    Future<void> scheduleDiscoveryCall() async {
      final draftEvent = calendarController.createDraft();
      final event = draftEvent.copyWith(
        title: 'Discovery call • ${profile.identity.displayName}',
        description:
            'Mobilise Fixnado concierge and align onboarding scope for ${profile.identity.displayName}.',
        attendees: [profile.identity.supportEmail, ...draft.serviceRegions.map((region) => 'ops@$region.fixnado.com')],
      );
      await calendarController.saveEvent(event);
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('Discovery call scheduled for ${DateFormat.yMMMd().add_jm().format(event.start)}'),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Connect', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _ActionButton(
                      icon: Icons.mail_outline,
                      label: 'Email support',
                      onTap: () => _copyToClipboard(
                        context,
                        profile.identity.supportEmail,
                        message: 'Support email copied',
                      ),
                    ),
                    if (profile.identity.supportPhone != null)
                      _ActionButton(
                        icon: Icons.call_outlined,
                        label: 'Call team',
                        onTap: () => _copyToClipboard(
                          context,
                          profile.identity.supportPhone!,
                          message: 'Support phone copied',
                        ),
                      ),
                    _ActionButton(
                      icon: Icons.public_outlined,
                      label: 'Share profile',
                      onTap: () => _copyToClipboard(
                        context,
                        'https://fixnado.com/providers/${profile.identity.displayName.toLowerCase().replaceAll(' ', '-')}',
                        message: 'Profile link copied',
                      ),
                    ),
                    _ActionButton(
                      icon: Icons.calendar_today_outlined,
                      label: 'Discovery call',
                      onTap: scheduleDiscoveryCall,
                    ),
                    _ActionButton(
                      icon: Icons.request_quote_outlined,
                      label: 'Request quote',
                      onTap: () => _openQuoteSheet(context, profile, calendarController),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(24),
          ),
          padding: const EdgeInsets.all(20),
          child: Text(
            profile.identity.bio,
            style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onSurfaceVariant, height: 1.5),
          ),
        ),
      ],
    );
  }

  Future<void> _copyToClipboard(BuildContext context, String value, {required String message}) async {
    await Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _openQuoteSheet(
    BuildContext context,
    ProfileSnapshot profile,
    CalendarController calendarController,
  ) async {
    final theme = Theme.of(context);
    final projectController = TextEditingController();
    final budgetController = TextEditingController();
    final notesController = TextEditingController();

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      builder: (context) {
        final bottomInset = MediaQuery.of(context).viewInsets.bottom;
        return Padding(
          padding: EdgeInsets.only(bottom: bottomInset),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Request mobilisation quote',
                    style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Text(
                  'Provide a short description so operations can scope the deployment and return pricing to you.',
                  style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: projectController,
                  decoration: const InputDecoration(labelText: 'Project name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: budgetController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Estimated budget (£)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(labelText: 'Operational notes'),
                  maxLines: 4,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () => Navigator.of(context).pop(true),
                  icon: const Icon(Icons.send_outlined),
                  label: const Text('Submit request'),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (result == true) {
      final draftEvent = calendarController.createDraft();
      final event = draftEvent.copyWith(
        title: 'Quote review • ${profile.identity.displayName}',
        description: 'Project: ${projectController.text.trim()} • ${notesController.text.trim()}',
        attendees: [profile.identity.supportEmail, 'sales@fixnado.com'],
        notes: 'Budget hint: ${budgetController.text.trim()}',
      );
      await calendarController.saveEvent(event);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Quote request submitted. Calendar entry created.')));
      }
    }
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: theme.colorScheme.surfaceVariant,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _ServicePortfolioSection extends StatelessWidget {
  const _ServicePortfolioSection({required this.profile});

  final ProfileSnapshot profile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currencyCode = profile.services.isNotEmpty ? profile.services.first.currency ?? 'GBP' : 'GBP';
    final currency = NumberFormat.simpleCurrency(name: currencyCode);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Service portfolio', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        ...profile.services.map(
          (service) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(service.name,
                              style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                        ),
                        if (service.price != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              '${currency.format(service.price)}',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(service.description,
                        style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        _Tag(icon: Icons.schedule, label: service.availabilityLabel),
                        _Tag(icon: Icons.map_outlined, label: service.coverage.join(', ')),
                        ...service.tags.take(3).map((tag) => _Tag(icon: Icons.tag, label: tag)),
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

class _CapabilitySection extends StatelessWidget {
  const _CapabilitySection({required this.profile, required this.draft});

  final ProfileSnapshot profile;
  final ProfileDraft draft;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Languages & compliance', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Languages', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: draft.languages
                      .map((language) => Chip(
                            avatar: const Icon(Icons.language, size: 16),
                            label: Text('${language.locale} • ${language.proficiency}',
                                style: GoogleFonts.inter(fontSize: 12)),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 16),
                Text('Compliance', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                ...draft.compliance.map(
                  (doc) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.verified_user_outlined, color: theme.colorScheme.primary),
                    title: Text(doc.name, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      doc.expiry != null
                          ? 'Valid until ${DateFormat.yMMMMd().format(doc.expiry!.toLocal())}'
                          : 'No expiry',
                    ),
                    trailing: Text(doc.status.toUpperCase(), style: GoogleFonts.inter(fontSize: 11)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _AvailabilitySection extends StatelessWidget {
  const _AvailabilitySection({required this.profile, required this.draft});

  final ProfileSnapshot profile;
  final ProfileDraft draft;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Availability blueprint', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: draft.availability
                      .map((slot) => Chip(
                            avatar: const Icon(Icons.event_available_outlined, size: 16),
                            label: Text('${slot.window} • ${slot.time}', style: GoogleFonts.inter(fontSize: 12)),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 16),
                ...profile.workflow.map(
                  (step) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
                      child: Text(step.stage.characters.first,
                          style: GoogleFonts.manrope(fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                    ),
                    title: Text(step.stage, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    subtitle: Text(step.detail, style: GoogleFonts.inter()),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CalendarCta extends ConsumerWidget {
  const _CalendarCta({required this.profile});

  final ProfileSnapshot profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final calendarController = ref.read(calendarControllerProvider.notifier);

    Future<void> createSiteSurvey() async {
      final draft = calendarController.createDraft();
      final event = draft.copyWith(
        title: 'Site survey • ${profile.identity.displayName}',
        description: 'Capture ground truth for ${profile.identity.displayName} service readiness.',
        location: profile.identity.serviceRegions.isEmpty
            ? 'To be confirmed'
            : profile.identity.serviceRegions.first,
        attendees: [profile.identity.supportEmail, 'survey@fixnado.com'],
        status: CalendarEventStatus.confirmed,
      );
      await calendarController.saveEvent(event);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Site survey scheduled in calendar.')));
      }
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [theme.colorScheme.primary.withOpacity(0.08), theme.colorScheme.secondary.withOpacity(0.08)],
        ),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mobilise field survey', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            'Create a calendar entry with one tap and keep command, compliance and client teams aligned.',
            style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant, height: 1.5),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: createSiteSurvey,
            icon: const Icon(Icons.add_task_outlined),
            label: const Text('Schedule site survey'),
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: theme.colorScheme.surfaceVariant,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12)),
        ],
      ),
    );
  }
}

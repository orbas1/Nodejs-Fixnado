import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../about/presentation/about_screen.dart';
import '../../auth/domain/role_scope.dart';
import '../../communications/presentation/communications_screen.dart';
import '../../storefront/presentation/storefront_screen.dart';
import '../domain/profile_models.dart';
import 'profile_controller.dart';
import '../../legal/presentation/legal_terms_screen.dart';
import '../../legal/application/legal_terms_loader.dart';
import '../../legal/domain/legal_terms_models.dart';
import '../../compliance/presentation/privacy_policy_screen.dart';
import '../../compliance/presentation/data_requests_controller.dart';
import '../../compliance/presentation/data_requests_screen.dart';

class ProfileManagementScreen extends ConsumerStatefulWidget {
  const ProfileManagementScreen({super.key});

  @override
  ConsumerState<ProfileManagementScreen> createState() => _ProfileManagementScreenState();
}

class _ProfileManagementScreenState extends ConsumerState<ProfileManagementScreen> {
  late final TextEditingController _displayNameController;
  late final TextEditingController _headlineController;
  late final TextEditingController _taglineController;
  late final TextEditingController _bioController;
  late final TextEditingController _supportEmailController;
  late final TextEditingController _supportPhoneController;
  late final TextEditingController _regionsController;
  late final ProviderSubscription<ProfileViewState> _subscription;

  @override
  void initState() {
    super.initState();
    final controller = ref.read(profileControllerProvider.notifier);
    _displayNameController = TextEditingController()
      ..addListener(() => controller.updateIdentity(displayName: _displayNameController.text.trim()));
    _headlineController = TextEditingController()
      ..addListener(() => controller.updateIdentity(headline: _headlineController.text.trim()));
    _taglineController = TextEditingController()
      ..addListener(() => controller.updateIdentity(tagline: _taglineController.text.trim()));
    _bioController = TextEditingController()
      ..addListener(() => controller.updateIdentity(bio: _bioController.text));
    _supportEmailController = TextEditingController()
      ..addListener(() => controller.updateIdentity(supportEmail: _supportEmailController.text.trim()));
    _supportPhoneController = TextEditingController()
      ..addListener(() => controller.updateIdentity(supportPhone: _supportPhoneController.text.trim()));
    _regionsController = TextEditingController()
      ..addListener(() {
        final values = _regionsController.text
            .split(',')
            .map((value) => value.trim())
            .where((value) => value.isNotEmpty)
            .toList();
        controller.updateIdentity(serviceRegions: values);
      });

    _subscription = ref.listen<ProfileViewState>(profileControllerProvider, (previous, next) {
      if (previous?.isSaving == true && next.isSaving == false && next.errorMessage == null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Profile updated successfully'),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _subscription.close();
    _displayNameController.dispose();
    _headlineController.dispose();
    _taglineController.dispose();
    _bioController.dispose();
    _supportEmailController.dispose();
    _supportPhoneController.dispose();
    _regionsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(profileControllerProvider);
    final controller = ref.read(profileControllerProvider.notifier);
    final role = ref.watch(currentRoleProvider);

    final draft = state.draft;
    if (draft != null) {
      _syncController(_displayNameController, draft.displayName);
      _syncController(_headlineController, draft.headline);
      _syncController(_taglineController, draft.tagline);
      _syncController(_bioController, draft.bio);
      _syncController(_supportEmailController, draft.supportEmail);
      _syncController(_supportPhoneController, draft.supportPhone ?? '');
      _syncController(_regionsController, draft.serviceRegions.join(', '));
    }

    if (state.isLoading && draft == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final profile = state.profile;

    return RefreshIndicator(
      onRefresh: () => controller.refresh(bypassCache: true),
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Profile management', style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(
                    'Align mobile profile settings with the Fixnado web experience.',
                    style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      if (state.lastUpdated != null)
                        Text(
                          'Last synced ${DateFormat.yMMMd().add_jm().format(state.lastUpdated!.toLocal())}',
                          style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      const Spacer(),
                      Chip(
                        label: Text(role.displayName, style: GoogleFonts.inter(fontSize: 12)),
                        avatar: const Icon(Icons.person_outline, size: 16),
                      ),
                    ],
                  ),
                  if (state.offline)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.offline_bolt, color: Colors.orange.shade900),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Showing cached profile snapshot. Updates will sync once connectivity resumes.',
                                style: GoogleFonts.inter(fontSize: 14, color: Colors.orange.shade900),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (state.errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Text(
                        state.errorMessage!,
                        style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (profile?.affiliate != null)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              sliver: SliverToBoxAdapter(
                child: AffiliateProgrammeCard(snapshot: profile!.affiliate!),
              ),
            ),
          if (draft != null && profile != null) ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Company & trust',
                  subtitle: 'Access Fixnado mission, trust centre, and readiness updates.',
                  child: Column(
                    children: [
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          radius: 22,
                          backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.08),
                          child: Icon(Icons.flag_outlined, color: Theme.of(context).colorScheme.primary),
                        ),
                        title: Text('About Fixnado', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          'Mission, leadership, and global operations readiness.',
                          style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const AboutScreen()),
                        ),
                      ),
                      const Divider(height: 24),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          radius: 22,
                          backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.08),
                          child: Icon(Icons.support_agent_outlined, color: Theme.of(context).colorScheme.primary),
                        ),
                        title: Text('Schedule readiness review', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          'Coordinate with our command centre for enterprise launch checks.',
                          style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const CommunicationsScreen()),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Brand identity',
                  subtitle: 'Control hero messaging, bio, and service regions presented to enterprise buyers.',
                  child: Column(
                    children: [
                      TextField(
                        controller: _displayNameController,
                        decoration: const InputDecoration(labelText: 'Display name'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _headlineController,
                        decoration: const InputDecoration(labelText: 'Headline'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _taglineController,
                        decoration: const InputDecoration(labelText: 'Tagline'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _bioController,
                        decoration: const InputDecoration(labelText: 'Bio'),
                        maxLines: 4,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _regionsController,
                        decoration: const InputDecoration(labelText: 'Service regions (comma separated)'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Contact & concierge',
                  subtitle: 'Configure support channels and showcase operational trust badges.',
                  child: Column(
                    children: [
                      TextField(
                        controller: _supportEmailController,
                        decoration: const InputDecoration(labelText: 'Support email'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _supportPhoneController,
                        decoration: const InputDecoration(labelText: 'Support phone'),
                      ),
                      const SizedBox(height: 16),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text('Hero badges', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: profile.badgeLibrary
                            .map(
                              (badge) => FilterChip(
                                label: Text(badge),
                                selected: draft.badges.contains(badge),
                                onSelected: (_) => controller.toggleBadge(badge),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Service positioning',
                  subtitle: 'Highlight the capabilities that should surface on marketplace and shareable profile links.',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: profile.serviceTagLibrary
                            .map(
                              (tag) => ChoiceChip(
                                label: Text(tag),
                                selected: draft.serviceTags.contains(tag),
                                onSelected: (_) => controller.toggleServiceTag(tag),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 16),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text('Catalogue focus', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 12),
                      _ServiceCatalogueList(services: profile.services),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Languages & compliance',
                  subtitle: 'Publish localisation coverage and current regulatory artefacts.',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Languages', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: profile.languageLibrary
                            .map(
                              (language) => FilterChip(
                                label: Text(language.locale),
                                selected: draft.languages.any((selected) => selected.locale == language.locale),
                                onSelected: (_) => controller.toggleLanguage(language.locale),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 12),
                      ...draft.languages.map(
                        (language) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(language.locale, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                          subtitle: Text('${language.proficiency} • ${language.coverage}', style: GoogleFonts.inter()),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Compliance documents', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: profile.complianceLibrary
                            .map(
                              (doc) => FilterChip(
                                label: Text(doc.name),
                                selected: draft.compliance.any((selected) => selected.name == doc.name),
                                onSelected: (_) => controller.toggleCompliance(doc.name),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 12),
                      ...draft.compliance.map((doc) {
                        final expiryLabel = doc.expiry != null
                            ? DateFormat.yMMM().format(doc.expiry!)
                            : 'No expiry recorded';
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(doc.name, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                          subtitle: Text('${doc.status} • $expiryLabel', style: GoogleFonts.inter()),
                        );
                      }).toList(),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Legal & privacy center',
                  subtitle: 'Review platform policies, request signed documentation, and track privacy escalations.',
                  child: Column(
                    children: [
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
                          foregroundColor: Theme.of(context).colorScheme.primary,
                          child: const Icon(Icons.privacy_tip_outlined),
                        ),
                        title: Text('Privacy policy', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          'Access the full Fixnado privacy posture covering web and mobile with region-specific supplements.',
                          style: GoogleFonts.inter(fontSize: 13),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const PrivacyPolicyScreen(),
                          ),
                        ),
                      ),
                      const Divider(height: 32),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                          foregroundColor: Theme.of(context).colorScheme.onSecondaryContainer,
                          child: const Icon(Icons.description_outlined),
                        ),
                        title: Text('Request DPA / SCC pack', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          'Launch a guided workflow to request signed data processing addenda, SCC copies, or privacy attestations.',
                          style: GoogleFonts.inter(fontSize: 13),
                        ),
                        trailing: const Icon(Icons.support_agent_outlined),
                        onTap: _showPrivacyContacts,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Availability & workflow',
                  subtitle: 'Set scheduling windows and surface your engagement blueprint.',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Availability windows', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: profile.availabilityLibrary
                            .map(
                              (slot) => FilterChip(
                                label: Text(slot.window),
                                selected: draft.availability.any((selected) => selected.window == slot.window),
                                onSelected: (_) => controller.toggleAvailability(slot.window),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 12),
                      ...draft.availability.map(
                        (slot) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text('${slot.window} • ${slot.time}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                          subtitle: Text(slot.notes, style: GoogleFonts.inter()),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Engagement blueprint', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      ...profile.workflow.map(
                        (step) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            radius: 18,
                            backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.08),
                            child: Text(
                              step.stage[0],
                              style: GoogleFonts.manrope(
                                fontWeight: FontWeight.w700,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ),
                          title: Text(step.stage, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                          subtitle: Text(step.detail, style: GoogleFonts.inter()),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _SectionCard(
                  title: 'Tooling & storefront',
                  subtitle: 'Reassure clients with visibility into assets and inventory available for deployments.',
                  child: _ToolingInventoryView(items: profile.tooling),
                  child: Column(
                    children: profile.tooling
                        .map(
                          (item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(item.name, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                              subtitle: Text(item.description, style: GoogleFonts.inter()),
                            ),
                          ),
                        )
                        .toList(),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const StorefrontScreen(),
                        ),
                      ),
                      icon: const Icon(Icons.storefront_outlined),
                      label: const Text('Gestionar escaparate y listados'),
                    ),
                  ),
                ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            sliver: SliverToBoxAdapter(
              child: _SectionCard(
                title: 'Legal & compliance',
                subtitle: 'Surface Fixnado legal documentation on mobile for fast contract acceptance and audit readiness.',
                child: const _LegalTermsAccessPane(),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
            sliver: SliverToBoxAdapter(
              child: _SectionCard(
                  title: 'Public profile controls',
                  subtitle: 'Choose how buyers can interact with your profile from mobile and web.',
                  child: Column(
                    children: [
                      SwitchListTile.adaptive(
                        value: draft.shareProfile,
                        onChanged: controller.updateShareProfile,
                        title: const Text('Shareable profile link'),
                        subtitle: const Text('Allow concierge teams to copy and share your profile URL.'),
                      ),
                      SwitchListTile.adaptive(
                        value: draft.requestQuote,
                        onChanged: controller.updateRequestQuote,
                        title: const Text('Enable request-a-quote'),
                        subtitle: const Text('Expose the "Request quote" action for enterprise buyers.'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 48),
              sliver: SliverToBoxAdapter(
                child: Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: state.hasUnsavedChanges && !state.isSaving ? () => controller.saveChanges() : null,
                        icon: state.isSaving
                            ? SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Theme.of(context).colorScheme.onPrimary,
                                  ),
                                ),
                              )
                            : const Icon(Icons.save_outlined),
                        label: const Text('Save changes'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: state.hasUnsavedChanges && !state.isSaving ? controller.discardChanges : null,
                        child: const Text('Discard'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else
            const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }

  void _showPrivacyContacts() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      builder: (context) {
        final theme = Theme.of(context);
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Privacy Office contacts', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              Text(
                'Reach the Blackwellen Ltd Privacy Office for signed data processing addenda, DPIA templates, and regulator-facing queries.',
                style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 20),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                  foregroundColor: theme.colorScheme.primary,
                  child: const Icon(Icons.mail_outline),
                ),
                title: Text('privacy@fixnado.com', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                subtitle: Text('Primary contact • 5 business hour SLA', style: GoogleFonts.inter(fontSize: 13)),
              ),
              const SizedBox(height: 8),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: theme.colorScheme.secondaryContainer,
                  foregroundColor: theme.colorScheme.onSecondaryContainer,
                  child: const Icon(Icons.phone_outlined),
                ),
                title: Text('+44 20 7993 5520', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                subtitle: Text('Security hotline • 24/7 escalation', style: GoogleFonts.inter(fontSize: 13)),
              ),
              const SizedBox(height: 8),
              Text('Include your tenant ID and a summary of the request so we can route it immediately.', style: GoogleFonts.ibmPlexMono(fontSize: 12, color: theme.colorScheme.primary)),
            ],
          ),
        );
      },
    );
  }

  void _syncController(TextEditingController controller, String value) {
    if (controller.text == value) return;
    controller.value = TextEditingValue(
      text: value,
      selection: TextSelection.collapsed(offset: value.length),
    );
  }
}

class _LegalTermsAccessPane extends ConsumerStatefulWidget {
  const _LegalTermsAccessPane();

  @override
  ConsumerState<_LegalTermsAccessPane> createState() => _LegalTermsAccessPaneState();
}

class _LegalTermsAccessPaneState extends ConsumerState<_LegalTermsAccessPane> {
  late Future<LegalTermsDocument> _future;

  @override
  void initState() {
    super.initState();
    _future = loadLegalTermsDocument();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final requestsState = ref.watch(dataRequestsControllerProvider);
    final requestsController = ref.read(dataRequestsControllerProvider.notifier);
    final numberFormat = NumberFormat.compact();
    final openRequests = requestsState.requests
        .where((request) => request.status == 'received' || request.status == 'in_progress')
        .length;
    final completedRequests = requestsState.requests.where((request) => request.status == 'completed').length;
    final latestSubmittedAt = _latestDate(
      requestsState.requests.map((request) => request.requestedAt).toList(),
    );
    final latestCompletedAt = _latestDate(
      requestsState.requests
          .where((request) => request.processedAt != null)
          .map((request) => request.processedAt!)
          .toList(),
    );

    final portalSubtitle = () {
      if (openRequests > 0) {
        final formatted = latestSubmittedAt != null ? _formatAuditDate(latestSubmittedAt) : 'recently';
        return 'Monitor ${openRequests == 1 ? 'one active GDPR request' : '$openRequests active GDPR requests'} and keep regulators informed. Last submission $formatted.';
      }
      if (completedRequests > 0) {
        final formatted = latestCompletedAt != null ? _formatAuditDate(latestCompletedAt) : 'recently';
        return 'All current GDPR actions are resolved. The most recent completion was logged $formatted.';
      }
      return 'Stay audit-ready by raising access, erasure, and rectification requests from the mobile compliance centre whenever clients reach out.';
    }();

    return FutureBuilder<LegalTermsDocument>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: ListTile(
              leading: Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: theme.colorScheme.error.withOpacity(0.08),
                ),
                child: Icon(Icons.error_outline, color: theme.colorScheme.error),
              ),
              title: Text('Legal pack unavailable',
                  style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: theme.colorScheme.error)),
              subtitle: Text(
                'Tap to retry downloading the Fixnado terms. Access is required before assignments can be accepted.',
                style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
              ),
              trailing: const Icon(Icons.refresh_rounded),
              onTap: () => setState(() => _future = loadLegalTermsDocument()),
            ),
          );
        }

        final document = snapshot.data;
        final effective = _formatLegalDate(document?.effectiveDate);
        final updated = _formatLegalDate(document?.lastUpdated);
        final version = document?.version ?? '1.1.0';

        return Column(
          children: [
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                leading: Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: theme.colorScheme.primary.withOpacity(0.08),
                  ),
                  child: Icon(Icons.gavel_outlined, color: theme.colorScheme.primary),
                ),
                title: Text('Terms and Conditions (UK)',
                    style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                subtitle: Text(
                  'Effective $effective • Updated $updated • Version $version',
                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                ),
                trailing: snapshot.connectionState == ConnectionState.waiting
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary)),
                      )
                    : const Icon(Icons.chevron_right_rounded),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const LegalTermsScreen(),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                leading: Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: theme.colorScheme.tertiary.withOpacity(0.12),
                  ),
                  child: Icon(Icons.policy_outlined, color: theme.colorScheme.tertiary),
                ),
                title: Text('Data subject requests',
                    style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                subtitle: Text(
                  portalSubtitle,
                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant, height: 1.5),
                ),
                trailing: requestsState.loading && requestsState.requests.isEmpty
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.tertiary),
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('${numberFormat.format(openRequests)} open',
                                  style: GoogleFonts.manrope(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: openRequests > 0
                                        ? theme.colorScheme.tertiary
                                        : theme.colorScheme.onSurfaceVariant,
                                  )),
                              const SizedBox(height: 4),
                              Text('${numberFormat.format(completedRequests)} completed',
                                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                            ],
                          ),
                          const SizedBox(width: 12),
                          const Icon(Icons.chevron_right_rounded),
                        ],
                      ),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const DataRequestsScreen(),
                  ),
                ),
              ),
            ),
            if (requestsState.error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: theme.colorScheme.errorContainer,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.warning_amber_rounded, color: theme.colorScheme.onErrorContainer),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Compliance metrics failed to refresh. ${requestsState.error}'.trim(),
                        style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onErrorContainer, height: 1.4),
                      ),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(foregroundColor: theme.colorScheme.onErrorContainer),
                      onPressed: () => requestsController.load(status: requestsState.statusFilter),
                      child: const Text('Retry'),
                    )
                  ],
                ),
              ),
            ],
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.45),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.verified_user_outlined, size: 20, color: theme.colorScheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Capture signatures and GDPR fulfilment proof in one place so compliance and account teams can confidently accept new work orders.',
                      style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  String _formatLegalDate(String? raw) {
    if (raw == null || raw.isEmpty) {
      return '01 May 2024';
    }
    try {
      final parsed = DateTime.parse(raw);
      return DateFormat.yMMMMd().format(parsed);
    } catch (_) {
      return raw;
    }
  }

  DateTime? _latestDate(List<DateTime> dates) {
    if (dates.isEmpty) {
      return null;
    }
    return dates.reduce((a, b) => a.isAfter(b) ? a : b);
  }

  String _formatAuditDate(DateTime? date) {
    if (date == null) {
      return 'recently';
    }
    return DateFormat.yMMMMd().format(date.toLocal());
  }
}

class _ToolingInventoryView extends StatelessWidget {
  const _ToolingInventoryView({required this.items});

  final List<ToolingItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text(
          'Tooling data will populate once inventory synchronises.',
          style: GoogleFonts.inter(color: Theme.of(context).colorScheme.outline),
        ),
      );
    }

    final numberFormat = NumberFormat.decimalPattern();
    final totalAvailable = items.fold<int>(0, (sum, item) => sum + (item.available ?? 0));
    final totalOnHand = items.fold<int>(0, (sum, item) => sum + (item.onHand ?? item.available ?? 0));
    final totalAlerts = items.fold<int>(0, (sum, item) => sum + (item.activeAlerts ?? 0));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _ToolingSummaryCard(
              title: 'Available units',
              value: numberFormat.format(totalAvailable),
              helper: '${numberFormat.format(items.length)} SKUs tracked',
            ),
            _ToolingSummaryCard(
              title: 'On hand',
              value: numberFormat.format(totalOnHand),
              helper: '${numberFormat.format(totalOnHand - totalAvailable)} reserved',
            ),
            _ToolingSummaryCard(
              title: 'Alerts',
              value: numberFormat.format(totalAlerts),
              helper: totalAlerts > 0 ? 'Action required' : 'All healthy',
              accentColor: totalAlerts > 0
                  ? Theme.of(context).colorScheme.error
                  : Theme.of(context).colorScheme.primary,
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...items.map((item) => _ToolingTile(item: item)).toList(),
      ],
    );
  }
}

class _ToolingSummaryCard extends StatelessWidget {
  const _ToolingSummaryCard({
    required this.title,
    required this.value,
    required this.helper,
    this.accentColor,
  });

  final String title;
  final String value;
  final String helper;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    final color = accentColor ?? Theme.of(context).colorScheme.primary;
    return Container(
      constraints: const BoxConstraints(minWidth: 200),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: GoogleFonts.inter(letterSpacing: 2, fontSize: 10, color: color.withOpacity(0.7))),
          const SizedBox(height: 6),
          Text(value, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 4),
          Text(helper, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.outline)),
        ],
      ),
    );
  }
}

class _ToolingTile extends StatelessWidget {
  const _ToolingTile({required this.item});

  final ToolingItem item;

  @override
  Widget build(BuildContext context) {
    final numberFormat = NumberFormat.decimalPattern();
    final currencyFormat = NumberFormat.simpleCurrency(name: item.rentalRateCurrency ?? 'GBP');
    final statusTone = {
      'healthy': Theme.of(context).colorScheme.primary.withOpacity(0.1),
      'low_stock': const Color(0xFFFFF3E0),
      'stockout': const Color(0xFFFFEBEE)
    };
    final statusLabel = item.status != null ? item.status!.replaceAll('_', ' ') : 'status unknown';
    final maintenanceLabel = item.nextMaintenanceDue != null
        ? DateFormat('d MMM yyyy').format(item.nextMaintenanceDue!.toLocal())
        : null;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.4)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.name, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                    if (item.description.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(item.description, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.outline)),
                      ),
                  ],
                ),
              ),
              if (item.status != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusTone[item.status] ?? Theme.of(context).colorScheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Theme.of(context).colorScheme.outline.withOpacity(0.2)),
                  ),
                  child: Text(statusLabel.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              _MetricChip(label: 'Available', value: numberFormat.format(item.available ?? 0)),
              _MetricChip(label: 'Reserved', value: numberFormat.format(item.reserved ?? 0)),
              _MetricChip(label: 'On hand', value: numberFormat.format(item.onHand ?? (item.available ?? 0))),
              if (item.safetyStock != null)
                _MetricChip(label: 'Safety', value: numberFormat.format(item.safetyStock!)),
              if (item.activeRentals != null)
                _MetricChip(label: 'Active rentals', value: numberFormat.format(item.activeRentals!)),
              if (item.activeAlerts != null)
                _MetricChip(label: 'Alerts', value: numberFormat.format(item.activeAlerts!)),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              if (item.location != null)
                _InfoLine(icon: Icons.place_outlined, label: item.location!),
              if (maintenanceLabel != null)
                _InfoLine(icon: Icons.event_available_outlined, label: 'Next service $maintenanceLabel'),
              if (item.rentalRate != null)
                _InfoLine(
                  icon: Icons.currency_pound,
                  label: 'Rate ${currencyFormat.format(item.rentalRate)} / day',
                ),
              if (item.depositAmount != null)
                _InfoLine(
                  icon: Icons.lock_outline,
                  label: 'Deposit ${currencyFormat.format(item.depositAmount)}',
                ),
              if (item.sku != null)
                _InfoLine(icon: Icons.qr_code_2, label: 'SKU ${item.sku}'),
              if (item.notes != null && item.notes!.isNotEmpty)
                _InfoLine(icon: Icons.notes, label: item.notes!),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text('$label: $value', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 6),
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.outline)),
      ],
    );
  }
}

class AffiliateProgrammeCard extends StatelessWidget {
  const AffiliateProgrammeCard({super.key, required this.snapshot});

  final AffiliateProgrammeSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currency = NumberFormat.simpleCurrency();
    final referrals = snapshot.referrals.take(3).toList();
    final tiers = snapshot.tiers.take(3).toList();

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [Color(0xFFF8FAFF), Color(0xFFEFF4FF), Color(0xFFE9F5FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.08),
            blurRadius: 22,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Affiliate programme', style: GoogleFonts.inter(letterSpacing: 4, fontSize: 11, color: theme.colorScheme.primary.withOpacity(0.7))),
            const SizedBox(height: 8),
            Text(
              snapshot.tierLabel != null ? '${snapshot.tierLabel} affiliate revenue intelligence' : 'Affiliate revenue intelligence',
              style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: theme.colorScheme.primary),
            ),
            const SizedBox(height: 6),
            Text(
              'Monitor the enterprise affiliate stream with parity across web and mobile. Guardrails shown here align with the admin dashboard configuration.',
              style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 18),
            DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.white,
                border: Border.all(color: theme.colorScheme.primary.withOpacity(0.08)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Referral code', style: GoogleFonts.inter(fontSize: 11, letterSpacing: 2.5, color: theme.colorScheme.primary.withOpacity(0.6))),
                    const SizedBox(height: 6),
                    Text(snapshot.referralCode.toUpperCase(), style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text('Status: ${snapshot.status.toUpperCase()}', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            LayoutBuilder(
              builder: (context, constraints) {
                final isCompact = constraints.maxWidth < 540;
                final metrics = [
                  _AffiliateMetric('Commission approved', currency.format(snapshot.totalCommission)),
                  _AffiliateMetric('Revenue influenced', currency.format(snapshot.totalRevenue)),
                  _AffiliateMetric('Pending commission', currency.format(snapshot.pendingCommission)),
                ];
                return isCompact
                    ? Column(children: metrics.map((metric) => Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: metric)).toList())
                    : Row(children: metrics.map((metric) => Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: metric))).toList());
              },
            ),
            const SizedBox(height: 18),
            Text('Commission tiers', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: tiers.isNotEmpty
                  ? tiers
                      .map(
                        (tier) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            color: Colors.white,
                            border: Border.all(color: theme.colorScheme.primary.withOpacity(0.12)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${tier.tierLabel} • ${tier.name}', style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                              const SizedBox(height: 4),
                              Text('${tier.commissionRate.toStringAsFixed(2)}% commission', style: GoogleFonts.inter(fontSize: 12)),
                              const SizedBox(height: 2),
                              Text(
                                '${currency.format(tier.minValue)} – ${tier.maxValue != null ? currency.format(tier.maxValue!) : '∞'} • ${_formatRecurrence(tier)}',
                                style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList()
                  : [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          color: Colors.white,
                          border: Border.all(color: theme.colorScheme.primary.withOpacity(0.12)),
                        ),
                        child: Text('Commission tiers will appear once configured in admin.', style: GoogleFonts.inter(fontSize: 12)),
                      ),
                    ],
            ),
            const SizedBox(height: 18),
            Text('Payout guardrails', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
            const SizedBox(height: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _GuardrailLine(label: 'Payout cadence', value: 'Every ${snapshot.settings.payoutCadenceDays} days'),
                _GuardrailLine(label: 'Minimum payout', value: currency.format(snapshot.settings.minimumPayout)),
                _GuardrailLine(label: 'Attribution window', value: '${snapshot.settings.attributionWindowDays} days'),
                _GuardrailLine(label: 'Auto approval', value: snapshot.settings.autoApprove ? 'Enabled for trusted partners' : 'Manual review'),
                if (snapshot.settings.disclosureUrl != null)
                  _GuardrailLine(label: 'Disclosure', value: snapshot.settings.disclosureUrl!),
              ],
            ),
            if (referrals.isNotEmpty) ...[
              const SizedBox(height: 18),
              Text('Recent referrals', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
              const SizedBox(height: 8),
              Column(
                children: referrals
                    .map(
                      (ref) => Container(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: theme.colorScheme.primary.withOpacity(0.08)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(ref.code.toUpperCase(), style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                                  const SizedBox(height: 2),
                                  Text('${ref.conversions} conversions • ${ref.status}', style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(currency.format(ref.revenue), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                                Text('${currency.format(ref.commission)} commission', style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatRecurrence(AffiliateCommissionTier tier) {
    switch (tier.recurrence) {
      case 'infinite':
        return 'Infinite';
      case 'finite':
        final limit = tier.recurrenceLimit;
        return limit != null ? '$limit conversions' : 'Finite window';
      default:
        return 'One time';
    }
  }
}

class _AffiliateMetric extends StatelessWidget {
  const _AffiliateMetric(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white,
        border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Text(value, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.primary)),
        ],
      ),
    );
  }
}

class _GuardrailLine extends StatelessWidget {
  const _GuardrailLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ),
          Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary)),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(subtitle, style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant)),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

class _ServiceCatalogueList extends StatelessWidget {
  const _ServiceCatalogueList({required this.services});

  final List<ServiceOffering> services;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: services
          .map(
            (service) => Container(
              margin: const EdgeInsets.symmetric(vertical: 6),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(service.name, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text(service.description, style: GoogleFonts.inter(fontSize: 13)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (service.price != null)
                        Chip(
                          label: Text(
                            _formatPrice(service.price!, service.currency),
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                          ),
                          avatar: const Icon(Icons.currency_exchange_outlined, size: 16),
                        ),
                      if (service.availabilityDetail.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Chip(
                          label: Text(service.availabilityDetail, style: GoogleFonts.inter(fontSize: 12)),
                          avatar: const Icon(Icons.schedule_outlined, size: 16),
                        ),
                      ],
                    ],
                  ),
                  if (service.coverage.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: service.coverage
                          .map((zone) => Chip(label: Text(zone, style: GoogleFonts.inter(fontSize: 12))))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          )
          .toList(),
    );
  }

  String _formatPrice(double value, String? currency) {
    final code = (currency != null && currency.isNotEmpty) ? currency : null;
    final formatter = NumberFormat.simpleCurrency(name: code);
    return formatter.format(value);
  }
}

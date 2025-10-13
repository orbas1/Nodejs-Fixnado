import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../auth/domain/role_scope.dart';
import '../domain/profile_models.dart';
import 'profile_controller.dart';
import '../../storefront/presentation/storefront_screen.dart';

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
          if (draft != null && profile != null) ...[
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

  void _syncController(TextEditingController controller, String value) {
    if (controller.text == value) return;
    controller.value = TextEditingValue(
      text: value,
      selection: TextSelection.collapsed(offset: value.length),
    );
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

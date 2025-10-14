import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  late Future<PrivacyPolicy> _policyFuture;
  final Map<String, GlobalKey> _sectionKeys = {};

  @override
  void initState() {
    super.initState();
    _policyFuture = _loadPolicy();
  }

  Future<PrivacyPolicy> _loadPolicy() async {
    final raw = await rootBundle.loadString('assets/legal/privacy_policy_content.json');
    final data = jsonDecode(raw) as Map<String, dynamic>;
    return PrivacyPolicy.fromJson(data);
  }

  void _scrollToSection(String id) {
    final context = _sectionKeys[id]?.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        alignment: 0.08,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Privacy policy', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
      ),
      body: FutureBuilder<PrivacyPolicy>(
        future: _policyFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError || !snapshot.hasData) {
            return _ErrorState(onRetry: () => setState(() => _policyFuture = _loadPolicy()));
          }

          final policy = snapshot.data!;
          final sections = policy.sections;

          return CustomScrollView(
            padding: EdgeInsets.zero,
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: _PolicyHero(meta: policy.meta, onNavigate: _scrollToSection),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: _MetaStrip(meta: policy.meta),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                sliver: SliverList.separated(
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemCount: sections.length,
                  itemBuilder: (context, index) {
                    final section = sections[index];
                    final key = _sectionKeys.putIfAbsent(section.id, () => GlobalKey());
                    return KeyedSubtree(
                      key: key,
                      child: _SectionCard(section: section, owner: policy.meta.owner, theme: theme),
                    );
                  },
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                sliver: SliverToBoxAdapter(
                  child: _SecurityBanner(),
                ),
              )
            ],
          );
        },
      ),
    );
  }
}

class _PolicyHero extends StatelessWidget {
  const _PolicyHero({required this.meta, required this.onNavigate});

  final PrivacyMeta meta;
  final void Function(String id) onNavigate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [theme.colorScheme.primary.withOpacity(0.08), theme.colorScheme.secondary.withOpacity(0.08)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.12)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              'Legal & compliance',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 2.2,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(meta.title, style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w800, height: 1.2, color: theme.colorScheme.onSurface)),
          const SizedBox(height: 12),
          Text(meta.summary, style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: theme.colorScheme.onSurface.withOpacity(0.8))),
          const SizedBox(height: 20),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _HeroChip(icon: Icons.verified_user_outlined, label: 'Owned by ${meta.owner}'),
              _HeroChip(icon: Icons.history_toggle_off_outlined, label: 'Effective ${meta.formattedEffectiveDate}'),
              _HeroChip(icon: Icons.rule_folder_outlined, label: 'Version ${meta.version}'),
            ],
          ),
          const SizedBox(height: 20),
          _QuickLinks(onNavigate: onNavigate),
        ],
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
        ],
      ),
    );
  }
}

class _QuickLinks extends StatelessWidget {
  const _QuickLinks({required this.onNavigate});

  final void Function(String id) onNavigate;

  static const _anchors = [
    ('data-we-collect', 'Data we collect'),
    ('security', 'Security & RBAC'),
    ('data-rights', 'Your rights'),
    ('incident-response', 'Incident response'),
    ('contact', 'Contact the Privacy Office'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Jump to a section', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurface)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _anchors
              .map(
                (anchor) => ActionChip(
                  onPressed: () => onNavigate(anchor.$1),
                  avatar: const Icon(Icons.arrow_outward, size: 16),
                  label: Text(anchor.$2, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _MetaStrip extends StatelessWidget {
  const _MetaStrip({required this.meta});

  final PrivacyMeta meta;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.12)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.08),
            blurRadius: 18,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Row(
        children: [
          _MetaTile(
            title: 'Effective date',
            value: meta.formattedEffectiveDate,
            icon: Icons.event_available_outlined,
          ),
          _MetaDivider(color: theme.colorScheme.primary.withOpacity(0.12)),
          _MetaTile(
            title: 'Version',
            value: meta.version,
            icon: Icons.layers_outlined,
          ),
          _MetaDivider(color: theme.colorScheme.primary.withOpacity(0.12)),
          Expanded(
            child: _MetaTile(
              title: 'Owner',
              value: meta.owner,
              icon: Icons.verified_outlined,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaTile extends StatelessWidget {
  const _MetaTile({required this.title, required this.value, required this.icon});

  final String title;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
          foregroundColor: theme.colorScheme.primary,
          child: Icon(icon),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.inter(fontSize: 11, letterSpacing: 1.8, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 4),
            Text(value, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurface)),
          ],
        ),
      ],
    );
  }
}

class _MetaDivider extends StatelessWidget {
  const _MetaDivider({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 48, margin: const EdgeInsets.symmetric(horizontal: 16), color: color);
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.section, required this.owner, required this.theme});

  final PrivacySection section;
  final String owner;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.12)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.06),
            blurRadius: 18,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(owner.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, letterSpacing: 2.2, fontWeight: FontWeight.w700, color: theme.colorScheme.primary.withOpacity(0.6))),
          const SizedBox(height: 8),
          Text(section.title, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
          const SizedBox(height: 12),
          ...section.paragraphs.map(
            (paragraph) => Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(paragraph, style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: theme.colorScheme.onSurface.withOpacity(0.85))),
            ),
          ),
          if (section.lists != null)
            ...section.lists!.map(
              (list) => Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (list.title != null)
                      Text(list.title!, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                    const SizedBox(height: 8),
                    ...list.items.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(left: 14, bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('• ', style: TextStyle(fontSize: 16)),
                            Expanded(
                              child: Text(item, style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: theme.colorScheme.onSurface.withOpacity(0.85))),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SecurityBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.teal.shade50, Colors.greenAccent.shade100.withOpacity(0.4)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: Colors.teal.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.teal.shade100,
            child: const Icon(Icons.shield_moon_outlined, color: Colors.teal, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Unified security posture', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.teal.shade900)),
                const SizedBox(height: 6),
                Text(
                  'Fixnado web and mobile share the same privacy controls, RBAC rules, and incident playbooks. Request SOC 2, ISO 27001, or DPIA packs from the Trust Center.',
                  style: GoogleFonts.inter(fontSize: 13, height: 1.6, color: Colors.teal.shade900),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_tethering_error_rounded, size: 56, color: theme.colorScheme.error),
          const SizedBox(height: 16),
          Text('We could not load the privacy policy.', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text('Check your connection or try again in a moment. The policy is also available on the Fixnado web experience.', style: GoogleFonts.inter(fontSize: 14, height: 1.6), textAlign: TextAlign.center),
          const SizedBox(height: 20),
          FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('Retry')),
        ],
      ),
    );
  }
}

class PrivacyPolicy {
  PrivacyPolicy({required this.meta, required this.sections});

  factory PrivacyPolicy.fromJson(Map<String, dynamic> json) {
    return PrivacyPolicy(
      meta: PrivacyMeta.fromJson(json['meta'] as Map<String, dynamic>),
      sections: (json['sections'] as List<dynamic>)
          .map((section) => PrivacySection.fromJson(section as Map<String, dynamic>))
          .toList(),
    );
  }

  final PrivacyMeta meta;
  final List<PrivacySection> sections;
}

class PrivacyMeta {
  PrivacyMeta({required this.title, required this.version, required this.effectiveDate, required this.owner, required this.summary});

  factory PrivacyMeta.fromJson(Map<String, dynamic> json) {
    final effectiveDate = DateTime.tryParse(json['effectiveDate'] as String? ?? '');
    return PrivacyMeta(
      title: json['title'] as String,
      version: json['version'] as String,
      effectiveDate: effectiveDate,
      owner: json['owner'] as String,
      summary: json['summary'] as String,
    );
  }

  final String title;
  final String version;
  final DateTime? effectiveDate;
  final String owner;
  final String summary;

  String get formattedEffectiveDate {
    if (effectiveDate == null) return 'Unspecified';
    return '${effectiveDate!.day.toString().padLeft(2, '0')} ${_monthNames[effectiveDate!.month - 1]} ${effectiveDate!.year}';
  }
}

const _monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

class PrivacySection {
  PrivacySection({required this.id, required this.title, required this.paragraphs, this.lists});

  factory PrivacySection.fromJson(Map<String, dynamic> json) {
    return PrivacySection(
      id: json['id'] as String,
      title: json['title'] as String,
      paragraphs: (json['paragraphs'] as List<dynamic>).cast<String>(),
      lists: (json['lists'] as List<dynamic>?)?.map((item) => PrivacyList.fromJson(item as Map<String, dynamic>)).toList(),
    );
  }

  final String id;
  final String title;
  final List<String> paragraphs;
  final List<PrivacyList>? lists;
}

class PrivacyList {
  PrivacyList({this.title, required this.items});

  factory PrivacyList.fromJson(Map<String, dynamic> json) {
    return PrivacyList(
      title: json['title'] as String?,
      items: (json['items'] as List<dynamic>).cast<String>(),
    );
  }

  final String? title;
  final List<String> items;
}

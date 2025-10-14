import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../domain/legal_terms_models.dart';
import '../application/legal_terms_loader.dart';

class LegalTermsScreen extends StatefulWidget {
  const LegalTermsScreen({super.key});

  @override
  State<LegalTermsScreen> createState() => _LegalTermsScreenState();
}

class _LegalTermsScreenState extends State<LegalTermsScreen> {
  late final ScrollController _scrollController;
  late final ValueNotifier<double> _scrollProgress;
  late Future<LegalTermsDocument> _documentFuture;
  final Map<String, GlobalKey> _sectionKeys = <String, GlobalKey>{};

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_handleScroll);
    _scrollProgress = ValueNotifier<double>(0);
    _documentFuture = _loadDocument();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    _scrollProgress.dispose();
    super.dispose();
  }

  Future<LegalTermsDocument> _loadDocument() async {
    return loadLegalTermsDocument();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) {
      return;
    }
    final position = _scrollController.position;
    final max = position.maxScrollExtent;
    if (max <= 0) {
      _scrollProgress.value = 0;
      return;
    }
    final progress = (position.pixels.clamp(0, max)) / max;
    _scrollProgress.value = progress.isNaN ? 0 : progress;
  }

  void _scrollToTop() {
    if (!_scrollController.hasClients) {
      return;
    }
    _scrollController.animateTo(0, duration: const Duration(milliseconds: 450), curve: Curves.easeOutCubic);
  }

  void _scrollToSection(String sectionId) {
    final key = _sectionKeys[sectionId];
    final context = key?.currentContext;
    if (context == null) {
      return;
    }
    Scrollable.ensureVisible(
      context,
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutCubic,
      alignment: 0.05,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Terms & Conditions', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
        actions: [
          ValueListenableBuilder<double>(
            valueListenable: _scrollProgress,
            builder: (context, value, child) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: value,
                  minHeight: 6,
                  backgroundColor: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                  valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
                ),
              ),
            ),
          )
        ],
      ),
      body: FutureBuilder<LegalTermsDocument>(
        future: _documentFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _LegalErrorView(onRetry: () => setState(() => _documentFuture = _loadDocument()));
          }
          final document = snapshot.data;
          if (document == null) {
            return _LegalErrorView(onRetry: () => setState(() => _documentFuture = _loadDocument()));
          }

          if (_sectionKeys.length != document.sections.length) {
            _sectionKeys
              ..clear()
              ..addEntries(document.sections.map((section) => MapEntry(section.id, GlobalKey())));
          }

          return CustomScrollView(
            controller: _scrollController,
            physics: const ClampingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                  child: _LegalHeroCard(document: document),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  child: _LegalContentsRail(
                    document: document,
                    onSelect: _scrollToSection,
                    scrollProgress: _scrollProgress,
                  ),
                ),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final section = document.sections[index];
                    final sectionKey = _sectionKeys[section.id]!;
                    return Padding(
                      key: sectionKey,
                      padding: EdgeInsets.fromLTRB(20, index == 0 ? 8 : 12, 20, 12),
                      child: _LegalSectionCard(section: section),
                    );
                  },
                  childCount: document.sections.length,
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                  child: _LegalAcceptanceCard(acceptance: document.acceptance),
                ),
              ),
              SliverToBoxAdapter(child: SizedBox(height: MediaQuery.of(context).padding.bottom + 16)),
            ],
          );
        },
      ),
      floatingActionButton: ValueListenableBuilder<double>(
        valueListenable: _scrollProgress,
        builder: (context, value, child) => AnimatedSlide(
          offset: value > 0.1 ? Offset.zero : const Offset(0, 0.6),
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 220),
            opacity: value > 0.1 ? 1 : 0,
            child: FloatingActionButton.extended(
              onPressed: _scrollToTop,
              icon: const Icon(Icons.arrow_upward_rounded),
              label: const Text('Back to top'),
            ),
          ),
        ),
      ),
    );
  }
}

class _LegalHeroCard extends StatelessWidget {
  const _LegalHeroCard({required this.document});

  final LegalTermsDocument document;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withOpacity(0.82),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.2),
            blurRadius: 24,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withOpacity(0.35)),
            ),
            child: Text(
              'Blackwellen Ltd • Fixnado',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            document.title,
            style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          const SizedBox(height: 12),
          Text(
            'Fixnado marketplace terms for England and Wales.',
            style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: Colors.white.withOpacity(0.84)),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              _LegalHeroMetaChip(label: 'Effective', value: document.effectiveDate),
              _LegalHeroMetaChip(label: 'Last updated', value: document.lastUpdated),
              _LegalHeroMetaChip(label: 'Jurisdiction', value: document.jurisdiction),
              _LegalHeroMetaChip(label: 'Version', value: document.version),
            ],
          ),
        ],
      ),
    );
  }
}

class _LegalHeroMetaChip extends StatelessWidget {
  const _LegalHeroMetaChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, color: Colors.white70, letterSpacing: 1.8)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
      ],
    );
  }
}

class _LegalContentsRail extends StatelessWidget {
  const _LegalContentsRail({
    required this.document,
    required this.onSelect,
    required this.scrollProgress,
  });

  final LegalTermsDocument document;
  final void Function(String sectionId) onSelect;
  final ValueNotifier<double> scrollProgress;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.4)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.outlineVariant.withOpacity(0.08),
            blurRadius: 18,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.article_outlined, size: 20),
              const SizedBox(width: 8),
              Text('Contents', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
              const Spacer(),
              ValueListenableBuilder<double>(
                valueListenable: scrollProgress,
                builder: (context, value, child) => Text(
                  '${(value * 100).clamp(0, 100).toStringAsFixed(0)}% read',
                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: document.sections
                .map(
                  (section) => ActionChip(
                    label: Text(section.title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                    onPressed: () => onSelect(section.id),
                    backgroundColor: theme.colorScheme.surfaceVariant.withOpacity(0.4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 0,
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
          _LegalContactBlock(contact: document.contact),
        ],
      ),
    );
  }
}

class _LegalContactBlock extends StatelessWidget {
  const _LegalContactBlock({required this.contact});

  final LegalTermsContact contact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Regulated contact points', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text('Email: ${contact.email}', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text('Telephone: ${contact.telephone}',
              style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text('Postal: ${contact.postal}',
              style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _LegalSectionCard extends StatelessWidget {
  const _LegalSectionCard({required this.section});

  final LegalTermsSection section;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: theme.colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26), side: BorderSide(color: theme.colorScheme.outlineVariant.withOpacity(0.35))),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(section.title, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(section.summary, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 18),
            ...section.clauses.map((clause) => _LegalClauseBlock(clause: clause)).toList(),
          ],
        ),
      ),
    );
  }
}

class _LegalClauseBlock extends StatelessWidget {
  const _LegalClauseBlock({required this.clause});

  final LegalTermsClause clause;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (clause.heading.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(clause.heading, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ...clause.content.map(
            (paragraph) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(paragraph, style: GoogleFonts.inter(fontSize: 14, height: 1.55)),
            ),
          ),
          if (clause.bullets != null && clause.bullets!.items.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: clause.bullets!.isOrdered
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: clause.bullets!.items
                          .asMap()
                          .entries
                          .map((entry) => Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Text('${entry.key + 1}. ${entry.value}',
                                    style: GoogleFonts.inter(fontSize: 13, height: 1.5)),
                              ))
                          .toList(),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: clause.bullets!.items
                          .map((item) => Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Padding(
                                      padding: EdgeInsets.only(top: 6),
                                      child: Icon(Icons.circle, size: 6),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(item, style: GoogleFonts.inter(fontSize: 13, height: 1.5)),
                                    ),
                                  ],
                                ),
                              ))
                          .toList(),
                    ),
            ),
        ],
      ),
    );
  }
}

class _LegalAcceptanceCard extends StatelessWidget {
  const _LegalAcceptanceCard({required this.acceptance});

  final LegalTermsAcceptance acceptance;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26), side: BorderSide(color: theme.colorScheme.outlineVariant.withOpacity(0.35))),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Acceptance', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text(acceptance.statement, style: GoogleFonts.inter(fontSize: 14, height: 1.6)),
            const SizedBox(height: 16),
            ...acceptance.requiredActions
                .map(
                  (action) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 18),
                        const SizedBox(width: 10),
                        Expanded(child: Text(action, style: GoogleFonts.inter(fontSize: 13, height: 1.5))),
                      ],
                    ),
                  ),
                )
                .toList(),
          ],
        ),
      ),
    );
  }
}

class _LegalErrorView extends StatelessWidget {
  const _LegalErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
            const SizedBox(height: 16),
            Text('Unable to load legal content',
                style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: theme.colorScheme.error)),
            const SizedBox(height: 8),
            Text(
              'Check your connection and try again. The Fixnado legal pack must be accessible to complete onboarding.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            )
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../analytics/presentation/analytics_dashboard_screen.dart';
import '../../communications/presentation/communications_screen.dart';
import '../domain/about_content.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final headingStyle = GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700, color: const Color(0xFF0B1D3A));
    final bodyStyle = GoogleFonts.inter(fontSize: 14, height: 1.6, color: Colors.blueGrey.shade700);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FA),
      appBar: AppBar(
        title: Text('About Fixnado', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        foregroundColor: theme.colorScheme.onSurface,
        elevation: 0,
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _HeroSection(bodyStyle: bodyStyle),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _PillarsSection(bodyStyle: bodyStyle),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _MissionSection(bodyStyle: bodyStyle, headingStyle: headingStyle),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _LeadershipSection(bodyStyle: bodyStyle, headingStyle: headingStyle),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _TrustSection(bodyStyle: bodyStyle, headingStyle: headingStyle),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _TimelineSection(bodyStyle: bodyStyle, headingStyle: headingStyle),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
            sliver: SliverToBoxAdapter(
              child: _OfficesSection(bodyStyle: bodyStyle, headingStyle: headingStyle),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 32),
            sliver: SliverToBoxAdapter(
              child: _ReadinessSection(bodyStyle: bodyStyle, headingStyle: headingStyle),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({required this.bodyStyle});

  final TextStyle bodyStyle;

  @override
  Widget build(BuildContext context) {
    final heroTitle = GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white);
    final heroBody = bodyStyle.copyWith(color: Colors.white.withOpacity(0.85));

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0B1D3A), Color(0xFF0B1D3A), Color(0xFF1F4ED8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 32, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: Text('ABOUT FIXNADO', style: GoogleFonts.ibmPlexMono(fontSize: 12, color: Colors.white70, letterSpacing: 2)),
            ),
            const SizedBox(height: 18),
            Text(
              'Building the trusted infrastructure for complex fix and response programmes',
              style: heroTitle,
            ),
            const SizedBox(height: 14),
            Text(
              'Fixnado brings together vetted specialists, resilient logistics, and compliance-ready workflows so every incident is handled with enterprise guardrails in place.',
              style: heroBody,
            ),
            const SizedBox(height: 24),
            LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 640;
                final itemWidth = isWide
                    ? (constraints.maxWidth - 12) / 2
                    : constraints.maxWidth;
                return Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: aboutMetrics
                      .map(
                        (metric) => SizedBox(
                          width: itemWidth,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: Colors.white.withOpacity(0.12)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(metric.value, style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
                                const SizedBox(height: 6),
                                Text(metric.label, style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.85))),
                                const SizedBox(height: 8),
                                Text(metric.caption, style: GoogleFonts.inter(fontSize: 11, color: Colors.white54)),
                              ],
                            ),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                FilledButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AnalyticsDashboardScreen()),
                  ),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Create an enterprise account'),
                  style: FilledButton.styleFrom(
                    foregroundColor: const Color(0xFF0B1D3A),
                    backgroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w600),
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CommunicationsScreen()),
                  ),
                  icon: const Icon(Icons.support_agent_outlined, color: Colors.white),
                  label: const Text('Talk to our command centre'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white70),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w600),
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

class _PillarsSection extends StatelessWidget {
  const _PillarsSection({required this.bodyStyle});

  final TextStyle bodyStyle;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 900
            ? 3
            : constraints.maxWidth > 600
                ? 2
                : 1;
        final gap = 16.0;
        final cardWidth = crossAxisCount == 1
            ? constraints.maxWidth
            : (constraints.maxWidth - gap * (crossAxisCount - 1)) / crossAxisCount;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: aboutPillars
              .map(
                (pillar) => SizedBox(
                  width: cardWidth,
                  child: Card(
                    color: const Color(0xFFFFFFFF),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor: const Color(0xFFE8EDFB),
                            child: Icon(pillar.icon, color: const Color(0xFF1F4ED8)),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            pillar.title,
                            style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0B1D3A)),
                          ),
                          const SizedBox(height: 10),
                          Text(pillar.description, style: bodyStyle),
                        ],
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _MissionSection extends StatelessWidget {
  const _MissionSection({required this.bodyStyle, required this.headingStyle});

  final TextStyle bodyStyle;
  final TextStyle headingStyle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          color: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
          elevation: 0,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Our mission', style: headingStyle),
                const SizedBox(height: 12),
                Text(
                  'We are obsessed with reliability. Our mission is to connect demand and supply in seconds while upholding the standards expected from heavily regulated programmes.',
                  style: bodyStyle,
                ),
                const SizedBox(height: 12),
                Text(
                  'Every workflow is designed with resilience, transparency, and human support in mind so that critical incidents are resolved before they escalate.',
                  style: bodyStyle,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          color: const Color(0xFFF0F4FF),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
          elevation: 0,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Governance workstreams', style: headingStyle.copyWith(fontSize: 20)),
                const SizedBox(height: 12),
                ...buildGovernanceItems(bodyStyle),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _LeadershipSection extends StatelessWidget {
  const _LeadershipSection({required this.bodyStyle, required this.headingStyle});

  final TextStyle bodyStyle;
  final TextStyle headingStyle;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Leadership collective', style: headingStyle),
            const SizedBox(height: 8),
            Text('Each leader is accountable for programme resilience, regulatory posture, and customer trust.', style: bodyStyle),
            const SizedBox(height: 20),
            ...aboutLeaders.map(
              (leader) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    color: const Color(0xFFF9FBFF),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(leader.name, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0B1D3A))),
                                  const SizedBox(height: 4),
                                  Text(leader.role, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF1F4ED8))),
                                ],
                              ),
                            ),
                            Chip(
                              label: Text(leader.focus, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                              backgroundColor: const Color(0xFFE8EDFB),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(leader.bio, style: bodyStyle),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrustSection extends StatelessWidget {
  const _TrustSection({required this.bodyStyle, required this.headingStyle});

  final TextStyle bodyStyle;
  final TextStyle headingStyle;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final stackAsColumn = constraints.maxWidth < 720;
        final cards = [
          Card(
            color: const Color(0xFFF0F4FF),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Zero trust architecture', style: headingStyle.copyWith(fontSize: 20)),
                  const SizedBox(height: 8),
                  Text(
                    'Internal tools enforce device posture, MFA, and least-privilege scopes. Session telemetry is audited in real time and escalations trigger within minutes.',
                    style: bodyStyle,
                  ),
                ],
              ),
            ),
          ),
          Card(
            color: const Color(0xFF0B1D3A),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Enterprise integrations', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 8),
                  Text(
                    'SOC-compliant APIs, SCIM provisioning, and SIEM-ready audit feeds keep Fixnado aligned with your security stack.',
                    style: bodyStyle.copyWith(color: Colors.white70),
                  ),
                ],
              ),
            ),
          ),
        ];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Trust centre', style: headingStyle),
            const SizedBox(height: 12),
            Text('Enterprise-grade assurance baked into every workflow.', style: bodyStyle),
            const SizedBox(height: 16),
            Card(
              color: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
              elevation: 0,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: buildTrustItems(bodyStyle),
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (stackAsColumn)
              Column(
                children: [
                  for (final card in cards) ...[
                    card,
                    const SizedBox(height: 16),
                  ],
                ],
              )
            else
              Row(
                children: [
                  Expanded(child: cards[0]),
                  const SizedBox(width: 16),
                  Expanded(child: cards[1]),
                ],
              ),
          ],
        );
      },
    );
  }
}

class _TimelineSection extends StatelessWidget {
  const _TimelineSection({required this.bodyStyle, required this.headingStyle});

  final TextStyle bodyStyle;
  final TextStyle headingStyle;

  @override
  Widget build(BuildContext context) {
    final timelineColumn = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Our story', style: headingStyle),
        const SizedBox(height: 12),
        Text(
          'We partner with safety-critical industries and iterate on the cadence of live telemetry to deliver operational excellence.',
          style: bodyStyle,
        ),
        const SizedBox(height: 16),
        ...aboutTimeline.map(
          (entry) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1D3A),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      alignment: Alignment.center,
                      child: Text(entry.year, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                    ),
                    Container(width: 2, height: 42, color: const Color(0xFFE2E8F0)),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry.title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0B1D3A))),
                      const SizedBox(height: 6),
                      Text(entry.description, style: bodyStyle),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );

    final careersCard = Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Join the team', style: headingStyle),
            const SizedBox(height: 12),
            Text(
              'We hire operators, engineers, designers, and programme leads across every region. Parity between web and mobile experiences is non-negotiable.',
              style: bodyStyle,
            ),
            const SizedBox(height: 12),
            Text('• Hybrid teams with regional command hubs and remote-first collaboration.', style: bodyStyle),
            const SizedBox(height: 6),
            Text('• Opportunities across product, engineering, operations, and partner success.', style: bodyStyle),
            const SizedBox(height: 6),
            Text('• Robust onboarding with compliance, security, and wellbeing support.', style: bodyStyle),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CommunicationsScreen()),
              ),
              icon: const Icon(Icons.work_outline),
              label: const Text('Explore open programmes'),
            ),
          ],
        ),
      ),
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 800) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              timelineColumn,
              const SizedBox(height: 20),
              careersCard,
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 6, child: timelineColumn),
            const SizedBox(width: 20),
            Expanded(flex: 5, child: careersCard),
          ],
        );
      },
    );
  }
}

class _OfficesSection extends StatelessWidget {
  const _OfficesSection({required this.bodyStyle, required this.headingStyle});

  final TextStyle bodyStyle;
  final TextStyle headingStyle;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Global footprint', style: headingStyle),
            const SizedBox(height: 12),
            Text(
              'Follow-the-sun coverage with human command oversight ensures every booking stays on track across time zones.',
              style: bodyStyle,
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: aboutOffices
                  .map(
                    (office) => Container(
                      width: 220,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF4F7FA),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.apartment_outlined, color: Color(0xFF0B1D3A)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(office.region, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0B1D3A))),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(office.focus, style: bodyStyle),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReadinessSection extends StatelessWidget {
  const _ReadinessSection({required this.bodyStyle, required this.headingStyle});

  final TextStyle bodyStyle;
  final TextStyle headingStyle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0B1D3A), Color(0xFF0B1D3A), Color(0xFF111827)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.all(Radius.circular(36)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(26),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ready for launch', style: headingStyle.copyWith(color: Colors.white)),
            const SizedBox(height: 12),
            Text(
              'Every Fixnado workflow has enterprise launch-readiness sign-off. We audit parity across web and mobile, validate security controls, and rehearse escalation paths before go-live.',
              style: bodyStyle.copyWith(color: Colors.white70),
            ),
            const SizedBox(height: 20),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: readinessHighlights
                  .map(
                    (highlight) => Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.verified_outlined, color: Colors.white70),
                          const SizedBox(width: 12),
                          Expanded(child: Text(highlight, style: bodyStyle.copyWith(color: Colors.white70))),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 20),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                FilledButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AnalyticsDashboardScreen()),
                  ),
                  icon: const Icon(Icons.auto_graph_outlined),
                  label: const Text('Explore live dashboards'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF0B1D3A),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700),
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CommunicationsScreen()),
                  ),
                  icon: const Icon(Icons.calendar_today_outlined, color: Colors.white),
                  label: const Text('Schedule readiness review'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white60),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w600),
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

import 'package:flutter/material.dart';

class AboutMetric {
  const AboutMetric({required this.label, required this.value, required this.caption});

  final String label;
  final String value;
  final String caption;
}

class AboutPillar {
  const AboutPillar({required this.title, required this.description, required this.icon});

  final String title;
  final String description;
  final IconData icon;
}

class AboutLeader {
  const AboutLeader({required this.name, required this.role, required this.bio, required this.focus});

  final String name;
  final String role;
  final String bio;
  final String focus;
}

class AboutTimelineEntry {
  const AboutTimelineEntry({required this.year, required this.title, required this.description});

  final String year;
  final String title;
  final String description;
}

class AboutOffice {
  const AboutOffice({required this.region, required this.focus});

  final String region;
  final String focus;
}

const aboutMetrics = [
  AboutMetric(
    label: 'Active enterprise programmes',
    value: '186',
    caption: 'Cross-sector deployments orchestrated in 2024.',
  ),
  AboutMetric(
    label: 'Verified field specialists',
    value: '9.8k',
    caption: 'Tradespeople, engineers, and incident responders vetted annually.',
  ),
  AboutMetric(
    label: 'Escrow-secured payouts',
    value: '£142m',
    caption: 'Payments governed by tri-party escrow with live monitoring.',
  ),
  AboutMetric(
    label: 'Global response centres',
    value: '5',
    caption: 'Follow-the-sun command centres for mission-critical cover.',
  ),
];

const aboutPillars = [
  AboutPillar(
    title: 'Operational discipline',
    description:
        'Runbooks, redundancy testing, and ISO-aligned playbooks ensure the marketplace behaves predictably in every territory.',
    icon: Icons.rule_folder_outlined,
  ),
  AboutPillar(
    title: 'People first',
    description:
        'We invest in credentialing, wellbeing, and fair access programmes to sustain a resilient, motivated workforce.',
    icon: Icons.groups_3_outlined,
  ),
  AboutPillar(
    title: 'Security by design',
    description:
        'Encryption, continuous monitoring, and RBAC guardrails are embedded across our platform and operational tooling.',
    icon: Icons.verified_user_outlined,
  ),
];

const aboutLeaders = [
  AboutLeader(
    name: 'Amelia Hart',
    role: 'Chief Executive Officer',
    bio: '15 years building regulated marketplaces for utilities and emergency response networks.',
    focus: 'Strategy & trust',
  ),
  AboutLeader(
    name: 'Noah Odum',
    role: 'Chief Operations Officer',
    bio: 'Former RAF logistics lead focused on resilient field operations and supply chain parity.',
    focus: 'Global operations',
  ),
  AboutLeader(
    name: 'Priya Banerjee',
    role: 'Chief Technology Officer',
    bio: 'Scaled multi-cloud orchestration at fintech and healthcare firms with ISO 27001 and SOC 2 leadership.',
    focus: 'Platform integrity',
  ),
  AboutLeader(
    name: 'James Osei',
    role: 'Chief Customer Officer',
    bio: 'Previously led enterprise success for pan-European facilities programmes.',
    focus: 'Customer resilience',
  ),
];

const aboutTimeline = [
  AboutTimelineEntry(
    year: '2019',
    title: 'Fixnado founded',
    description: 'Focused on closing the gap between on-demand repairs and enterprise-grade governance.',
  ),
  AboutTimelineEntry(
    year: '2021',
    title: 'Escrow & compliance launch',
    description: 'Introduced tri-party escrow, digital credentials, and dispute concierge coverage.',
  ),
  AboutTimelineEntry(
    year: '2023',
    title: 'Mobile parity achieved',
    description: 'Released the Fixnado mobile suite with offline resilience and operational parity.',
  ),
  AboutTimelineEntry(
    year: '2024',
    title: 'Global response network',
    description: 'Opened command centres in Manchester, Austin, Singapore, Toronto, and Cape Town.',
  ),
];

const aboutTrustControls = [
  'ISO 27001 & SOC 2 Type II with continuous monitoring.',
  'GDPR, HIPAA, and regional data residency pathways.',
  'Escrow-backed payouts with dispute concierge coverage.',
  'Zero trust architecture with device posture validation.',
];

const governanceWorkstreams = [
  'Quarterly resilience drills across every command centre.',
  'Continuous vulnerability scanning and dependency hygiene.',
  'Role-based controls with policy-as-code enforcement.',
  'Dedicated data protection office and privacy guild.',
];

const aboutOffices = [
  AboutOffice(
    region: 'Manchester (HQ)',
    focus: 'Marketplace command, talent operations, and trust office.',
  ),
  AboutOffice(
    region: 'Austin',
    focus: 'US enterprise delivery, energy sector programmes, and fleet logistics.',
  ),
  AboutOffice(
    region: 'Singapore',
    focus: 'APAC compliance, maritime partnerships, and supplier onboarding.',
  ),
  AboutOffice(
    region: 'Toronto',
    focus: 'North American dispatch, bilingual support, and analytics innovation hub.',
  ),
  AboutOffice(
    region: 'Cape Town',
    focus: '24/7 command coverage, resiliency drills, and mobile QA lab.',
  ),
];

const readinessHighlights = [
  'Parity assurance for every mobile release, validated against web UX.',
  'Security posture validated with automated scanning and manual review.',
];

List<Widget> buildGovernanceItems(TextStyle style) => governanceWorkstreams
    .map(
      (item) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.check_circle_outline, size: 20, color: Color(0xFF1F4ED8)),
            const SizedBox(width: 12),
            Expanded(child: Text(item, style: style)),
          ],
        ),
      ),
    )
    .toList();

List<Widget> buildTrustItems(TextStyle style) => aboutTrustControls
    .map(
      (item) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.shield_outlined, size: 20, color: Color(0xFF1F4ED8)),
            const SizedBox(width: 12),
            Expanded(child: Text(item, style: style)),
          ],
        ),
      ),
    )
    .toList();
